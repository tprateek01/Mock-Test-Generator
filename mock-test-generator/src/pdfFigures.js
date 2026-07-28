// pdfFigures.js
// Turns the AI's "there's a figure at page N, box [x0,y0,x1,y1]" answers
// into real cropped-out picture files, by actually rendering that PDF page
// with pdf.js (the same well-tested rendering path every PDF viewer uses)
// and cutting the box out of it with a <canvas>. This is what lets the app
// show the ACTUAL diagram/photo from the source instead of only a text
// description of it — and it works for vector-drawn figures (line diagrams,
// plotted graphs) just as well as for embedded photos, since it crops
// rendered pixels rather than trying to pull out an original image object.
//
// Everything in here is best-effort: if pdf.js fails to load (e.g. the
// worker script couldn't be fetched), or a page/box turns out to be bad,
// we quietly skip that figure rather than blowing up the whole extraction —
// the "[Figure] ..." text description already captured is always there as
// a fallback. "Quietly" only means we don't interrupt the user, though:
// every failure is still logged to the console (console.warn/error below)
// so a *systemic* failure (every figure failing, not just one bad box) is
// actually diagnosable instead of invisible.

let pdfjsLibPromise = null;
function loadPdfJs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import('pdfjs-dist/build/pdf.mjs').then(async (pdfjsLib) => {
      // Loaded from a CDN at runtime rather than bundled, so we don't have
      // to fight CRA's webpack config to emit a worker file. Pinned to the
      // exact version installed so it always matches the API in use.
      const workerUrl = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      // Some browsers (notably some Android WebViews / in-app browsers, and
      // certain locked-down mobile setups) refuse to construct a Worker
      // directly from a cross-origin URL even when the CDN sends correct
      // CORS headers. Fetching the script ourselves and handing the Worker
      // constructor a same-origin blob: URL sidesteps that restriction
      // entirely and is the standard workaround for it.
      try {
        const resp = await fetch(workerUrl);
        if (!resp.ok) throw new Error(`Worker script fetch failed: HTTP ${resp.status}`);
        const code = await resp.text();
        const blobUrl = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
        pdfjsLib.GlobalWorkerOptions.workerSrc = blobUrl;
      } catch (e) {
        // Blob approach failed (e.g. the fetch itself was blocked) — fall
        // back to pointing straight at the CDN URL, which still works in
        // most normal desktop/mobile browsers.
        console.warn('[pdfFigures] Falling back to direct CDN worker URL — blob fetch failed:', e);
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
      }
      return pdfjsLib;
    });
  }
  return pdfjsLibPromise;
}

// file: a File/Blob (or an ArrayBuffer). Returns a pdf.js document proxy.
export async function loadPdfDocument(fileOrArrayBuffer) {
  const pdfjsLib = await loadPdfJs();
  const data = fileOrArrayBuffer instanceof ArrayBuffer
    ? fileOrArrayBuffer
    : await fileOrArrayBuffer.arrayBuffer();
  const task = pdfjsLib.getDocument({ data });
  return task.promise;
}

// Renders one page (1-indexed) to an offscreen canvas at a decent resolution
// so cropped figures still look sharp, without ballooning memory for huge
// pages — capped so an unusually large page doesn't render at a wasteful size.
async function renderPageToCanvas(pdfDoc, pageNum) {
  const page = await pdfDoc.getPage(pageNum);
  const baseViewport = page.getViewport({ scale: 1 });
  const targetLongSide = 2200; // px — enough detail for a cropped figure to stay crisp
  const longSide = Math.max(baseViewport.width, baseViewport.height);
  const scale = Math.min(3, Math.max(1.5, targetLongSide / longSide));
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext('2d', { willReadFrequently: false });
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas;
}

// Google's Gemini models are natively trained on bounding boxes expressed as
// integers on a 0-1000 scale (sometimes 0-100), regardless of what a prompt
// asks for — that habit can leak through even when told explicitly to use a
// 0-1 fraction. A bbox on the wrong scale produces coordinates like
// [45, 120, 300, 400] instead of [0.045, 0.12, 0.30, 0.40]; fed straight
// into a 0-1-fraction crop, that's wildly out of the page's actual bounds
// and produces a degenerate (empty/negative-size) crop region every time.
// Detect that and rescale back down to a true 0-1 fraction before cropping.
function normalizeBboxScale(bbox) {
  const maxAbs = Math.max(...bbox.map((n) => Math.abs(n)));
  if (maxAbs <= 1.5) return bbox; // already a normal 0-1 fraction (small overshoot tolerated)
  const scale = maxAbs <= 100 ? 100 : 1000; // 0-100 or 0-1000 convention
  return bbox.map((n) => n / scale);
}

