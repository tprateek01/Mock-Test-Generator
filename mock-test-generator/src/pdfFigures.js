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
// a fallback.

let pdfjsLibPromise = null;
function loadPdfJs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import('pdfjs-dist/build/pdf.mjs').then((pdfjsLib) => {
      // Loaded from a CDN at runtime rather than bundled, so we don't have
      // to fight CRA's webpack config to emit a worker file. Pinned to the
      // exact version installed so it always matches the API in use.
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
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

// Crops a normalized bbox ([x0,y0,x1,y1], each 0..1, origin top-left of the
// page) out of a full-page canvas, with a margin so we don't shave off the
// edge of the figure, and returns a compressed data URL.
function cropCanvas(canvas, bbox) {
  const [bx0, by0, bx1, by1] = bbox;
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
  if (!isFinite(cw) || !isFinite(ch) || cw < 2 || ch < 2) return null;
  const out = document.createElement('canvas');
  out.width = cw;
  out.height = ch;
  out.getContext('2d').drawImage(canvas, x0, y0, cw, ch, 0, 0, cw, ch);
  // JPEG at 0.9 keeps file/localStorage size reasonable while staying sharp
  // enough for a diagram or photo; PNG would be 3-8x larger for no real gain.
  return out.toDataURL('image/jpeg', 0.9);
}

// figureRefs: [{ id, page, bbox }]. Returns { [id]: dataUrl } for every
// figure that could actually be rendered (bad/failed ones are just omitted).
export async function renderFigureImages(fileOrArrayBuffer, figureRefs) {
  const valid = (figureRefs || []).filter(
    (f) => f && f.id && typeof f.page === 'number' && f.page >= 1 &&
      Array.isArray(f.bbox) && f.bbox.length === 4 && f.bbox.every((n) => typeof n === 'number' && isFinite(n))
  );
  if (!valid.length) return {};

  const pdfDoc = await loadPdfDocument(fileOrArrayBuffer);
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
      const dataUrl = cropCanvas(canvas, fig.bbox);
      if (dataUrl) result[fig.id] = dataUrl;
    } catch (e) {
      // Skip this one figure; the text "[Figure] ..." description remains.
    }
  }

  return result;
}