// Crops a normalized bbox ([x0,y0,x1,y1], each 0..1, origin top-left of the
// page) out of a full-page canvas, with a margin so we don't shave off the
// edge of the figure, and returns a compressed data URL.
function cropCanvas(canvas, rawBbox, figIdForLogging) {
  const [bx0, by0, bx1, by1] = normalizeBboxScale(rawBbox);
  const w = canvas.width, h = canvas.height;
  // The bbox is only ever an AI's visual estimate of where a figure sits on
  // the page, never a pixel-exact measurement — so it's common for it to be
  // a little too tight on one or more sides. A small ~0.8% pad wasn't enough
  // slack to reliably cover that estimation error, which is what caused
  // figures to render with an edge, label, or corner cut off. 3% (relative
  // to whichever page dimension is larger) gives real breathing room while
  // still cropping tightly enough that unrelated page content stays out.
  const pad = 0.03; // ~3% margin
  const x0 = Math.max(0, Math.min(bx0, bx1) - pad) * w;
  const y0 = Math.max(0, Math.min(by0, by1) - pad) * h;
  const x1 = Math.min(1, Math.max(bx0, bx1) + pad) * w;
  const y1 = Math.min(1, Math.max(by0, by1) + pad) * h;
  const cw = Math.max(1, Math.round(x1 - x0));
  const ch = Math.max(1, Math.round(y1 - y0));
  if (!isFinite(cw) || !isFinite(ch) || cw < 2 || ch < 2) {
    console.warn(`[pdfFigures] Degenerate crop region for "${figIdForLogging}" — raw bbox: [${rawBbox.join(', ')}], canvas: ${w}x${h}, computed rect: x0=${x0.toFixed(1)} y0=${y0.toFixed(1)} x1=${x1.toFixed(1)} y1=${y1.toFixed(1)} (cw=${cw}, ch=${ch})`);
    return null;
  }
  const out = document.createElement('canvas');
  out.width = cw;
  out.height = ch;
  out.getContext('2d').drawImage(canvas, x0, y0, cw, ch, 0, 0, cw, ch);
  // JPEG at 0.9 keeps file/localStorage size reasonable while staying sharp
  // enough for a diagram or photo; PNG would be 3-8x larger for no real gain.
  return out.toDataURL('image/jpeg', 0.9);
}

// figureRefs: [{ id, page, bbox }]. Returns { [id]: dataUrl } for every
// figure that could actually be rendered (bad/failed ones are just omitted,
// but logged — see the note at the top of this file).
export async function renderFigureImages(fileOrArrayBuffer, figureRefs) {
  const valid = (figureRefs || []).filter(
    (f) => f && f.id && typeof f.page === 'number' && f.page >= 1 &&
      Array.isArray(f.bbox) && f.bbox.length === 4 && f.bbox.every((n) => typeof n === 'number' && isFinite(n))
  );
  if (!valid.length) return {};

  let pdfDoc;
  try {
    pdfDoc = await loadPdfDocument(fileOrArrayBuffer);
  } catch (e) {
    // This is the failure mode that breaks EVERY figure at once (as opposed
    // to one bad box) — pdf.js itself couldn't load or couldn't parse the
    // PDF. Surfacing this loudly is the whole point of the logging added
    // here: a silent catch here previously made "every image fails" and
    // "one image fails" look identical from the console.
    console.error('[pdfFigures] Could not load the PDF for figure cropping — every figure in this document will fall back to its text description:', e);
    return {};
  }
  const pageCache = new Map();
  const result = {};

  for (const fig of valid) {
    try {
      const pageNum = Math.min(Math.max(1, Math.round(fig.page)), pdfDoc.numPages);
      let canvas = pageCache.get(pageNum);
      if (!canvas) {
        canvas = await renderPageToCanvas(pdfDoc, pageNum);
        pageCache.set(pageNum, canvas);
      }
      const dataUrl = cropCanvas(canvas, fig.bbox, fig.id);
      if (dataUrl) result[fig.id] = dataUrl;
    } catch (e) {
      // Skip this one figure; the text "[Figure] ..." description remains.
      console.warn(`[pdfFigures] Failed to render figure "${fig.id}" (page ${fig.page}):`, e);
    }
  }

  return result;
}