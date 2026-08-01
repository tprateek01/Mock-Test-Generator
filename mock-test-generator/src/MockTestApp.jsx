import React, { useState, useEffect, useRef, useReducer, useMemo, Suspense, lazy } from 'react';
import {
  Upload, FileText, ClipboardPaste, Clock, Flag,
  ChevronLeft, ChevronRight, AlertTriangle, X, Plus, Trash2, Pencil,
  Play, RotateCcw, Loader2, ListChecks, Timer,
  BarChart3, Layers, ArrowRight, Check, Calculator, Delete,
  FileDown, Languages, Link2, Unlink, Shuffle
} from 'lucide-react';
import { renderFigureImages } from './pdfFigures';
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';
import { saveTestProgress, loadTestProgress, clearTestProgress } from './testProgress';

/* ------------------------------------------------------------
   HOME PAGE LANGUAGE STRINGS — English / Hindi toggle for the
   Upload (home) screen only. Purely a display-text swap; no
   logic, routing, or data handling changes with it.
   ------------------------------------------------------------ */
const HOME_STRINGS = {
  en: {
    title: 'Mock Test Hall',
    subtitle: 'Turn any paper into a timed, proctored mock test',
    uploadFile: 'Upload file',
    pasteText: 'Paste text',
    dropTitle: 'Drop a paper here, or click to browse',
    dropSub: 'PDF, Word (.docx), image, or plain text',
    clickToReplace: 'click to replace',
    textareaPlaceholder: 'Paste the question paper text here…',
    startBlank: 'Start blank instead',
    extractQuestions: 'Extract questions',
    readingPaper: 'Reading the paper…',
    scanning: 'Scanning for questions and sections',
    questionsExtracted: (n) => `${n} question${n === 1 ? '' : 's'} extracted so far`,
    errNoFile: 'Choose a file first.',
    errNoPaste: 'Paste some question text first.',
    errNoQuestions: 'No questions could be found in that source. Try another file, or start blank and add questions manually.',
    errGeneric: 'Something went wrong while reading that paper.',
    limitToggle: "Don't fetch every question",
    limitLabel: 'How many questions to fetch',
    limitHint: (n) => `Only the first ${n || 0} question${n === 1 ? '' : 's'} (in the paper's own order) will be extracted.`,
    startFromToggle: "Start from a specific question number",
    startFromLabel: 'Fetch starting at question #',
    startFromHint: (n) => `Questions before #${n || 1} in the paper's own order will be skipped; extraction begins at #${n || 1}.`,
  },
  hi: {
    title: 'मॉक टेस्ट हॉल',
    subtitle: 'किसी भी पेपर को टाइम्ड, प्रॉक्टर्ड मॉक टेस्ट में बदलें',
    uploadFile: 'फ़ाइल अपलोड करें',
    pasteText: 'टेक्स्ट पेस्ट करें',
    dropTitle: 'यहाँ पेपर डालें, या ब्राउज़ करने के लिए क्लिक करें',
    dropSub: 'PDF, Word (.docx), इमेज, या प्लेन टेक्स्ट',
    clickToReplace: 'बदलने के लिए क्लिक करें',
    textareaPlaceholder: 'यहाँ प्रश्न पत्र का टेक्स्ट पेस्ट करें…',
    startBlank: 'इसके बजाय खाली शुरू करें',
    extractQuestions: 'प्रश्न निकालें',
    readingPaper: 'पेपर पढ़ा जा रहा है…',
    scanning: 'प्रश्न और सेक्शन खोजे जा रहे हैं',
    questionsExtracted: (n) => `अब तक ${n} प्रश्न निकाले गए`,
    errNoFile: 'पहले एक फ़ाइल चुनें।',
    errNoPaste: 'पहले कुछ प्रश्न टेक्स्ट पेस्ट करें।',
    errNoQuestions: 'उस स्रोत में कोई प्रश्न नहीं मिला। कोई दूसरी फ़ाइल आज़माएँ, या खाली शुरू करके प्रश्न मैन्युअल रूप से जोड़ें।',
    errGeneric: 'उस पेपर को पढ़ते समय कुछ गड़बड़ हो गई।',
    limitToggle: 'सभी प्रश्न न लाएं',
    limitLabel: 'कितने प्रश्न लाने हैं',
    limitHint: (n) => `केवल पहले ${n || 0} प्रश्न (पेपर के अपने क्रम में) निकाले जाएंगे।`,
    startFromToggle: 'किसी खास प्रश्न संख्या से शुरू करें',
    startFromLabel: 'प्रश्न # से शुरू करें',
    startFromHint: (n) => `पेपर के अपने क्रम में #${n || 1} से पहले के प्रश्न छोड़ दिए जाएंगे; निकालना #${n || 1} से शुरू होगा।`,
  },
};

// mammoth (.docx parsing) and recharts (results chart) are both fairly heavy
// and only needed on specific paths (uploading a Word doc; reaching the
// Results screen) — loading them lazily keeps them out of the initial bundle
// every visitor downloads on first paint.
const ResultsChart = lazy(() => import('./ResultsChart'));

/* ============================================================
   HELPERS
   ============================================================ */
let _id = 0;
const uid = (p = 'x') => `${p}_${Date.now().toString(36)}_${(_id++).toString(36)}`;

// negativeMarking on config is an object keyed by question type. Each entry is
// either a plain number (flat rate for every question of that type — the
// older config shape, still supported) or { mode: 'flat'|'byMarks', flat,
// byMarks: { [marksValue]: rate } } so a paper that mixes e.g. 1-mark and
// 2-mark MCQs can penalize them differently (common in exams like GATE/JEE
// where the negative mark is often set relative to the question's own marks).
function getNegativeMarking(config, type, marks) {
  const nm = config && config.negativeMarking;
  if (nm == null) return 0;
  if (typeof nm === 'number') return nm;
  const entry = nm[type];
  if (entry == null) return 0;
  if (typeof entry === 'number') return entry;
  if (entry.mode === 'byMarks' && entry.byMarks) {
    const key = String(marks);
    if (Object.prototype.hasOwnProperty.call(entry.byMarks, key)) return entry.byMarks[key] || 0;
  }
  return entry.flat || 0;
}

function fmtClock(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function base64ToArrayBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// Walks every question in an extracted paper and flattens out the
// {id,page,bbox} figure references collected during extraction, so they can
// all be rendered/cropped from the source PDF in one pass.
function collectFigureRefs(paper) {
  const refs = [];
  (paper.sections || []).forEach((sec) => (sec.questions || []).forEach((q) => {
    (q.figures || []).forEach((f) => refs.push(f));
  }));
  return refs;
}

// Finds the original PDF bytes tucked inside a saved/resumed extraction's
// `contents` (the exact same inlineData part that was originally sent to
// Gemini), so a resumed extraction can still crop real figures out of it
// even though the user isn't re-uploading the file.
function findPdfBytesInContents(contents) {
  for (const msg of contents || []) {
    for (const part of msg.parts || []) {
      if (part && part.inlineData && part.inlineData.mimeType === 'application/pdf' && part.inlineData.data) {
        return base64ToArrayBuffer(part.inlineData.data);
      }
    }
  }
  return null;
}

// Best-effort: crops every figure the model located out of the real PDF
// pages and attaches the resulting pictures to the paper as `paper.figures`
// ({ id: dataUrl }). Never throws — if pdf.js can't load, the source isn't
// actually a PDF, or a figure fails to render, the "[Figure] ..." text
// description already extracted stays as the fallback.
async function attachFigureImages(paper, pdfSource) {
  if (!pdfSource) return paper;
  const refs = collectFigureRefs(paper);
  if (!refs.length) return paper;
  try {
    const images = await renderFigureImages(pdfSource, refs);
    if (images && Object.keys(images).length) {
      return { ...paper, figures: images };
    }
  } catch (e) {
    // best-effort only — extraction result is still fully usable without
    // pictures, but log it so a total failure is diagnosable (renderFigureImages
    // itself also logs the more specific underlying cause when this fires).
    console.error('[attachFigureImages] Figure cropping failed entirely for this paper:', e);
  }
  return paper;
}

// In dev, this stays empty and requests go through setupProxy.js to localhost:3001.
// In production, set REACT_APP_API_BASE to your deployed backend's URL (see deployment notes).
const API_BASE = process.env.REACT_APP_API_BASE || '';

// Uploads a source file (PDF/image) to Gemini ONCE via our server's
// /api/gemini/upload route, returning a small { fileUri, mimeType }
// reference. Building the extraction's initial message around this instead
// of an `inlineData` blob means every one of the (possibly dozens of)
// follow-up generateContent calls in a multi-batch extraction sends just a
// short URI string, not the full file bytes again — the file itself only
// ever crosses the wire to Google once.
async function uploadSourceToGemini(base64, mimeType, displayName) {
  const resp = await fetch(`${API_BASE}/api/gemini/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: base64, mimeType, displayName })
  });
  if (!resp.ok) throw new Error(`Upload error ${resp.status}`);
  const info = await resp.json(); // { uri, mimeType, name, expirationTime }
  return { fileData: { fileUri: info.uri, mimeType: info.mimeType } };
}

async function callGemini(contents, systemInstruction, maxTokens = 1000) {
  const resp = await fetch(`${API_BASE}/api/gemini`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents, systemInstruction: { parts: [{ text: systemInstruction }] }, maxOutputTokens: maxTokens })
  });
  if (!resp.ok) throw new Error(`API error ${resp.status}`);
  const data = await resp.json();
  const candidate = (data.candidates || [])[0];
  const parts = (candidate && candidate.content && candidate.content.parts) || [];
  return parts.map(p => p.text || '').join('\n');
}

function parseJsonLoose(text) {
  let t = text.trim();
  t = t.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
  const first = t.indexOf('{');
  if (first < 0) throw new Error('No JSON object found in response');
  // Walk forward tracking brace depth (respecting strings/escapes) to find the
  // TRUE matching closing brace, rather than naively using the last '}' in the
  // text — a naive lastIndexOf can accidentally match an earlier nested brace
  // when the response was cut off mid-object, silently "succeeding" on
  // truncated/corrupted content instead of failing so we retry.
  let depth = 0, inString = false, escaped = false, end = -1;
  for (let i = first; i < t.length; i++) {
    const ch = t[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) throw new Error('Truncated or unbalanced JSON in response');
  return JSON.parse(t.slice(first, end + 1));
}

const EXTRACTION_SYSTEM = `You extract exam questions from a source document into strict JSON. Output ONLY minified JSON — no markdown fences, no commentary, no preamble.

Schema:
{"title":"string","totalQuestionsInSource":number|null,"sections":[{"name":"string","questions":[{"type":"mcq|msq|numeric|short|descriptive","questionNumber":number,"text":"string","options":["string"]|null,"marks":number,"correctAnswer":"string"|["string"]|null,"orGroup":"string"|null,"orGroupChoose":number|null,"figures":[{"id":"string","page":number,"bbox":[number,number,number,number]}]|null}]}],"complete":boolean}

Rules:
- "mcq" = multiple choice, exactly ONE correct option. "msq" = multiple SELECT, TWO OR MORE correct options (common in GATE-style papers, often marked "one or more options may be correct"). "numeric" = requires a numeric answer, no options. "short" = brief word/phrase/one-line answer. "descriptive" = long-form written answer.
- options: array of option text WITHOUT letter/number labels (e.g. "Paris", not "A) Paris"). Only for mcq/msq, else null. If an option IS an image/diagram/shape rather than text (e.g. "which of these 4 figures is the odd one out", geometric-pattern options, graph-shaped options), do NOT skip it or leave it blank — write a precise, detailed textual description of exactly what's drawn (shape type, number of sides/sections, orientation, shading, arrows, labels, relative position of parts, etc.) so someone who cannot see the original could still tell this option apart from the others. Prefix any such description with "[Figure] " so the app can flag it for the candidate.
- marks: marks stated in the source if present, else default to 1.
- correctAnswer: fill in ONLY if an answer key is clearly present in the source. For mcq, give the exact option text as a single string. For msq, give an ARRAY of the exact option text(s) marked correct (even if only one is marked in the source, still use an array for msq). Never invent an answer — use null if unsure.
- ANSWER KEYS ARE OFTEN SEPARATE FROM THE QUESTIONS — READ CAREFULLY: many source papers print the correct answers on a different page than the question itself — a standalone "Answer Key" / "Answers" / "Solutions" table or list (e.g. "1-B, 2-D, 3-A, 4-C…" or a table of question numbers against option letters), often at the very end of the document, sometimes at the start, sometimes in a completely separate section. You always have the ENTIRE source available to you, even in your very first response — so before finalizing correctAnswer for any batch, proactively check the WHOLE source end to end (not just the pages right next to the question) for such a table or list covering the questions in that batch. Whenever one exists:
  - Treat it purely as a lookup, never as its own section of questions — do NOT create a "section" for it, and do NOT emit its rows as if they were questions.
  - Match each entry to the question it belongs to by question number (use the printed question label if present, otherwise the question's position in reading order) and set that question's correctAnswer field to the EXACT text of the matching option (never just the bare letter/number from the key — resolve "1-B" to the actual full text of option B for question 1).
  - If a key entry can't be confidently matched to a specific question (ambiguous numbering, illegible), leave that question's correctAnswer null rather than guessing.
  - If you still find yourself missing a match you're confident exists (e.g. you spot the key late), a later reconciliation/continuation pass may go back and fill correctAnswer in for a question already sent — when that happens, still repeat that question's other fields unchanged so the record stays consistent.

- orGroup / orGroupChoose — EITHER/OR QUESTIONS: real exam papers frequently say a candidate may attempt only SOME of a set of alternative questions, e.g. "Answer Q5(a) OR Q5(b)", "Attempt either Question 12 or Question 13", "Answer any THREE of the following FIVE questions", "Attempt any 4 questions from Q16 to Q20". Whenever the source explicitly states such a choice between two or more questions:
  - Give every question in that alternative set the SAME "orGroup" string id (invent a short stable id from the source's own numbering, e.g. "Q5", "Q16-20" — reuse the exact same id string for every member of that set, including across continuation responses).
  - Set "orGroupChoose" on every member of that set to the number of questions the candidate must actually answer from it (e.g. 1 for "either/or", 3 for "any three of the following five").
  - Questions NOT part of such a set: orGroup: null, orGroupChoose: null.
  - Do not invent OR groups — only mark them when the source's wording clearly states the choice (words like "either...or", "OR", "any N of the following", "attempt any N questions").
- Group questions under their section headings exactly as they appear (e.g. "Section A", "Physics", "Part I"). If there are no explicit sections, use one section named "Section 1".
- SECTION NAMING MUST STAY IDENTICAL ACROSS YOUR WHOLE RESPONSE SEQUENCE: once you use a section name (e.g. "Section A"), reuse that EXACT same string — same wording, same capitalization, same punctuation — for every later question in that section, including in continuation and reconciliation responses. Never rename, re-capitalize, or append extra description to a section name you already used (e.g. don't switch from "Section A" to "SECTION A" or "Section A - Physics" partway through) — even a small difference splits one real section into two in the final paper.
- Preserve original question order.
- questionNumber: an integer giving this question's position in the reading order of the ENTIRE source, counted continuously across ALL sections and ALL of your responses (1, 2, 3, ... in the exact order the questions appear in the document) — never restart the count at a new section or at a new response, even if the source's own printed labels restart per section (e.g. "Section B" starting again at "Q1" on the page still gets the next continuous questionNumber after the last question of Section A, not 1). This is purely a sequencing field for reassembling the correct order later — it is separate from, and may differ from, any printed question label. Every question must get a unique questionNumber; never reuse or skip one, and never repeat a questionNumber already used in an earlier response.
- Extract EVERY question exactly once — no more, no fewer, and never a duplicate of one already sent (including during a later re-scan/reconciliation pass: if you find a question that looks similar to one you already extracted, only include it if it is genuinely a different question at a different questionNumber).
- totalQuestionsInSource: on your FIRST response only, scan the whole source (page numbers, question numbering, "Q1..Q100" style headers, table of contents, etc.) and give your best-effort count of the TOTAL number of questions the source actually contains, even though you will only extract a partial batch in this response. This is a sanity check used to make sure nothing gets missed later — take it seriously and base it on real evidence in the document (highest question number visible, explicit counts stated, etc.), not a guess. On later continuation responses, repeat the same number (or refine it if you now have better evidence), or null if truly unknowable.
- Your response has a strict output-length budget. Include as many COMPLETE questions as fit — never cut a question, an option list, or a passage in half. If you reach the budget before finishing the source, stop right after the last fully-written question and set "complete": false. If you have covered the entire source, set "complete": true.
- When told to continue, resume immediately after the last question you already sent. Never repeat a question.

PASSAGE / COMPREHENSION SETS — read carefully, this is a common failure point:
- When several questions share one reading passage, case study, data table, or other common stimulus text, embed the passage's FULL text — complete and verbatim, never summarized, paraphrased, or shortened — inside the "text" field of the FIRST question in that set, before the question itself (e.g. "Passage: <entire passage text>\\n\\nQuestion: <the actual question>").
- For every OTHER question in that same set, do NOT repeat the passage again — its "text" field should contain only that individual question (you may add a short lead-in like "Based on the passage above,").
- Never start emitting a passage-based question unless you are confident your remaining output budget can fit the ENTIRE passage plus that first question. If you are not sure it will fit, stop BEFORE starting that question (set "complete": false) rather than emitting a half-written passage — a truncated passage is worse than a delayed one.
- When continuing after a stop like that, re-emit the FULL passage from the beginning (since it was never sent), never a fragment.

Real-world source documents are messy. Handle all of the following without asking for clarification:
- IGNORE entire pages or blocks that are advertisements, app-download banners, subscription/promo pages, watermarks, logos, or website chrome (e.g. "Download the app", "Get it on Google Play", pricing/subscription tables). These never contain real questions — skip them entirely and continue to the next real question. The same applies to purely visual content: a letterhead crest, publisher logo, decorative border/divider, header/footer artwork, or cover-page illustration is NOT a question figure — never describe one of these under "[Figure]" or treat it as an answer option. Only apply the "[Figure]" rule below to an image that is actually part of a specific question's stimulus or one of its options.
- IGNORE repeating diagonal or tiled watermark text overlaid on the page (e.g. a brand name repeated across the page). It is not question content.
- If the source is an ANSWER KEY / already-attempted paper where the correct option is marked visually (e.g. a green checkmark/tick, a colored highlight, or bold/colored text) and an incorrect or "selected" option is marked differently (e.g. a red cross), read the VISUAL marking to identify correctAnswer as the option marked correct — do not confuse "the option the candidate chose" with "the correct option" if the source distinguishes them (e.g. a note like "chosen option" vs "correct option"); only extract the CORRECT one into correctAnswer.
- IGNORE stray numbers or codes that appear detached from question text with no clear label (e.g. a bare number floating next to or inside a question that isn't part of the question's wording, options, or marks) — these are usually leftover layout artifacts (like a candidate's response-id marker) from the original source and must not be included in the question text or treated as an option.
- If a question, or any part of it, is built around an image, diagram, table, chart, or geometric figure (e.g. a Venn diagram, graph, circuit diagram, map, or shape pattern), do NOT skip or blank out that part. Describe what's actually drawn in enough concrete visual detail (shapes, counts, positions, labels, arrows, shading, axis values, etc.) that the question remains fully answerable from text alone. Prefix the description with "[Figure] " (e.g. "[Figure] A right triangle with legs 3 cm and 4 cm, right angle at the bottom-left vertex, hypotenuse labeled x") and weave it into the question's "text" field at the point where the figure appears. Still set correctAnswer from any visible answer key. Only fall back to a brief "[Figure: could not be read in enough detail]" note if the image is genuinely illegible (e.g. too low-resolution or cut off) — never silently drop it.
- Some sources (Word documents in particular) arrive as extracted text PLUS a set of separately-attached embedded images. If the text contains a marker like "[[embedded-image-3]]", it means an image was originally at that exact spot — match it to the 3rd image attachment (attachments are in the same order as their markers) to see what it actually shows, then replace the marker with a "[Figure] ..." description per the rule above.
- SHOWING THE REAL PICTURE (PDF sources only): when the source you are reading is a paginated PDF (not pasted text, not a Word doc), the app can crop out and display the actual figure pixels to the candidate instead of only your text description — but it needs to know exactly where the figure sits on the page. For every distinct figure a question's stimulus or any of its options visibly depends on: (1) invent a short id unique within that question, e.g. "f1", "f2"; (2) add it to that question's "figures" array as {"id":"f1","page":<1-indexed page number the figure is actually on>,"bbox":[x0,y0,x1,y1]}, where (x0,y0) is the top-left and (x1,y1) the bottom-right corner of a box around the figure itself (not the whole page, not surrounding body paragraphs unrelated to it), each number a fraction 0 to 1 of the page's width/height with (0,0) at the page's top-left corner and (1,1) at its bottom-right corner — e.g. a figure occupying the left half of the vertical middle of the page is roughly {"id":"f1","page":3,"bbox":[0.06,0.35,0.48,0.62]}. Use this exact 0-to-1 fraction convention ONLY — do NOT use a 0-to-100 or 0-to-1000 integer scale (a different convention you may default to from other contexts); a bbox value greater than about 1.2 is almost always this exact mistake and will make the crop fail outright. Err on the side of a slightly GENEROUS box: it must fully contain every part of the figure — including its outer border/frame, axis labels, tick marks, legends, and any caption text that belongs to it — with a little surrounding whitespace on all four sides. A box that is too tight and clips off an edge, label, or corner of the figure is a real defect; a box with a bit of extra margin is fine and preferred. If unsure exactly where the figure ends, round the box outward, not inward. (3) at the exact spot in the "text" (or that option's string) where the figure belongs, insert the token "[[fig:f1]]" (that figure's own id) — IN ADDITION TO, never instead of, the required "[Figure] ..." description, e.g. "...as shown below [[fig:f1]] [Figure] a right triangle with legs 3 cm and 4 cm...". Only do this for a figure you can actually see as real pixels on that exact page — never guess a page number or box, never do it for a purely re-typed/reconstructed figure, and never do it at all for non-PDF sources. A generously loose box is fine; a wrong page or a clipped box is not. Questions with no figures simply omit "figures" or set it to null.
- Multi-page PDFs: question numbering continues across pages/sections seamlessly — do not restart numbering or duplicate a question that spans a page break.`;

// Persists an in-progress extraction (including the source's own base64
// bytes, which can be several MB for a PDF/image — too big for
// localStorage's ~5-10MB quota) so that if the app is switched away from,
// backgrounded, and the OS reclaims/reloads the page mid-fetch — which is
// what was silently discontinuing extraction on mobile — the next mount can
// resume the SAME extraction (same conversation history, same questions
// already found) instead of forcing the user to re-upload and start over.
const EXTRACTION_DB_NAME = 'mocksy_extraction_v1';
const EXTRACTION_STORE = 'progress';
const EXTRACTION_KEY = 'current';
function openExtractionDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) { reject(new Error('no indexeddb')); return; }
    const req = indexedDB.open(EXTRACTION_DB_NAME, 1);
    req.onupgradeneeded = () => { req.result.createObjectStore(EXTRACTION_STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function saveExtractionProgress(data) {
  try {
    const db = await openExtractionDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(EXTRACTION_STORE, 'readwrite');
      tx.objectStore(EXTRACTION_STORE).put({ ...data, savedAt: Date.now() }, EXTRACTION_KEY);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (e) { /* best-effort — never let autosave break extraction */ }
}
async function loadExtractionProgress() {
  try {
    const db = await openExtractionDB();
    const result = await new Promise((resolve, reject) => {
      const tx = db.transaction(EXTRACTION_STORE, 'readonly');
      const req = tx.objectStore(EXTRACTION_STORE).get(EXTRACTION_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return result;
  } catch (e) { return null; }
}
async function clearExtractionProgress() {
  try {
    const db = await openExtractionDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(EXTRACTION_STORE, 'readwrite');
      tx.objectStore(EXTRACTION_STORE).delete(EXTRACTION_KEY);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (e) { /* ignore */ }
}

async function extractQuestions(sourceParts, onProgress, maxQuestions = null, resume = null, onSaveState = null, startAt = null) {
  const cap = resume && resume.cap !== undefined
    ? resume.cap
    : (typeof maxQuestions === 'number' && maxQuestions > 0 ? Math.floor(maxQuestions) : null);
  // Which question NUMBER (the source's own printed/inferred numbering, 1
  // being the very first question) to begin extracting from — lets someone
  // fetch e.g. "starting at Q31" instead of always being forced to start
  // over from the beginning. Anything before it is scanned (so numbering,
  // sections, and passages stay correctly understood) but never extracted.
  const startAtQ = resume && resume.startAt !== undefined
    ? resume.startAt
    : (typeof startAt === 'number' && startAt > 1 ? Math.floor(startAt) : null);
  let contents = (resume && resume.contents) || [{
    role: 'user',
    parts: [
      ...sourceParts,
      {
        text: startAtQ && cap
          ? `Skip every question before question number ${startAtQ} in this exam paper's own reading order (do not extract them, but do scan past them so your counting/sections stay correct), then extract exactly the next ${cap} question(s) starting from question number ${startAtQ} into the JSON schema described in the system instructions. The FIRST question you extract must be the one at position ${startAtQ}. Once you have provided all ${cap} of them, set "complete": true even though the source may contain more questions after that point — do not extract anything beyond that.`
          : startAtQ
          ? `Skip every question before question number ${startAtQ} in this exam paper's own reading order (do not extract them, but do scan past them so your counting/sections stay correct), then extract EVERY remaining question from question number ${startAtQ} through to the end of the source into the JSON schema described in the system instructions. The FIRST question you extract must be the one at position ${startAtQ}.`
          : cap
          ? `Extract only the FIRST ${cap} question(s) from this exam paper (in the source's own reading order) into the JSON schema described in the system instructions. Begin with the first question. Once you have provided all ${cap} of them, set "complete": true even though the source may contain more questions after that point — do not extract anything beyond the first ${cap}.`
          : 'Extract all questions from this exam paper into the JSON schema described in the system instructions. Begin with the first question.'
      }
    ]
  }];
  const sections = (resume && resume.sections) ? resume.sections.map(s => ({ ...s, questions: s.questions.map(q => ({ ...q })) })) : [];
  let iterations = (resume && resume.iterations) || 0;
  let title = (resume && resume.title) || 'Mock Test';
  let expectedTotal = resume && typeof resume.expectedTotal !== 'undefined' ? resume.expectedTotal : null;
  let reconcileRounds = (resume && resume.reconcileRounds) || 0;
  let staleStreak = 0;
  // Tracks every questionNumber already accepted, so a later batch (e.g. a
  // reconciliation re-scan) can't sneak in a duplicate of a question we
  // already have — this is what keeps the final count exactly matching the
  // source instead of drifting over. questionsByQn keeps a live reference to
  // each accepted question object (keyed the same way) so that if a later
  // resend of the "same" question turns up a correctAnswer we didn't have
  // yet — e.g. the model has now seen a separate answer-key page/table it
  // hadn't reached before — that answer can be backfilled onto the original
  // instead of being thrown away along with the rest of the duplicate.
  const seenQuestionNumbers = new Set((resume && resume.seenQuestionNumbers) || []);
  const questionsByQn = new Map();
  sections.forEach(sec => sec.questions.forEach(q => { if (q.__qn !== null && q.__qn !== undefined) questionsByQn.set(q.__qn, q); }));
  // Plain object (not `let`) so the forEach callbacks below — recreated each
  // while-loop iteration — close over a stable `const` binding instead of a
  // reassigned loop variable. Functionally identical to `let globalSeq = 0;
  // globalSeq++`, but avoids ESLint's no-loop-func rule, which CRA's build
  // treats as a hard error under CI=true (as on Vercel).
  const seqRef = { current: (resume && resume.seq) || 0 };

  const MAX_ITERATIONS = 60;
  const MAX_RECONCILE_ROUNDS = 6;
  // Large per-call output budget: a small cap is the root cause of both missed
  // questions and mid-passage cutoffs — it forces the model to stop after just
  // a few questions (or partway through a long passage) every time, which then
  // forces MORE batches (i.e. more Gemini API calls) to get through one paper.
  // Since Google's free tier caps requests at 20/minute per project, fewer
  // batches per paper directly means fewer 429s. gemini-3.5-flash (the first
  // model in the server's MODEL_FALLBACKS) currently supports up to 65,536
  // output tokens — see https://ai.google.dev/gemini-api/docs/models. Set a
  // bit under that ceiling as a safety margin rather than the exact max.
  const MAX_OUTPUT_TOKENS = 60000;

  const totalSoFar = () => sections.reduce((n, s) => n + s.questions.length, 0);
  // The highest source-numbered question accepted so far, if any — used as
  // an explicit resume anchor (see pinTail below) so the model always knows
  // exactly where to continue from, even though it no longer has the full
  // multi-batch conversation to infer that from.
  const lastQn = () => (seenQuestionNumbers.size ? Math.max(...seenQuestionNumbers) : null);
  // Keeps `contents` a constant size instead of letting it grow by two
  // messages every iteration. Gemini has no server-side session, so the
  // ENTIRE `contents` array gets re-sent on every call — for a long paper
  // needing dozens of batches, that used to mean re-transmitting every prior
  // batch's full raw JSON output on every subsequent call, adding up to real
  // KB/MB of repeated egress well before extraction finished. Only the base
  // message (the source + original instructions) and the single most recent
  // exchange are actually needed: the model can always re-read the source
  // itself for anything it needs (a shared passage, earlier context), and
  // the continuation instruction now states the exact last question number
  // accepted so far, so truncating older turns doesn't cost it its place.
  const pinTail = (base, modelText, userText) => [
    base[0],
    { role: 'model', parts: [{ text: modelText }] },
    { role: 'user', parts: [{ text: userText }] }
  ];

  if (resume && onProgress) onProgress(totalSoFar());

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    if (onSaveState) {
      await onSaveState({
        contents, sections, iterations, title, expectedTotal, reconcileRounds,
        seenQuestionNumbers: Array.from(seenQuestionNumbers), seq: seqRef.current, cap, startAt: startAtQ
      });
    }
    const raw = await callGemini(contents, EXTRACTION_SYSTEM, MAX_OUTPUT_TOKENS);
    let parsed;
    try {
      parsed = parseJsonLoose(raw);
    } catch (e) {
      contents = pinTail(contents, raw, 'That was not valid JSON (possibly cut off). Resend ONLY valid, complete, minified JSON matching the schema — a smaller batch of questions if needed so the response fits, but every question in it must be complete, including any passage text in full.');
      continue;
    }

    if (parsed.title) title = parsed.title;
    if (expectedTotal === null && typeof parsed.totalQuestionsInSource === 'number' && parsed.totalQuestionsInSource > 0) {
      expectedTotal = parsed.totalQuestionsInSource;
    }

    const beforeCount = totalSoFar();
    (parsed.sections || []).forEach(sec => {
      // Match sections by normalized name (trimmed, case-insensitive, collapsed
      // whitespace) instead of an exact string match. A raw `===` comparison
      // used to fragment one real section into several near-duplicates the
      // moment the model returned the same section's name with even a tiny
      // difference between batches — different capitalization ("Section A"
      // vs "SECTION A"), a trailing space, or an extra descriptor tacked on
      // during a continuation/reconciliation response ("Section A" vs
      // "Section A - Physics") — which is what caused the paper's section
      // layout to drift from the source instead of matching it cleanly.
      const normalizeSectionName = (s) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
      let existing = sections.find(s => normalizeSectionName(s.name) === normalizeSectionName(sec.name));
      if (!existing) { existing = { id: uid('sec'), name: sec.name, questions: [] }; sections.push(existing); }
      (sec.questions || []).forEach(q => {
        const type = ['mcq', 'msq', 'numeric', 'short', 'descriptive'].includes(q.type) ? q.type : 'short';
        let correctAnswer = q.correctAnswer || null;
        if (type === 'msq') {
          // Always store msq answers as an array, even if the model gave a single string.
          if (Array.isArray(correctAnswer)) correctAnswer = correctAnswer.filter(Boolean);
          else if (correctAnswer) correctAnswer = [correctAnswer];
          if (correctAnswer && !correctAnswer.length) correctAnswer = null;
        } else if (Array.isArray(correctAnswer)) {
          // Defensive: model shouldn't send an array for non-msq types, but if it does, take the first value.
          correctAnswer = correctAnswer[0] || null;
        }
        const orGroup = typeof q.orGroup === 'string' && q.orGroup.trim() ? q.orGroup.trim() : null;
        const orGroupChoose = orGroup && typeof q.orGroupChoose === 'number' && q.orGroupChoose > 0 ? Math.floor(q.orGroupChoose) : (orGroup ? 1 : null);
        const questionNumber = typeof q.questionNumber === 'number' && isFinite(q.questionNumber) ? q.questionNumber : null;
        // A question with a questionNumber we've already accepted is a
        // duplicate (most likely re-sent during a reconciliation re-scan).
        // Rather than always discarding it outright, use it as a chance to
        // backfill correctAnswer if the original came through without one
        // and this resend now has one (the model may have since spotted a
        // separate answer-key page/table covering it) — then skip re-adding
        // the question itself so counts don't inflate and order doesn't get
        // corrupted.
        if (questionNumber !== null && seenQuestionNumbers.has(questionNumber)) {
          const original = questionsByQn.get(questionNumber);
          const originalHasAnswer = original && (original.type === 'msq'
            ? Array.isArray(original.correctAnswer) && original.correctAnswer.length > 0
            : !!original.correctAnswer);
          if (original && !originalHasAnswer && correctAnswer) {
            original.correctAnswer = correctAnswer;
          }
          return;
        }
        if (questionNumber !== null) seenQuestionNumbers.add(questionNumber);
        const qId = uid('q');
        // The model's figure ids ("f1", "f2"...) only need to be unique
        // WITHIN one question — across different batches/questions they can
        // and will collide. Namespace every id by this question's own
        // internal id so the final paper-wide figures map never clashes,
        // then rewrite the "[[fig:f1]]" tokens already embedded in text/
        // options to match. Any marker that doesn't have a matching, valid
        // figures[] entry is stripped so a stray/malformed token never shows
        // up as literal text to the candidate.
        const rawFigures = Array.isArray(q.figures) ? q.figures : [];
        const figureIdMap = new Map();
        rawFigures.forEach((f) => {
          if (!f || typeof f.id !== 'string' || !f.id.trim()) return;
          if (typeof f.page !== 'number' || !isFinite(f.page) || f.page < 1) return;
          if (!Array.isArray(f.bbox) || f.bbox.length !== 4 || !f.bbox.every((n) => typeof n === 'number' && isFinite(n))) return;
          if (figureIdMap.has(f.id)) return;
          figureIdMap.set(f.id, `${qId}:${f.id}`);
        });
        const remapFigureMarkers = (str) => (typeof str === 'string'
          ? str.replace(/\[\[fig:([^\]]+)]]/g, (m, rid) => (figureIdMap.has(rid) ? `[[fig:${figureIdMap.get(rid)}]]` : ''))
          : str);
        const qText = remapFigureMarkers(q.text || '');
        const qOptions = (type === 'mcq' || type === 'msq') && Array.isArray(q.options)
          ? q.options.map(remapFigureMarkers)
          : null;
        const qFigures = rawFigures
          .filter((f) => figureIdMap.has(f.id))
          .map((f) => ({ id: figureIdMap.get(f.id), page: Math.round(f.page), bbox: f.bbox }));
        const newQuestion = {
          id: qId,
          type,
          text: qText,
          options: qOptions,
          marks: typeof q.marks === 'number' && q.marks > 0 ? q.marks : 1,
          correctAnswer,
          orGroup,
          orGroupChoose,
          figures: qFigures.length ? qFigures : null,
          // Internal-only, used to restore original document order below —
          // stripped before the paper is returned.
          __qn: questionNumber,
          __seq: seqRef.current++
        };
        existing.questions.push(newQuestion);
        if (questionNumber !== null) questionsByQn.set(questionNumber, newQuestion);
      });
    });
    const afterCount = totalSoFar();
    onProgress && onProgress(afterCount);

    // A user-requested cap always wins over the model's own pacing — stop
    // pulling more batches the moment we have enough, regardless of whether
    // the model still thinks there's more to extract.
    if (cap && afterCount >= cap) break;

    const madeProgress = afterCount > beforeCount;
    staleStreak = madeProgress ? 0 : staleStreak + 1;
    // Two responses in a row with zero new questions means the model is stuck —
    // stop rather than burn through all remaining iterations for nothing.
    if (staleStreak >= 2) break;

    if (!parsed.complete) {
      const anchor = lastQn();
      contents = pinTail(contents, raw, `You have extracted ${afterCount} question(s) so far${expectedTotal ? ` out of an estimated ${expectedTotal}` : ''}${anchor !== null ? `, the last one being question number ${anchor}` : ''}. Continue extracting the NEXT batch starting immediately after${anchor !== null ? ` question number ${anchor}` : ' the last question you sent'}, same JSON schema. Never repeat a question already extracted. If a question shares a passage from earlier in the source, re-read it directly from the source rather than resending it verbatim — just continue with the question.`);
      continue;
    }

    // The model says it's finished — but before trusting that, check it against
    // its own earlier estimate of the total. This is what catches "90 out of 100"
    // style undercounts instead of silently accepting an incomplete extraction.
    // Skipped entirely when a cap or a start-from question number is set —
    // an "undercount" relative to the full source is expected and
    // intentional in either case.
    if (!cap && !startAtQ && expectedTotal && afterCount < expectedTotal && reconcileRounds < MAX_RECONCILE_ROUNDS) {
      reconcileRounds++;
      contents = pinTail(contents, raw, `You estimated earlier that this source has about ${expectedTotal} questions, but you have only extracted ${afterCount} so far. Carefully re-scan the ENTIRE source end to end, including any pages, sections, or passage-based question sets you may have skipped, and extract every remaining question you find, same JSON schema. Never repeat a question already extracted. If after a careful re-check there truly are no more questions, set "complete": true again.`);
      continue;
    }

    break;
  }

  // Restore original document order. Normal continuation batches already
  // arrive in order, but a reconciliation re-scan (used to catch questions
  // the model missed the first time around) appends whatever it finds to
  // the end of a section's array — which can leave an earlier question
  // sitting after later ones. Sorting by the model's questionNumber (with
  // arrival order as a stable fallback when it's missing) fixes that so the
  // final paper always matches the source's own question order.
  sections.forEach(sec => {
    sec.questions.sort((a, b) => {
      if (a.__qn !== null && b.__qn !== null && a.__qn !== b.__qn) return a.__qn - b.__qn;
      return a.__seq - b.__seq;
    });
  });

  // A batch can slightly overshoot a user-requested cap (the model doesn't
  // stop mid-question), so trim back down to exactly `cap` here. questionNumber
  // is continuous across the WHOLE source, not per section, so "first N
  // questions" means first N in that global order — not first N per section —
  // hence sorting the flattened list across all sections together.
  let finalSections = sections;
  if (cap) {
    const flat = [];
    sections.forEach(sec => sec.questions.forEach(q => flat.push({ sec, q })));
    flat.sort((a, b) => {
      if (a.q.__qn !== null && b.q.__qn !== null && a.q.__qn !== b.q.__qn) return a.q.__qn - b.q.__qn;
      return a.q.__seq - b.q.__seq;
    });
    const keep = new Set(flat.slice(0, cap).map(f => f.q.id));
    finalSections = sections
      .map(sec => ({ ...sec, questions: sec.questions.filter(q => keep.has(q.id)) }))
      .filter(sec => sec.questions.length > 0);
  }

  finalSections.forEach(sec => {
    sec.questions.forEach(q => { delete q.__qn; delete q.__seq; });
  });

  return { title, sections: finalSections, expectedTotal: cap ? null : expectedTotal };
}

// Not every source paper comes with an answer key — plenty of scanned past
// papers or question banks have no marked correct option at all. Rather than
// leaving those un-gradable forever, this takes a second pass AFTER
// extraction: batches up every gradable question (mcq/msq/numeric/short)
// that still has no correctAnswer, asks the model to actually work each one
// out from its own subject knowledge, and merges the results back in.
//
// This is a HARD requirement for mcq/msq/numeric (NAT) — every one of those
// must end up with an answer. A single batch call failing (network hiccup,
// truncated/invalid JSON, the model silently dropping an id) used to mean
// that question was left unsolved forever. To actually guarantee full
// coverage: each batch is retried with backoff, and anything still missing
// afterwards gets a focused, one-question-at-a-time retry pass (smaller asks
// are far less likely to fail or get truncated) repeated for a few rounds.
// Only after all of that genuinely fails do we fall back — for mcq/msq/
// numeric only — to a neutral placeholder so the question is still gradable
// rather than silently missing. "short"/"descriptive" questions are left
// null on genuine failure since there's no safe default to fall back to.
const SOLVE_ANSWERS_SYSTEM = `You are given a JSON array of exam questions that are missing a marked correct answer. For each one, work out the correct answer yourself using your own subject knowledge, then respond with ONLY strict minified JSON — no markdown fences, no commentary — in this exact shape:
{"answers":[{"id":"string","correctAnswer":"string"|["string"]|null}]}

Rules:
- mcq: correctAnswer is the EXACT text of one of that question's given options, copied verbatim (not paraphrased, not re-ordered).
- msq: correctAnswer is an ARRAY of the exact text of every option you believe is correct.
- numeric: correctAnswer is the numeric answer as a plain string (e.g. "42" or "3.14").
- short: correctAnswer is a short, direct answer (a few words), not an explanation.
- Every mcq/msq/numeric question CAN and MUST be answered — pick your single best-supported answer even if you are not fully certain; never return null for these three types. Only "short" may be null, and only if genuinely unanswerable from the given text.
- Return exactly one entry per id you were given, in any order, and no ids you weren't given.`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ------------------------------------------------------------
   CODE QUESTIONS — "what does this code print?" style questions
   get their answer verified by actually RUNNING code, instead of
   the plain LLM-guess pass below. Gemini's code_execution tool
   gives it a real Python sandbox (no extra API key or backend
   service needed beyond the Gemini key already configured in
   server.js) — for non-Python snippets we have the model
   translate to an equivalent Python program preserving exact
   semantics and execute THAT, which is far more reliable for
   numeric/output-tracing questions than asking the model to
   mentally simulate the program.
   ------------------------------------------------------------ */

// Heuristic-only, deliberately generous: false positives just mean a
// question gets the (more expensive, tool-using) code-execution solve path
// instead of the plain-guess one, which is strictly safe. False negatives
// just fall through to the plain-guess pass as before, so nothing breaks
// either way — this only needs to be "good enough", not perfect.
const CODE_QUESTION_PHRASES = /output of the (following|above|given)\s+(code|program|snippet)|what (will|does|is)\s+(the\s+)?(program|code|snippet|following code)\s+(print|output|display|return)|trace the (code|program)|predict the output|value of\s+\w+\s+(after|when)\s+(the\s+)?(code|program|loop)\s+(executes|runs|completes)|consider the following\s+(ansi-?c|c\+\+|java|python|javascript)?\s*(function|program|code|snippet)|(maximum|minimum|max|min) (possible )?value (that )?(can be |is |will be )?(returned|printed|output)|value (returned|printed) (by|from) (the|this) (function|program|code)|(number|count) of times\s+\w+\s+is (called|invoked)|(what is|find) the (return value|output) of/i;
const CODE_QUESTION_SIGNALS = [
  /```/,                          // fenced code block
  /#include\s*<\w+/i,             // C/C++
  /public\s+(class|static)\b/,    // Java
  /System\.out\.print/,           // Java
  /\bvoid\s+main\s*\(/,           // C/C++
  /\bint\s+main\s*\(/,            // C/C++
  /def\s+\w+\s*\([^)]*\)\s*:/,    // Python
  /console\.log\s*\(/,            // JS
  /printf\s*\(/,                  // C/C++/general
  /\bcout\s*<</,                  // C++
  /\bprint\s*\(/,                 // Python/generic
  /\bfor\s*\([^)]*;[^)]*;[^)]*\)/,// C-style for loop
  /\b(int|float|double|char|String|var|let|const)\s+\w+\s*=\s*[^;]+;/, // typed declarations
  // A bare function definition with no main() — e.g. a standalone recursive
  // C/Java/JS function the question asks you to reason about directly
  // ("consider the following function... what's the max it can return?").
  // These never show a printf/cout, so the signals above alone miss them.
  /\b(int|float|double|char|void|bool|long)\s+\w+\s*\([^)]*\)\s*\{/,
  /\breturn\s*\(?\s*\w+\s*\(/,     // a return statement that itself calls a function (recursion)
];
function looksLikeCodeQuestion(text) {
  if (!text) return false;
  if (CODE_QUESTION_PHRASES.test(text)) return true;
  let hits = 0;
  for (const re of CODE_QUESTION_SIGNALS) { if (re.test(text)) hits++; if (hits >= 2) return true; }
  return false;
}

const CODE_SOLVE_SYSTEM = `You are given a JSON array of exam questions, each centered on a piece of code (in any programming language) whose exact behaviour the candidate must determine. For each question, use the code_execution tool to ACTUALLY RUN code and verify the true result — never guess, never hand-trace only "in your head".

First, work out exactly what's being asked — these are not all "run it once and read stdout":
- If it asks for the output/return value of a SPECIFIC call (concrete arguments given, or a single \`main\`/driver that runs it once), translate and run that one call.
- If it asks for the MAXIMUM, MINIMUM, or "the possible value(s)" a function can return, or how it behaves "for any/all valid input" — there is no single call to make. Write a Python program that actually SEARCHES: reimplement the function exactly, then call it across a wide, representative sweep of valid inputs (per any stated constraints, or a generous range like -100..100 / 0..200 if unconstrained) and take the actual max/min/set of results the code produces — don't reason about this analytically instead of running it, and don't stop at one guessed input.
- If it asks how many times something is called/how deep recursion goes/how many steps, instrument the translated code (e.g. a counter incremented on each call) and run it, rather than counting by eye.

How to translate and run:
- If the code is already Python, run it as-is (or instrumented per above).
- If it is written in another language (C, C++, Java, JavaScript, etc.), first translate it into an equivalent Python program that preserves the EXACT same semantics — same operator precedence and integer/float division rules, same loop bounds (watch for off-by-one differences between languages), same array/string indexing, same output formatting (printf/format-specifier rounding, string concatenation, newline behaviour), same recursion base cases — then run that translation with the tool. Watch for language-specific quirks: integer division truncation vs. float division, pre/post increment ordering, short-circuit evaluation, pass-by-value vs pass-by-reference, static/global variable retention across calls, string immutability/mutability. If the question says to ignore syntax errors, fix only what's needed to make it runnable without changing its logic/semantics.
- Cross-check the executed result against the question's own options (if any) before finalizing.

Once every question has a verified result, respond with ONLY one final strict minified JSON object — no markdown fences, no commentary — in this exact shape:
{"answers":[{"id":"string","correctAnswer":"string"|["string"]|null}]}

Rules:
- mcq: correctAnswer is the EXACT text of one of that question's given options, copied verbatim, matching the option whose value equals the code's real, verified output.
- msq: correctAnswer is an ARRAY of the exact text of every option you verified as correct.
- numeric: correctAnswer is the verified numeric result as a plain string.
- short: correctAnswer is the verified output as a short, direct string (preserve case/punctuation/spacing where it matters).
- Every mcq/msq/numeric question CAN and MUST be answered — never return null for these three types. Only "short" may be null, and only if the code is genuinely unrunnable/incomplete.
- Return exactly one entry per id you were given, in any order, and no ids you weren't given.`;

async function callGeminiCodeExec(contents, systemInstruction, maxTokens = 4096) {
  const resp = await fetch(`${API_BASE}/api/gemini`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: systemInstruction }] },
      maxOutputTokens: maxTokens,
      tools: [{ codeExecution: {} }]
    })
  });
  if (!resp.ok) throw new Error(`API error ${resp.status}`);
  const data = await resp.json();
  const candidate = (data.candidates || [])[0];
  const parts = (candidate && candidate.content && candidate.content.parts) || [];
  // Interleaved executableCode/codeExecutionResult parts have no `.text`,
  // so they're silently skipped here — only the model's final prose/JSON
  // text parts are kept.
  return parts.map(p => p.text || '').join('\n');
}

// Small batches — the code_execution tool round-trips (write code, run it,
// read the result, sometimes retry) cost more tokens/time per question than
// a plain guess, so keeping batches small avoids truncated responses.
async function solveCodeBatch(batch, maxAttempts = 2, maxTokens = 4096) {
  const payload = batch.map(q => ({ id: q.id, type: q.type, text: q.text, options: q.options || undefined }));
  let lastErr = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const raw = await callGeminiCodeExec(
        [{ role: 'user', parts: [{ text: JSON.stringify(payload) }] }],
        CODE_SOLVE_SYSTEM,
        maxTokens
      );
      const parsed = parseJsonLoose(raw);
      const answers = Array.isArray(parsed.answers) ? parsed.answers : [];
      if (answers.length) return answers;
      lastErr = new Error('Empty answers array in response');
    } catch (e) {
      lastErr = e;
    }
    if (attempt < maxAttempts - 1) await sleep(500 * (attempt + 1));
  }
  throw lastErr || new Error('Failed to solve code batch');
}

// Runs one solve request for a batch of questions, retrying with backoff on
// network/parse failures or an empty/short response. Throws only after every
// attempt is exhausted.
async function solveBatch(batch, maxAttempts = 3, maxTokens = 4096) {
  const payload = batch.map(q => ({ id: q.id, type: q.type, text: q.text, options: q.options || undefined }));
  let lastErr = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const raw = await callGemini(
        [{ role: 'user', parts: [{ text: JSON.stringify(payload) }] }],
        SOLVE_ANSWERS_SYSTEM,
        maxTokens
      );
      const parsed = parseJsonLoose(raw);
      const answers = Array.isArray(parsed.answers) ? parsed.answers : [];
      if (answers.length) return answers;
      lastErr = new Error('Empty answers array in response');
    } catch (e) {
      lastErr = e;
    }
    if (attempt < maxAttempts - 1) await sleep(500 * (attempt + 1));
  }
  throw lastErr || new Error('Failed to solve batch');
}

// Last-resort fallback so a gradable question never ships completely blank:
// picks a deterministic placeholder answer. Only used for mcq/msq/numeric
// after every real solve attempt (batched + individual retries) has failed
// outright — an extremely rare case (e.g. sustained API outage) — so the
// test stays fully gradable end to end.
function fallbackAnswer(q) {
  if (q.type === 'mcq') return Array.isArray(q.options) && q.options.length ? q.options[0] : null;
  if (q.type === 'msq') return Array.isArray(q.options) && q.options.length ? [q.options[0]] : null;
  if (q.type === 'numeric') return '0';
  return null;
}

async function solveMissingAnswers(paper, onProgress) {
  const targets = [];
  paper.sections.forEach(sec => {
    sec.questions.forEach(q => {
      const gradableType = q.type === 'mcq' || q.type === 'msq' || q.type === 'numeric' || q.type === 'short';
      const hasAnswer = q.type === 'msq' ? Array.isArray(q.correctAnswer) && q.correctAnswer.length > 0 : !!q.correctAnswer;
      if (gradableType && !hasAnswer) targets.push(q);
    });
  });
  if (!targets.length) return paper;

  const BATCH_SIZE = 10;
  const solved = new Map();
  const total = targets.length;
  onProgress && onProgress(0, total);

  const isResolved = (id) => {
    if (!solved.has(id)) return false;
    const v = solved.get(id);
    if (v === null || v === undefined) return false;
    if (Array.isArray(v) && !v.length) return false;
    return true;
  };
  const applyAnswers = (answers) => {
    (answers || []).forEach(a => { if (a && a.id) solved.set(a.id, a.correctAnswer); });
  };

  // Progress is reported as "how many targets are resolved so far" rather
  // than manually incremented per pass, since a question can pass through
  // more than one pass (code-exec, then plain-guess fallback, then the
  // individual retries) before it actually resolves.
  const tickProgress = () => { onProgress && onProgress(targets.filter(q => isResolved(q.id)).length, total); };

  // Pass 0 — "what does this code print?" style questions get their answer
  // actually computed by running code (via Gemini's code_execution tool)
  // instead of guessed. This runs first so the plain-guess pass 1 below
  // never touches a question that pass 0 already resolved.
  const codeTargets = targets.filter(q => looksLikeCodeQuestion(q.text));
  const CODE_BATCH_SIZE = 4;
  for (let i = 0; i < codeTargets.length; i += CODE_BATCH_SIZE) {
    const batch = codeTargets.slice(i, i + CODE_BATCH_SIZE);
    try {
      applyAnswers(await solveCodeBatch(batch, 2));
    } catch (e) {
      // Falls through to the individual code-exec retry below, then to the
      // plain-guess passes — never blocks the rest of the extraction.
    }
    tickProgress();
  }
  // One-question-at-a-time retry for any code question the batched pass
  // missed (a smaller ask is less likely to get truncated).
  const unresolvedCode = codeTargets.filter(q => !isResolved(q.id));
  for (const q of unresolvedCode) {
    try {
      applyAnswers(await solveCodeBatch([q], 2, 2048));
    } catch (e) {
      // Leave for the plain-guess pass 1 below as a fallback.
    }
    tickProgress();
  }

  // Pass 1 — batched, each batch retried internally on failure. Covers
  // every non-code target, plus any code target pass 0 couldn't resolve
  // (e.g. code_execution tool unavailable) as a fallback.
  const remaining = targets.filter(q => !isResolved(q.id));
  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    const batch = remaining.slice(i, i + BATCH_SIZE);
    try {
      applyAnswers(await solveBatch(batch, 3));
    } catch (e) {
      // Leave for the individual retry pass below — never lets one batch's
      // failure take the rest of the batch (or the extraction) down with it.
    }
    tickProgress();
  }

  // Pass 2 — anything still unsolved (call failed outright, the model
  // skipped an id, or genuinely returned null) gets a focused,
  // one-question-at-a-time retry. Smaller asks are far less likely to fail
  // or get truncated, and a couple of rounds of this is what actually
  // guarantees every mcq/msq/numeric question ends up answered instead of
  // silently leaving gaps whenever one batch call has a hiccup.
  for (let round = 0; round < 2; round++) {
    const unresolved = targets.filter(q => !isResolved(q.id));
    if (!unresolved.length) break;
    for (const q of unresolved) {
      try {
        applyAnswers(await solveBatch([q], 2, 1024));
      } catch (e) {
        // try again next round, or fall through to the hard fallback below
      }
    }
  }

  // Pass 3 — absolute last resort, only for the types that must never be
  // left blank (mcq/msq/numeric). By this point every real attempt (10
  // total solve calls across passes 1 and 2 for a stubborn question) has
  // failed, so a neutral placeholder keeps the question gradable rather
  // than silently missing from the finished test.
  targets.forEach(q => {
    if (isResolved(q.id)) return;
    if (q.type === 'mcq' || q.type === 'msq' || q.type === 'numeric') {
      const fb = fallbackAnswer(q);
      if (fb !== null) solved.set(q.id, fb);
    }
  });
  onProgress && onProgress(total, total);

  const sections = paper.sections.map(sec => ({
    ...sec,
    questions: sec.questions.map(q => {
      if (!solved.has(q.id)) return q;
      let ans = solved.get(q.id);
      if (q.type === 'msq') {
        ans = Array.isArray(ans) ? ans.filter(Boolean) : (ans ? [ans] : null);
        if (ans && !ans.length) ans = null;
      } else if (Array.isArray(ans)) {
        ans = ans[0] || null;
      }
      return ans ? { ...q, correctAnswer: ans } : q;
    })
  }));
  return { ...paper, sections };
}

/* ============================================================
   SCREEN 1 — UPLOAD
   ============================================================ */
// A number <input> that keeps its own "draft" text while focused instead of
// being fully controlled by the parent's numeric state. Plain
// `value={n} onChange={(e) => setN(parseInt(e.target.value) || fallback)}`
// looks fine but is unusable: the instant the field is emptied (e.g. the
// user backspaces a lone "1" to retype it) `parseInt('') || fallback`
// snaps straight back to the fallback, so the backspace visibly does
// nothing and the field can never be cleared to type a fresh number. Here,
// blank/partial input ("", "-", "3.") is left alone until blur, only then
// is it parsed, clamped to min/max, and pushed to the parent — so typing
// feels normal and a mid-edit value never gets silently rewritten out from
// under the user.
function NumField({ value, onCommit, min, max, step, integer = true, className = '', style, placeholder }) {
  const [draft, setDraft] = useState(String(value));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) setDraft(String(value));
  }, [value]);

  const clamp = (n) => {
    if (Number.isNaN(n)) n = min !== undefined ? min : 0;
    if (integer) n = Math.round(n);
    if (min !== undefined) n = Math.max(min, n);
    if (max !== undefined) n = Math.min(max, n);
    return n;
  };

  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      className={className}
      style={style}
      value={draft}
      onFocus={() => { focusedRef.current = true; }}
      onChange={(e) => {
        const raw = e.target.value;
        setDraft(raw);
        // Mid-edit states ("", "-", trailing ".") are left as-is — no
        // fallback substitution — so the user can keep typing/deleting
        // freely. Once there's a real number, push it up live (unclamped)
        // so anything depending on it (hints, totals) updates as you type;
        // clamping only happens on blur, once the value is "final".
        if (raw === '' || raw === '-' || /\.$/.test(raw)) return;
        const n = parseFloat(raw);
        if (!Number.isNaN(n)) onCommit(n);
      }}
      onBlur={() => {
        focusedRef.current = false;
        const n = clamp(parseFloat(draft));
        onCommit(n);
        setDraft(String(n));
      }}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
    />
  );
}

function UploadScreen({ onExtracted, onStatusChange }) {
  const [mode, setMode] = useState('file'); // 'file' | 'paste'
  const [pastedText, setPastedText] = useState('');
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | working | solving | error
  const [progressCount, setProgressCount] = useState(0);
  const [solveProgress, setSolveProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  // Let the parent (MockTestApp) know whenever our status changes, so it
  // can hide the site nav/footer while a paper is actively being read
  // (working/solving) without touching the idle drop-zone screen, which
  // keeps the full marketing-style chrome like Home/Contact/Privacy do.
  useEffect(() => { onStatusChange && onStatusChange(status); }, [status, onStatusChange]);
  // Home-page-only display language. Purely cosmetic — doesn't touch
  // extraction, review, timing, or test-taking, all of which stay English.
  const [lang, setLang] = useState('en'); // 'en' | 'hi'
  const t = HOME_STRINGS[lang];
  // Optional cap so someone with a huge source paper (or who just wants a
  // quick practice run) can pull only the first N questions instead of the
  // whole thing — cuts extraction time/cost too.
  const [limitEnabled, setLimitEnabled] = useState(false);
  const [questionLimit, setQuestionLimit] = useState(20);
  // Optional starting point so someone doesn't have to always fetch from
  // question 1 — e.g. resuming a huge source paper partway through, or only
  // wanting questions 31 onward for practice.
  const [startFromEnabled, setStartFromEnabled] = useState(false);
  const [startFromQuestion, setStartFromQuestion] = useState(1);

  // If the app was switched away from / backgrounded mid-extraction and the
  // OS reloaded the page (reclaiming memory, which is what silently
  // discontinued fetching before), pick the interrupted extraction back up
  // automatically instead of making the user re-upload and start over.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await loadExtractionProgress();
      if (cancelled || !saved || !saved.contents) return;

      // Gemini's uploaded-file reference (used inside saved.contents) expires
      // after ~48h, and realistically nobody wants a stale extraction from
      // hours ago silently resuming — and resending the growing conversation
      // history — the moment they happen to reopen the tab. If this was
      // abandoned a while back, just clear it and let them start fresh
      // instead of auto-resuming indefinitely.
      const RESUME_MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours
      if (!saved.savedAt || Date.now() - saved.savedAt > RESUME_MAX_AGE_MS) {
        await clearExtractionProgress();
        return;
      }

      setStatus('working');
      setProgressCount((saved.sections || []).reduce((n, s) => n + s.questions.length, 0));
      try {
        const paper = await extractQuestions(
          [], (n) => { if (!cancelled) setProgressCount(n); }, saved.cap, saved,
          (snap) => saveExtractionProgress({
            ...snap,
            sourceSignature: saved.sourceSignature,
            // Carry the locally-kept source bytes forward across every
            // autosave during the resumed run — these never touch the
            // network, they're only for figure cropping below.
            sourceBase64: saved.sourceBase64,
            sourceMime: saved.sourceMime
          }),
          saved.startAt
        );
        if (cancelled) return;
        if (!paper.sections.length || !paper.sections.some(s => s.questions.length)) {
          throw new Error(t.errNoQuestions);
        }
        setStatus('solving');
        const solved = await solveMissingAnswers(paper, (d, total) => { if (!cancelled) setSolveProgress({ done: d, total }); });
        if (cancelled) return;
        // Figure cropping needs the actual PDF/image bytes, which are no
        // longer inside saved.contents (that now only holds a Gemini file
        // URI reference) — reconstruct them from the copy we kept locally
        // for exactly this purpose. Falls back to the old extraction path
        // (reading raw bytes back out of contents) only for sessions saved
        // before this change.
        const pdfSource = saved.sourceBase64 && saved.sourceMime === 'application/pdf'
          ? base64ToArrayBuffer(saved.sourceBase64)
          : findPdfBytesInContents(saved.contents);
        const withFigures = await attachFigureImages(solved, pdfSource);
        if (cancelled) return;
        await clearExtractionProgress();
        onExtracted(withFigures);
      } catch (e) {
        if (cancelled) return;
        await clearExtractionProgress();
        setError(e.message || t.errGeneric);
        setStatus('error');
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const acceptExt = '.txt,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp';

  const handleFiles = (files) => {
    if (files && files[0]) { setFile(files[0]); setMode('file'); }
  };

  const startBlank = () => {
    onExtracted({ title: 'Untitled Mock Test', sections: [{ id: uid('sec'), name: 'Section 1', questions: [] }] });
  };

  const run = async () => {
    setError('');
    setStatus('working');
    setProgressCount(0);
    await clearExtractionProgress(); // a fresh run always discards any stale interrupted attempt
    const sourceSignature = mode === 'paste' ? `paste:${pastedText.length}` : `file:${file ? `${file.name}:${file.size}` : ''}`;
    try {
      let sourceParts;
      let sourceBase64ForResume = null;
      let sourceMimeForResume = null;
      if (mode === 'paste') {
        if (!pastedText.trim()) throw new Error(t.errNoPaste);
        sourceParts = [{ text: pastedText }];
      } else {
        if (!file) throw new Error(t.errNoFile);
        const name = file.name.toLowerCase();
        if (name.endsWith('.docx') || name.endsWith('.doc')) {
          const buf = await file.arrayBuffer();
          const { default: mammoth } = await import('mammoth');
          // Pull embedded pictures (diagrams, shape-based options, etc.) out
          // as their own inlineData parts — same shape as the PDF/image
          // branches below — so the model can actually SEE them, instead of
          // extractRawText's plain-text-only output which silently drops
          // every image in the document.
          //
          // NOT every embedded picture is question content though — Word
          // docs commonly carry a letterhead logo, header/footer crest, a
          // decorative divider line, or clip-art bullets. Sending those to
          // the model wastes payload/tokens and risks it mistaking a logo
          // for a "figure" that belongs to a question. isLikelyContentImage
          // filters those out by size/shape before an image is ever attached.
          const isLikelyContentImage = (bytes, width, height) => {
            if (bytes < 3072) return false; // sub-3KB: almost always an icon/logo/bullet
            if (width && height) {
              if (width < 60 || height < 60) return false; // tiny — icon-sized
              const ratio = Math.max(width / height, height / width);
              if (ratio > 6) return false; // long thin strip — divider/rule/banner, not a figure
            }
            return true;
          };
          const readImageDimensions = (base64, mimeType) => new Promise((resolve) => {
            try {
              const img = new window.Image();
              img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
              img.onerror = () => resolve({ width: 0, height: 0 });
              img.src = `data:${mimeType};base64,${base64}`;
            } catch {
              resolve({ width: 0, height: 0 });
            }
          });
          const images = [];
          let imgIdx = 0;
          const uploadTasks = []; // collected here, awaited together after convertToHtml finishes
          const html = await mammoth.convertToHtml(
            { arrayBuffer: buf },
            {
              convertImage: mammoth.images.imgElement(async (image) => {
                const b64 = await image.read('base64');
                const mimeType = image.contentType || 'image/png';
                const byteSize = Math.floor(b64.length * 3 / 4);
                const { width, height } = await readImageDimensions(b64, mimeType);
                if (!isLikelyContentImage(byteSize, width, height)) {
                  return { src: '' }; // decorative — drop silently, no marker left in text
                }
                imgIdx += 1;
                const idx = imgIdx;
                // Same fix as the PDF/image sources below: upload the image to
                // Gemini ONCE here (this callback only runs once per image,
                // regardless of how many extraction batches follow) so later
                // continuation turns reference it by a small file URI instead
                // of re-embedding its full base64 bytes every time. Falls back
                // to inline bytes if the upload itself fails, so one flaky
                // upload can't sink the whole extraction.
                //
                // Deliberately NOT awaited here — mammoth walks the document
                // and calls this once per image, so awaiting inline would
                // upload them one at a time (slow for image-heavy papers).
                // Instead every upload is kicked off immediately and they all
                // run concurrently; we only wait for the full batch to finish
                // once conversion of the whole document is done, below.
                uploadTasks.push(
                  uploadSourceToGemini(b64, mimeType, `embedded-image-${idx}`)
                    .catch((e) => {
                      console.error(`[docx] Upload failed for embedded image ${idx}, falling back to inline:`, e);
                      return { inlineData: { mimeType, data: b64 } };
                    })
                    .then((part) => { images[idx - 1] = part; })
                );
                // Leave a marker in the text flow so the model knows roughly
                // where each image sits relative to the surrounding text.
                return { src: '', alt: `[[embedded-image-${idx}]]` };
              })
            }
          );
          await Promise.all(uploadTasks);
          const text = html.value
            .replace(/<img[^>]*alt="([^"]*)"[^>]*>/gi, '\n$1\n')
            .replace(/<img[^>]*>/gi, '\n')
            .replace(/<\/p>|<\/li>|<\/tr>/gi, '\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
          sourceParts = images.length
            ? [
                { text: `${text}\n\n(${images.length} embedded image(s) from this document follow, in the order they were referenced above as [[embedded-image-N]] markers.)` },
                ...images
              ]
            : [{ text }];
        } else if (name.endsWith('.pdf')) {
          const b64 = await fileToBase64(file);
          sourceBase64ForResume = b64; // kept locally only, for figure cropping / resume — never re-sent
          sourceMimeForResume = 'application/pdf';
          sourceParts = [await uploadSourceToGemini(b64, 'application/pdf', file.name)];
        } else if (name.endsWith('.txt')) {
          const text = await file.text();
          sourceParts = [{ text }];
        } else {
          const b64 = await fileToBase64(file);
          const mediaType = file.type || 'image/png';
          sourceBase64ForResume = b64;
          sourceMimeForResume = mediaType;
          sourceParts = [await uploadSourceToGemini(b64, mediaType, file.name)];
        }
      }
      const cap = limitEnabled && Number(questionLimit) > 0 ? Math.floor(Number(questionLimit)) : null;
      const startAt = startFromEnabled && Number(startFromQuestion) > 1 ? Math.floor(Number(startFromQuestion)) : null;
      const paper = await extractQuestions(
        sourceParts, (n) => setProgressCount(n), cap, null,
        (snap) => saveExtractionProgress({
          ...snap,
          sourceSignature,
          // Raw bytes for local figure-cropping/resume only — `snap.contents`
          // itself now holds a `fileData` URI reference, not the file bytes,
          // so this is what keeps figure cropping working after a reload
          // without ever re-uploading the file to Gemini again.
          sourceBase64: sourceBase64ForResume,
          sourceMime: sourceMimeForResume
        }),
        startAt
      );
      if (!paper.sections.length || !paper.sections.some(s => s.questions.length)) {
        throw new Error(t.errNoQuestions);
      }
      setStatus('solving');
      const solved = await solveMissingAnswers(paper, (d, total) => setSolveProgress({ done: d, total }));
      const isPdf = mode === 'file' && file && file.name.toLowerCase().endsWith('.pdf');
      const withFigures = await attachFigureImages(solved, isPdf ? file : null);
      await clearExtractionProgress();
      onExtracted(withFigures);
    } catch (e) {
      await clearExtractionProgress();
      setError(e.message || t.errGeneric);
      setStatus('error');
    }
  };

  if (status === 'working') {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="mt-card mt-fade-in p-10 max-w-md w-full text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" style={{ color: 'var(--brass)' }} />
          <div className="mt-serif text-lg font-semibold mb-1">{t.readingPaper}</div>
          <div className="text-sm" style={{ color: 'var(--ink-soft)' }}>
            {progressCount > 0
              ? (limitEnabled && questionLimit > 0 ? `${progressCount} of ${questionLimit} question${questionLimit === 1 ? '' : 's'} extracted so far` : t.questionsExtracted(progressCount))
              : t.scanning}
          </div>
        </div>
      </div>
    );
  }

  if (status === 'solving') {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="mt-card mt-fade-in p-10 max-w-md w-full text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" style={{ color: 'var(--brass)' }} />
          <div className="mt-serif text-lg font-semibold mb-1">Working out missing answers</div>
          <div className="text-sm" style={{ color: 'var(--ink-soft)' }}>
            {solveProgress.total > 0
              ? `${solveProgress.done} of ${solveProgress.total} question${solveProgress.total === 1 ? '' : 's'} without an answer key solved so far`
              : 'Checking which questions still need a correct answer…'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-6 md:p-10 flex justify-center">
      <div className="w-full max-w-2xl mt-fade-in">
        <div className="flex items-start justify-between gap-3 mb-8">
          <div className="flex items-center gap-3">
            <div className="mt-seal"><ListChecks size={18} /></div>
            <div>
              <div className="mt-serif text-2xl font-semibold leading-tight">{t.title}</div>
              <div className="text-sm" style={{ color: 'var(--ink-soft)' }}>{t.subtitle}</div>
            </div>
          </div>
          <button
            type="button"
            className="mt-lang-toggle"
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            aria-label="Switch language / भाषा बदलें"
            title="Switch language / भाषा बदलें"
          >
            <Languages size={13} />
            <span className={lang === 'en' ? 'mt-lang-active' : ''}>EN</span>
            <span className="mt-lang-sep">/</span>
            <span className={lang === 'hi' ? 'mt-lang-active' : ''}>हिं</span>
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button className="mt-btn" style={mode === 'file' ? { background: 'var(--ink)', color: 'var(--paper)' } : { background: 'transparent', color: 'var(--ink-soft)', border: '1px solid var(--rule)' }} onClick={() => setMode('file')}>
            <Upload size={15} /> {t.uploadFile}
          </button>
          <button className="mt-btn" style={mode === 'paste' ? { background: 'var(--ink)', color: 'var(--paper)' } : { background: 'transparent', color: 'var(--ink-soft)', border: '1px solid var(--rule)' }} onClick={() => setMode('paste')}>
            <ClipboardPaste size={15} /> {t.pasteText}
          </button>
        </div>

        {mode === 'file' ? (
          <div
            className="mt-card p-8 text-center cursor-pointer"
            style={{ borderStyle: 'dashed', borderColor: dragOver ? 'var(--brass)' : 'var(--rule)', background: dragOver ? 'var(--paper-dim)' : '#fff' }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          >
            <input ref={inputRef} type="file" accept={acceptExt} className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileText size={28} style={{ color: 'var(--brass)' }} />
                <div className="font-medium text-sm">{file.name}</div>
                <div className="text-xs" style={{ color: 'var(--ink-faint)' }}>{(file.size / 1024).toFixed(0)} KB — {t.clickToReplace}</div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload size={28} style={{ color: 'var(--ink-faint)' }} />
                <div className="font-medium text-sm">{t.dropTitle}</div>
                <div className="text-xs" style={{ color: 'var(--ink-faint)' }}>{t.dropSub}</div>
              </div>
            )}
          </div>
        ) : (
          <textarea
            className="mt-textarea mt-scrollbar"
            rows={10}
            placeholder={t.textareaPlaceholder}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
          />
        )}

        <div className="mt-card p-4 mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={limitEnabled} onChange={(e) => setLimitEnabled(e.target.checked)} />
            <span className="mt-label">{t.limitToggle}</span>
          </label>
          {limitEnabled && (
            <div className="mt-3 pl-6">
              <div className="flex items-center gap-3">
                <span className="text-sm flex-shrink-0" style={{ color: 'var(--ink-soft)' }}>{t.limitLabel}</span>
                <NumField
                  min={1} className="mt-input w-24"
                  value={questionLimit} onCommit={setQuestionLimit}
                />
              </div>
              <div className="text-xs mt-1.5" style={{ color: 'var(--ink-faint)' }}>{t.limitHint(questionLimit)}</div>
            </div>
          )}
        </div>

        <div className="mt-card p-4 mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={startFromEnabled} onChange={(e) => setStartFromEnabled(e.target.checked)} />
            <span className="mt-label">{t.startFromToggle}</span>
          </label>
          {startFromEnabled && (
            <div className="mt-3 pl-6">
              <div className="flex items-center gap-3">
                <span className="text-sm flex-shrink-0" style={{ color: 'var(--ink-soft)' }}>{t.startFromLabel}</span>
                <NumField
                  min={1} className="mt-input w-24"
                  value={startFromQuestion} onCommit={setStartFromQuestion}
                />
              </div>
              <div className="text-xs mt-1.5" style={{ color: 'var(--ink-faint)' }}>{t.startFromHint(startFromQuestion)}</div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3 flex items-start gap-2 text-sm p-3 rounded" style={{ background: 'var(--alert-soft)', color: 'var(--alert)' }}>
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-6">
          <button className="mt-btn mt-btn-ghost" onClick={startBlank}>
            <Pencil size={15} /> {t.startBlank}
          </button>
          <button className="mt-btn mt-btn-brass" onClick={run} disabled={mode === 'file' ? !file : !pastedText.trim()}>
            {t.extractQuestions} <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SCREEN 2 — REVIEW / EDIT EXTRACTED PAPER
   ============================================================ */
function ReviewScreen({ paper, setPaper, onBack, onContinue }) {
  const totalQ = paper.sections.reduce((n, s) => n + s.questions.length, 0);

  // OR-group ("either/or", "any N of M") linking mode — active for at most
  // one section at a time so selection state can't bleed across sections.
  const [groupingSIdx, setGroupingSIdx] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [chooseCount, setChooseCount] = useState(1);

  const toggleGroupingMode = (sIdx) => {
    if (groupingSIdx === sIdx) { setGroupingSIdx(null); setSelectedIds(new Set()); }
    else { setGroupingSIdx(sIdx); setSelectedIds(new Set()); setChooseCount(1); }
  };
  const toggleSelected = (qid) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(qid)) next.delete(qid); else next.add(qid);
      return next;
    });
  };
  const confirmGroup = (sIdx) => {
    if (selectedIds.size < 2) return;
    const groupId = uid('or');
    const count = Math.max(1, Math.min(chooseCount, selectedIds.size - 1));
    const sections = paper.sections.slice();
    const questions = sections[sIdx].questions.map(q => selectedIds.has(q.id) ? { ...q, orGroup: groupId, orGroupChoose: count } : q);
    sections[sIdx] = { ...sections[sIdx], questions };
    setPaper({ ...paper, sections });
    setGroupingSIdx(null);
    setSelectedIds(new Set());
  };
  const ungroupQuestions = (sIdx, groupId) => {
    const sections = paper.sections.slice();
    const questions = sections[sIdx].questions.map(q => q.orGroup === groupId ? { ...q, orGroup: null, orGroupChoose: null } : q);
    sections[sIdx] = { ...sections[sIdx], questions };
    setPaper({ ...paper, sections });
  };
  const setGroupChoose = (sIdx, groupId, count) => {
    const sections = paper.sections.slice();
    const questions = sections[sIdx].questions.map(q => q.orGroup === groupId ? { ...q, orGroupChoose: count } : q);
    sections[sIdx] = { ...sections[sIdx], questions };
    setPaper({ ...paper, sections });
  };

  const updateTitle = (title) => setPaper({ ...paper, title });

  const updateSection = (sIdx, patch) => {
    const sections = paper.sections.slice();
    sections[sIdx] = { ...sections[sIdx], ...patch };
    setPaper({ ...paper, sections });
  };
  const removeSection = (sIdx) => {
    const sections = paper.sections.slice();
    sections.splice(sIdx, 1);
    setPaper({ ...paper, sections });
  };
  const addSection = () => {
    setPaper({ ...paper, sections: [...paper.sections, { id: uid('sec'), name: `Section ${paper.sections.length + 1}`, questions: [] }] });
  };
  // Randomizes question order within one section only (Fisher–Yates).
  // orGroup/orGroupChoose live on each question itself, not on position, so
  // "either/or" groupings stay intact — only the display/attempt order changes.
  const shuffleSection = (sIdx) => {
    const sections = paper.sections.slice();
    const questions = sections[sIdx].questions.slice();
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    sections[sIdx] = { ...sections[sIdx], questions };
    setPaper({ ...paper, sections });
  };

  const updateQuestion = (sIdx, qIdx, patch) => {
    const sections = paper.sections.slice();
    const questions = sections[sIdx].questions.slice();
    questions[qIdx] = { ...questions[qIdx], ...patch };
    sections[sIdx] = { ...sections[sIdx], questions };
    setPaper({ ...paper, sections });
  };
  const removeQuestion = (sIdx, qIdx) => {
    const sections = paper.sections.slice();
    const questions = sections[sIdx].questions.slice();
    questions.splice(qIdx, 1);
    sections[sIdx] = { ...sections[sIdx], questions };
    setPaper({ ...paper, sections });
  };
  const addQuestion = (sIdx) => {
    const sections = paper.sections.slice();
    const q = { id: uid('q'), type: 'mcq', text: '', options: ['', '', '', ''], marks: 1, correctAnswer: null, orGroup: null, orGroupChoose: null };
    sections[sIdx] = { ...sections[sIdx], questions: [...sections[sIdx].questions, q] };
    setPaper({ ...paper, sections });
  };

  return (
    <div className="mt-viewport-fixed">
      <div className="flex-1 min-h-0 overflow-y-auto mt-scrollbar p-6 md:p-10 flex justify-center">
      <div className="w-full max-w-3xl mt-fade-in">
        <div className="mb-6">
          <div className="mt-label mb-1">Paper title</div>
          <input className="mt-input mt-serif text-lg font-semibold" value={paper.title} onChange={(e) => updateTitle(e.target.value)} />
          <div className="text-sm mt-2" style={{ color: 'var(--ink-soft)' }}>
            {paper.sections.length > 1 ? `${paper.sections.length} sections · ` : ''}{totalQ} question{totalQ === 1 ? '' : 's'} — check these over before you set the clock.
          </div>
          {typeof paper.expectedTotal === 'number' && paper.expectedTotal > 0 && paper.expectedTotal !== totalQ && (
            <div className="text-xs mt-2 px-3 py-2 rounded" style={{ background: 'var(--alert-soft)', color: 'var(--alert)' }}>
              The source looked like it has about {paper.expectedTotal} question{paper.expectedTotal === 1 ? '' : 's'}, but {totalQ} {totalQ === 1 ? 'was' : 'were'} extracted. Double-check the sections below against the original before starting — add or remove questions here if anything's off.
            </div>
          )}
        </div>

        <div className="space-y-6">
          {paper.sections.map((sec, sIdx) => {
            const isGrouping = groupingSIdx === sIdx;
            const groups = {};
            sec.questions.forEach((q, i) => { if (q.orGroup) (groups[q.orGroup] = groups[q.orGroup] || []).push(i); });
            const groupIds = Object.keys(groups);

            return (
              <div key={sec.id} className="mt-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  {paper.sections.length > 1 ? (
                    <input className="mt-input mt-serif font-semibold flex-1" value={sec.name} onChange={(e) => updateSection(sIdx, { name: e.target.value })} />
                  ) : (
                    <div className="flex-1" />
                  )}
                  <button
                    className="mt-btn mt-btn-ghost"
                    onClick={() => toggleGroupingMode(sIdx)}
                    title="Mark 'either/or' or 'answer any N of these' alternative questions"
                  >
                    <Link2 size={14} /> {isGrouping ? 'Cancel' : 'Link OR questions'}
                  </button>
                  <button
                    className="mt-btn mt-btn-ghost"
                    onClick={() => shuffleSection(sIdx)}
                    disabled={sec.questions.length < 2}
                    title={paper.sections.length > 1 ? 'Randomize the order of questions in this section' : 'Randomize the order of all questions'}
                  >
                    <Shuffle size={14} /> {paper.sections.length > 1 ? 'Shuffle' : 'Shuffle all'}
                  </button>
                  {paper.sections.length > 1 && (
                    <button className="mt-btn mt-btn-danger" onClick={() => removeSection(sIdx)} title="Remove section"><Trash2 size={14} /></button>
                  )}
                </div>

                {isGrouping && (
                  <div className="mb-4 p-3 rounded flex flex-wrap items-center gap-2 text-xs" style={{ background: 'var(--brass-soft)', color: 'var(--ink)' }}>
                    <Link2 size={13} style={{ color: 'var(--brass)', flexShrink: 0 }} />
                    <span>Tick the alternative questions below ({selectedIds.size} selected), then say how many the candidate must answer.</span>
                    <label className="flex items-center gap-1 flex-shrink-0">
                      Answer
                      <NumField
                        min={1} max={Math.max(1, selectedIds.size - 1)} className="mt-input w-14"
                        value={chooseCount} onCommit={setChooseCount}
                      />
                      of {selectedIds.size || '…'}
                    </label>
                    <button className="mt-btn mt-btn-brass" disabled={selectedIds.size < 2} onClick={() => confirmGroup(sIdx)}>Group as OR</button>
                  </div>
                )}

                {groupIds.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {groupIds.map(gid => {
                      const idxs = groups[gid];
                      const chosen = sec.questions[idxs[0]].orGroupChoose || 1;
                      return (
                        <div key={gid} className="flex items-center gap-1.5 text-xs pl-2.5 pr-1.5 py-1 rounded-full" style={{ border: '1px solid var(--brass)', color: 'var(--ink)' }}>
                          <Link2 size={11} style={{ color: 'var(--brass)' }} />
                          <span>Choose</span>
                          <NumField
                            min={1} max={idxs.length} className="mt-input w-11" style={{ padding: '0.1rem 0.3rem' }}
                            value={chosen} onCommit={(n) => setGroupChoose(sIdx, gid, n)}
                          />
                          <span>of {idxs.length} — Q{idxs.map(i => i + 1).join(', Q')}</span>
                          <button className="mt-btn mt-btn-ghost" style={{ padding: '0.15rem 0.35rem' }} onClick={() => ungroupQuestions(sIdx, gid)} title="Remove this OR group">
                            <Unlink size={11} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="space-y-4">
                  {sec.questions.map((q, qIdx) => (
                    <QuestionEditRow
                      key={q.id}
                      q={q}
                      index={qIdx}
                      figures={paper.figures}
                      onChange={(patch) => updateQuestion(sIdx, qIdx, patch)}
                      onRemove={() => removeQuestion(sIdx, qIdx)}
                      selectable={isGrouping}
                      selected={selectedIds.has(q.id)}
                      onToggleSelect={() => toggleSelected(q.id)}
                    />
                  ))}
                </div>

                <button className="mt-btn mt-btn-ghost mt-3" onClick={() => addQuestion(sIdx)}>
                  <Plus size={14} /> Add question
                </button>
              </div>
            );
          })}
        </div>

        <button className="mt-btn mt-btn-ghost mt-4" onClick={addSection}>
          <Plus size={14} /> Add section
        </button>
      </div>
      </div>

      <div
        className="border-t mt-hairline p-4 flex-shrink-0"
        style={{ background: 'var(--paper)', paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="max-w-3xl w-full mx-auto flex items-center justify-between">
          <button className="mt-btn mt-btn-ghost" onClick={onBack}><ChevronLeft size={15} /> Back</button>
          <button className="mt-btn mt-btn-brass" disabled={totalQ === 0} onClick={onContinue}>
            Set up timing <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function QuestionEditRow({ q, index, figures, onChange, onRemove, selectable, selected, onToggleSelect }) {
  const updateOption = (i, val) => {
    const options = (q.options || []).slice();
    options[i] = val;
    onChange({ options });
  };
  const addOption = () => onChange({ options: [...(q.options || []), ''] });
  const removeOption = (i) => {
    const options = (q.options || []).slice();
    options.splice(i, 1);
    onChange({ options });
  };
  const toggleMsqCorrect = (opt) => {
    if (!opt) return;
    const current = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
    const next = current.includes(opt) ? current.filter(o => o !== opt) : [...current, opt];
    onChange({ correctAnswer: next });
  };

  return (
    <div className="border rounded p-3" style={{ borderColor: q.orGroup ? 'var(--brass)' : 'var(--rule)' }}>
      <div className="flex items-start gap-2 mb-2">
        {selectable && (
          <button
            className="mt-radio flex-shrink-0 mt-2"
            style={{ borderRadius: '4px', ...(selected ? { borderColor: 'var(--brass)', background: 'var(--brass-soft)' } : {}) }}
            onClick={onToggleSelect}
            title="Select as an alternative question"
          >
            {selected ? <Check size={11} style={{ color: 'var(--brass)' }} /> : null}
          </button>
        )}
        <span className="mt-mono text-xs pt-2 flex items-center gap-1.5" style={{ color: 'var(--ink-faint)' }}>
          Q{index + 1}
          {q.orGroup && <Link2 size={11} title={`Alternative question — answer only ${q.orGroupChoose || 1} of its group`} style={{ color: 'var(--brass)' }} />}
        </span>
        <textarea className="mt-textarea flex-1" rows={2} placeholder="Question text" value={q.text} onChange={(e) => onChange({ text: e.target.value })} />
        <button className="mt-btn mt-btn-danger" onClick={onRemove} title="Remove question"><Trash2 size={13} /></button>
      </div>
      {Array.isArray(q.figures) && q.figures.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 pl-7">
          {q.figures.map((f) => {
            const src = figures && figures[f.id];
            return src ? (
              <img key={f.id} src={src} alt="Captured figure" style={{ maxHeight: 90, maxWidth: 160, borderRadius: 6, border: '1px solid var(--rule)' }} />
            ) : (
              <span key={f.id} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--brass-soft)', color: 'var(--ink-soft)' }}>
                Figure could not be captured — its "[Figure] ..." text description is still in the question above
              </span>
            );
          })}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 mb-2 pl-7">
        <select
          className="mt-select w-auto"
          value={q.type}
          onChange={(e) => {
            const newType = e.target.value;
            const keepsOptions = newType === 'mcq' || newType === 'msq';
            onChange({
              type: newType,
              options: keepsOptions ? (q.options && q.options.length ? q.options : ['', '', '', '']) : null,
              correctAnswer: newType === 'msq' ? (Array.isArray(q.correctAnswer) ? q.correctAnswer : []) : (Array.isArray(q.correctAnswer) ? null : q.correctAnswer)
            });
          }}
        >
          <option value="mcq">Multiple choice (MCQ — single correct)</option>
          <option value="msq">Multiple select (MSQ — one or more correct)</option>
          <option value="numeric">Numeric answer</option>
          <option value="short">Short answer</option>
          <option value="descriptive">Descriptive</option>
        </select>
        <label className="text-xs flex items-center gap-1" style={{ color: 'var(--ink-soft)' }}>
          Marks
          <NumField min={0} step={0.5} integer={false} className="mt-input w-16" value={q.marks} onCommit={(n) => onChange({ marks: n })} />
        </label>
      </div>

      {(q.type === 'mcq' || q.type === 'msq') && (
        <div className="pl-7 space-y-1.5 mb-2">
          {(q.options || []).map((opt, i) => {
            const isCorrect = q.type === 'msq'
              ? Array.isArray(q.correctAnswer) && opt && q.correctAnswer.includes(opt)
              : q.correctAnswer === opt && opt;
            return (
              <div key={i} className="flex items-center gap-2">
                <button
                  className="mt-radio flex-shrink-0"
                  style={{ borderRadius: q.type === 'msq' ? '4px' : '999px', ...(isCorrect ? { borderColor: 'var(--answered)' } : {}) }}
                  onClick={() => q.type === 'msq' ? toggleMsqCorrect(opt) : onChange({ correctAnswer: opt })}
                  title="Mark as correct answer"
                >
                  {isCorrect ? <Check size={11} style={{ color: 'var(--answered)' }} /> : null}
                </button>
                <input className="mt-input flex-1" placeholder={`Option ${i + 1}`} value={opt} onChange={(e) => updateOption(i, e.target.value)} />
                <button className="text-xs" style={{ color: 'var(--ink-faint)' }} onClick={() => removeOption(i)}><X size={13} /></button>
              </div>
            );
          })}
          <button className="text-xs mt-1" style={{ color: 'var(--brass)' }} onClick={addOption}>+ add option</button>
          {q.type === 'msq' && <div className="text-xs" style={{ color: 'var(--ink-faint)' }}>Click the box next to each correct option — more than one can be correct.</div>}
        </div>
      )}
      {(q.type === 'numeric' || q.type === 'short') && (
        <div className="pl-7">
          <input className="mt-input" placeholder="Correct answer (optional, for auto-scoring)" value={q.correctAnswer || ''} onChange={(e) => onChange({ correctAnswer: e.target.value })} />
        </div>
      )}
      {q.type === 'descriptive' && (
        <div className="pl-7">
          <input className="mt-input" placeholder="Model / reference answer (optional)" value={q.correctAnswer || ''} onChange={(e) => onChange({ correctAnswer: e.target.value })} />
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SCREEN 3 — CONFIGURE TIMING
   ============================================================ */
function ConfigureScreen({ paper, onBack, onStart }) {
  const totalQ = paper.sections.reduce((n, s) => n + s.questions.length, 0);
  const [totalMinutes, setTotalMinutes] = useState(Math.max(10, totalQ * 2));
  const [useSectionTiming, setUseSectionTiming] = useState(paper.sections.length > 1);
  const [sectionMinutes, setSectionMinutes] = useState(() => {
    const per = {};
    paper.sections.forEach(s => { per[s.id] = Math.max(5, Math.round((s.questions.length / Math.max(1, totalQ)) * Math.max(10, totalQ * 2))); });
    return per;
  });
  const [useQuestionTiming, setUseQuestionTiming] = useState(false);
  const [questionSeconds, setQuestionSeconds] = useState(90);

  // Negative marking is configurable per question type, since exams commonly
  // penalize MCQ/MSQ/numeric wrong answers differently (e.g. GATE: -1/3 for
  // 1-mark MCQ, 0 for MSQ and numeric).
  const QUESTION_TYPE_LABELS = { mcq: 'MCQ (single correct)', msq: 'MSQ (multiple correct)', numeric: 'Numeric answer', short: 'Short answer' };
  const typesPresent = useMemo(() => {
    const set = new Set();
    paper.sections.forEach(s => s.questions.forEach(q => set.add(q.type)));
    return ['mcq', 'msq', 'numeric', 'short'].filter(t => set.has(t));
  }, [paper]);
  // Distinct marks values used by each question type, e.g. { mcq: [1, 2], numeric: [2] } —
  // drives the optional "vary by marks" negative-marking rows below.
  const marksByType = useMemo(() => {
    const sets = {};
    paper.sections.forEach(s => s.questions.forEach(q => {
      if (!sets[q.type]) sets[q.type] = new Set();
      sets[q.type].add(q.marks);
    }));
    const out = {};
    Object.keys(sets).forEach(t => { out[t] = Array.from(sets[t]).sort((a, b) => a - b); });
    return out;
  }, [paper]);
  const [negativeMarking, setNegativeMarking] = useState(() => {
    const nm = {};
    ['mcq', 'msq', 'numeric', 'short'].forEach(t => { nm[t] = { mode: 'flat', flat: 0, byMarks: {} }; });
    return nm;
  });
  const [calculatorEnabled, setCalculatorEnabled] = useState(false);

  const sectionSum = paper.sections.reduce((n, s) => n + (sectionMinutes[s.id] || 0), 0);

  return (
    <div className="mt-viewport-fixed">
      <div className="flex-1 min-h-0 overflow-y-auto mt-scrollbar p-6 md:p-10 flex justify-center">
      <div className="w-full max-w-2xl mt-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <div className="mt-seal"><Timer size={18} /></div>
          <div>
            <div className="mt-serif text-2xl font-semibold leading-tight">Set the clock</div>
            <div className="text-sm" style={{ color: 'var(--ink-soft)' }}>{paper.title} — {totalQ} questions</div>
          </div>
        </div>

        <div className="mt-card p-5 mb-4">
          <div className="mt-label mb-2">Total test duration</div>
          <div className="flex items-center gap-3">
            <NumField min={1} className="mt-input w-28" value={totalMinutes} onCommit={setTotalMinutes} />
            <span className="text-sm" style={{ color: 'var(--ink-soft)' }}>minutes — the exam auto-submits when this reaches zero</span>
          </div>
        </div>

        {paper.sections.length > 1 && (
        <div className="mt-card p-5 mb-4">
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input type="checkbox" checked={useSectionTiming} onChange={(e) => setUseSectionTiming(e.target.checked)} />
            <span className="mt-label">Per-section time limits</span>
          </label>
          {useSectionTiming && (
            <div className="space-y-2 pl-6">
              {paper.sections.map(s => (
                <div key={s.id} className="flex items-center gap-3">
                  <span className="text-sm flex-1">{s.name} <span style={{ color: 'var(--ink-faint)' }}>({s.questions.length} q)</span></span>
                  <NumField min={1} className="mt-input w-20" value={sectionMinutes[s.id] || 0} onCommit={(n) => setSectionMinutes({ ...sectionMinutes, [s.id]: n })} />
                  <span className="text-xs" style={{ color: 'var(--ink-faint)' }}>min</span>
                </div>
              ))}
              <div className="text-xs pt-1" style={{ color: sectionSum > totalMinutes ? 'var(--alert)' : 'var(--ink-faint)' }}>
                Sections total {sectionSum} min {sectionSum > totalMinutes ? '— exceeds total duration' : `of ${totalMinutes} min`}. Once a section's time runs out it locks and the test moves on.
              </div>
            </div>
          )}
        </div>
        )}

        <div className="mt-card p-5 mb-4">
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input type="checkbox" checked={useQuestionTiming} onChange={(e) => setUseQuestionTiming(e.target.checked)} />
            <span className="mt-label">Per-question time limit</span>
          </label>
          {useQuestionTiming && (
            <div className="flex items-center gap-3 pl-6">
              <NumField min={5} className="mt-input w-24" value={questionSeconds} onCommit={setQuestionSeconds} />
              <span className="text-sm" style={{ color: 'var(--ink-soft)' }}>seconds per question — auto-advances when it hits zero</span>
            </div>
          )}
        </div>

        <div className="mt-card p-5 mb-4">
          <div className="mt-label mb-1">Negative marking</div>
          <div className="text-xs mb-3" style={{ color: 'var(--ink-soft)' }}>Marks deducted for each wrong answer — set separately per question type (0 = off). If a type mixes questions worth different marks, you can also vary the penalty by marks.</div>
          {typesPresent.length === 0 ? (
            <div className="text-xs" style={{ color: 'var(--ink-faint)' }}>No auto-gradable question types (MCQ/MSQ/numeric/short) in this paper.</div>
          ) : (
            <div className="space-y-4">
              {typesPresent.map(t => {
                const cfg = negativeMarking[t];
                const marksValues = marksByType[t] || [1];
                const canVaryByMarks = marksValues.length > 1;
                return (
                  <div key={t} className={typesPresent.indexOf(t) < typesPresent.length - 1 ? 'pb-4 border-b mt-hairline' : ''}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm flex-1">{QUESTION_TYPE_LABELS[t]}</span>
                      {canVaryByMarks && (
                        <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: 'var(--ink-soft)' }}>
                          <input
                            type="checkbox"
                            checked={cfg.mode === 'byMarks'}
                            onChange={(e) => setNegativeMarking({ ...negativeMarking, [t]: { ...cfg, mode: e.target.checked ? 'byMarks' : 'flat' } })}
                          />
                          Vary by marks
                        </label>
                      )}
                    </div>
                    {cfg.mode === 'byMarks' && canVaryByMarks ? (
                      <div className="space-y-2 pl-3">
                        {marksValues.map(mk => (
                          <div key={mk} className="flex items-center gap-3">
                            <span className="text-xs flex-1" style={{ color: 'var(--ink-faint)' }}>{mk}-mark questions</span>
                            <NumField
                              min={0} step={0.25} integer={false} className="mt-input w-24"
                              value={cfg.byMarks[mk] ?? 0}
                              onCommit={(n) => setNegativeMarking({ ...negativeMarking, [t]: { ...cfg, byMarks: { ...cfg.byMarks, [mk]: n } } })}
                            />
                            <span className="text-xs" style={{ color: 'var(--ink-faint)' }}>marks off</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 pl-3">
                        <NumField
                          min={0} step={0.25} integer={false} className="mt-input w-24"
                          value={cfg.flat}
                          onCommit={(n) => setNegativeMarking({ ...negativeMarking, [t]: { ...cfg, flat: n } })}
                        />
                        <span className="text-xs" style={{ color: 'var(--ink-faint)' }}>marks off{canVaryByMarks ? ' (same for every marks value)' : ''}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-card p-5 mb-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={calculatorEnabled} onChange={(e) => setCalculatorEnabled(e.target.checked)} />
            <span className="mt-seal" style={{ width: '2.1rem', height: '2.1rem' }}><Calculator size={15} /></span>
            <span>
              <span className="mt-label block">Virtual calculator</span>
              <span className="text-sm" style={{ color: 'var(--ink-soft)' }}>Allow an on-screen scientific calculator (+ − × ÷, log, ln, x², √x, sin, cos, tan, antilog) during this test</span>
            </span>
          </label>
        </div>
      </div>
      </div>

      <div
        className="border-t mt-hairline p-4 flex-shrink-0"
        style={{ background: 'var(--paper)', paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="max-w-2xl w-full mx-auto flex items-center justify-between">
          <button className="mt-btn mt-btn-ghost" onClick={onBack}><ChevronLeft size={15} /> Back</button>
          <button
            className="mt-btn mt-btn-brass"
            onClick={() => {
              enterFullscreen();
              onStart({
                totalMinutes, useSectionTiming, sectionMinutes, useQuestionTiming, questionSeconds, negativeMarking, calculatorEnabled
              });
            }}
          >
            <Play size={15} /> Begin mock test
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SCREEN 4 — LIVE TEST (reducer-driven)
   ============================================================ */
function buildFlatQuestions(paper) {
  const flat = [];
  paper.sections.forEach((sec, sIdx) => {
    sec.questions.forEach(q => flat.push({ ...q, sectionId: sec.id, sectionName: sec.name, sectionIndex: sIdx }));
  });
  return flat;
}

// Builds { [orGroupId]: { chooseCount, members: [qid, ...] } } from the flat
// question list — this is the single source of truth for "how many of these
// alternative questions is the candidate actually allowed to answer".
function buildGroupInfo(flatQuestions) {
  const info = {};
  flatQuestions.forEach(q => {
    if (!q.orGroup) return;
    if (!info[q.orGroup]) info[q.orGroup] = { chooseCount: q.orGroupChoose || 1, members: [] };
    info[q.orGroup].members.push(q.id);
    if (q.orGroupChoose) info[q.orGroup].chooseCount = q.orGroupChoose;
  });
  Object.values(info).forEach(g => {
    g.chooseCount = Math.max(1, Math.min(g.chooseCount, g.members.length));
  });
  return info;
}

// Un-tracks a question from its OR group's "currently answered" order —
// used whenever an answer is cleared/emptied, so the group's remaining
// quota opens back up.
function removeFromGroupOrder(state, q) {
  if (!q.orGroup || !state.answerOrder[q.orGroup]) return state;
  const order = state.answerOrder[q.orGroup].filter(id => id !== q.id);
  return { ...state, answerOrder: { ...state.answerOrder, [q.orGroup]: order } };
}

// Registers that `q` now has an answer within its OR group, and — if that
// pushes the group over its allowed "choose N" quota — silently clears the
// oldest-answered sibling so the candidate never ends up with more answered
// alternatives than the paper allows. This is the "smooth" enforcement: no
// blocking dialog, the candidate just sees the earlier alternative's answer
// disappear (and the on-screen group note explains why).
function enforceGroupLimit(state, q) {
  const group = state.groupInfo[q.orGroup];
  if (!group) return state;
  const order = (state.answerOrder[q.orGroup] || []).filter(id => id !== q.id);
  order.push(q.id);

  let answers = state.answers;
  let status = state.status;
  while (order.length > group.chooseCount) {
    const evictId = order.shift();
    if (answers[evictId] !== undefined) {
      if (answers === state.answers) answers = { ...state.answers };
      delete answers[evictId];
      const curSt = status[evictId];
      const nextSt = curSt === 'answered-marked' ? 'marked' : 'not-answered';
      if (status === state.status) status = { ...state.status };
      status[evictId] = nextSt;
    }
  }
  return { ...state, answers, status, answerOrder: { ...state.answerOrder, [q.orGroup]: order } };
}

// Persists the live test attempt (paper + config + full reducer state) so
// that if the mobile OS/browser reclaims or reloads the page after the app
// is backgrounded/switched — which is what was silently discontinuing the
// test — the attempt can be transparently resumed exactly where it left off
// instead of being lost. Best-effort: storage errors (private mode, full
// quota, etc.) are swallowed since autosave should never crash the test.
// (saveTestProgress/loadTestProgress/clearTestProgress now live in
// ./testProgress.js so HomePage can reuse the resumable-test check without
// bundling this entire file — see the import at the top.)

function initTestState(paper, config) {
  const flatQuestions = buildFlatQuestions(paper);
  const sectionRemaining = {};
  paper.sections.forEach(s => { sectionRemaining[s.id] = (config.sectionMinutes[s.id] || 0) * 60; });
  const status = {};
  if (flatQuestions[0]) status[flatQuestions[0].id] = 'not-answered';
  return {
    paper, config, flatQuestions,
    answers: {}, status, timeSpent: {},
    groupInfo: buildGroupInfo(flatQuestions),
    answerOrder: {},
    currentIndex: 0,
    overallRemaining: config.totalMinutes * 60,
    sectionRemaining,
    questionRemaining: config.useQuestionTiming ? config.questionSeconds : null,
    lockedSections: {},
    finished: false,
    startedAt: Date.now(),
    lastTickAt: Date.now()
  };
}

function firstUnlockedIndexFrom(state, fromIndex, dir = 1) {
  const n = state.flatQuestions.length;
  let i = fromIndex;
  while (i >= 0 && i < n) {
    const q = state.flatQuestions[i];
    if (!state.lockedSections[q.sectionId]) return i;
    i += dir;
  }
  return -1;
}

function visit(status, qid) {
  if (!status[qid]) return { ...status, [qid]: 'not-answered' };
  return status;
}

function testReducer(state, action) {
  switch (action.type) {
    case 'SELECT_ANSWER': {
      const q = state.flatQuestions[state.currentIndex];
      const qid = q.id;
      const cur = state.status[qid];
      const isEmpty = action.value === '' || action.value === null || action.value === undefined;
      const nextStatus = isEmpty
        ? (cur === 'answered-marked' ? 'marked' : 'not-answered')
        : (cur === 'marked' || cur === 'answered-marked' ? 'answered-marked' : 'answered');
      const answers = { ...state.answers };
      if (isEmpty) delete answers[qid]; else answers[qid] = action.value;
      let next = { ...state, answers, status: { ...state.status, [qid]: nextStatus } };
      if (q.orGroup) next = isEmpty ? removeFromGroupOrder(next, q) : enforceGroupLimit(next, q);
      return next;
    }
    case 'TOGGLE_MSQ_OPTION': {
      const q = state.flatQuestions[state.currentIndex];
      const qid = q.id;
      const cur = state.status[qid];
      const existing = Array.isArray(state.answers[qid]) ? state.answers[qid] : [];
      const next = existing.includes(action.value) ? existing.filter(o => o !== action.value) : [...existing, action.value];
      const answers = { ...state.answers };
      if (next.length) answers[qid] = next; else delete answers[qid];
      const nextStatus = next.length
        ? (cur === 'marked' || cur === 'answered-marked' ? 'answered-marked' : 'answered')
        : (cur === 'answered-marked' ? 'marked' : 'not-answered');
      let nextState = { ...state, answers, status: { ...state.status, [qid]: nextStatus } };
      if (q.orGroup) nextState = next.length ? enforceGroupLimit(nextState, q) : removeFromGroupOrder(nextState, q);
      return nextState;
    }
    case 'CLEAR': {
      const q = state.flatQuestions[state.currentIndex];
      const qid = q.id;
      const cur = state.status[qid];
      const answers = { ...state.answers };
      delete answers[qid];
      const nextStatus = cur === 'answered-marked' ? 'marked' : 'not-answered';
      let next = { ...state, answers, status: { ...state.status, [qid]: nextStatus } };
      if (q.orGroup) next = removeFromGroupOrder(next, q);
      return next;
    }
    case 'TOGGLE_MARK': {
      const qid = state.flatQuestions[state.currentIndex].id;
      const cur = state.status[qid];
      const hasAnswer = state.answers[qid] !== undefined && state.answers[qid] !== '';
      let nextStatus;
      if (cur === 'marked' || cur === 'answered-marked') nextStatus = hasAnswer ? 'answered' : 'not-answered';
      else nextStatus = hasAnswer ? 'answered-marked' : 'marked';
      return { ...state, status: { ...state.status, [qid]: nextStatus } };
    }
    case 'GOTO': {
      const idx = action.index;
      const q = state.flatQuestions[idx];
      if (!q || state.lockedSections[q.sectionId]) return state;
      return { ...state, currentIndex: idx, status: visit(state.status, q.id), questionRemaining: state.config.useQuestionTiming ? state.config.questionSeconds : null };
    }
    case 'NEXT': {
      let idx = firstUnlockedIndexFrom(state, state.currentIndex + 1, 1);
      if (idx === -1) idx = state.currentIndex;
      const q = state.flatQuestions[idx];
      return { ...state, currentIndex: idx, status: visit(state.status, q.id), questionRemaining: state.config.useQuestionTiming ? state.config.questionSeconds : null };
    }
    case 'PREV': {
      let idx = firstUnlockedIndexFrom(state, state.currentIndex - 1, -1);
      if (idx === -1) idx = state.currentIndex;
      const q = state.flatQuestions[idx];
      return { ...state, currentIndex: idx, status: visit(state.status, q.id), questionRemaining: state.config.useQuestionTiming ? state.config.questionSeconds : null };
    }
    case 'TICK': {
      if (state.finished) return state;
      const now = action.now || Date.now();
      // Real elapsed seconds since the last tick, not a flat 1 — this is what
      // makes the countdown self-correct after the interval was throttled or
      // paused (e.g. the tab/app was backgrounded), instead of drifting.
      const elapsed = Math.max(1, Math.round((now - (state.lastTickAt || now)) / 1000));
      const q = state.flatQuestions[state.currentIndex];
      const overallRemaining = Math.max(0, state.overallRemaining - elapsed);
      const timeSpent = { ...state.timeSpent, [q.id]: (state.timeSpent[q.id] || 0) + elapsed };

      if (overallRemaining <= 0) {
        return { ...state, overallRemaining: 0, timeSpent, finished: true, lastTickAt: now };
      }

      let sectionRemaining = state.sectionRemaining;
      let lockedSections = state.lockedSections;
      let currentIndex = state.currentIndex;
      let questionRemaining = state.questionRemaining;
      let status = state.status;
      let finished = false;

      if (state.config.useSectionTiming) {
        const secLeft = (state.sectionRemaining[q.sectionId] ?? 0) - elapsed;
        sectionRemaining = { ...state.sectionRemaining, [q.sectionId]: Math.max(0, secLeft) };
        if (secLeft <= 0) {
          lockedSections = { ...state.lockedSections, [q.sectionId]: true };
          const nextIdx = firstUnlockedIndexFrom({ ...state, lockedSections }, state.currentIndex + 1, 1);
          if (nextIdx === -1) {
            finished = true;
          } else {
            currentIndex = nextIdx;
            status = visit(status, state.flatQuestions[nextIdx].id);
            questionRemaining = state.config.useQuestionTiming ? state.config.questionSeconds : null;
          }
        }
      }

      if (!finished && state.config.useQuestionTiming && questionRemaining !== null) {
        const qLeft = questionRemaining - elapsed;
        if (qLeft <= 0) {
          const nextIdx = firstUnlockedIndexFrom({ ...state, lockedSections }, currentIndex + 1, 1);
          if (nextIdx !== -1 && nextIdx !== currentIndex) {
            currentIndex = nextIdx;
            status = visit(status, state.flatQuestions[nextIdx].id);
            questionRemaining = state.config.questionSeconds;
          } else {
            questionRemaining = 0;
          }
        } else {
          questionRemaining = qLeft;
        }
      }

      return { ...state, overallRemaining, timeSpent, sectionRemaining, lockedSections, currentIndex, questionRemaining, status, finished, lastTickAt: now };
    }
    case 'SUBMIT':
      return { ...state, finished: true };
    default:
      return state;
  }
}

function enterFullscreen() {
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
  if (req) {
    try { req.call(el).catch(() => {}); } catch (e) { /* ignore */ }
  }
}

function exitFullscreen() {
  const isFs = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
  if (!isFs) return;
  const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
  if (exit) {
    try { exit.call(document).catch(() => {}); } catch (e) { /* ignore */ }
  }
}

/* ============================================================
   VIRTUAL CALCULATOR — header launcher + dropdown shown during
   the test, only when the candidate enabled it at setup time.
   Basic operations (+ − × ÷, decimal, clear) plus scientific
   functions (log, ln, square, square root, sin, cos, tan, antilog).
   ============================================================ */

// Only digits, the four basic operators, decimal points and spaces are ever
// allowed through to the evaluator — anything else is rejected outright, so
// there's no way for arbitrary code to reach the Function constructor below.
const CALC_SAFE_EXPR = /^[0-9+\-*/.\s]*$/;

function calcLastSegment(expr) {
  const parts = expr.split(/[+\-*/]/);
  return parts[parts.length - 1];
}

// Round away float noise (e.g. 0.1 + 0.2) while keeping real precision.
function calcRound(n) {
  return Math.round((n + Number.EPSILON) * 1e10) / 1e10;
}

function calcEvaluate(expr) {
  if (!expr || !CALC_SAFE_EXPR.test(expr)) throw new Error('invalid expression');
  // Strip a trailing operator (e.g. user hits "=" right after "12+") so
  // evaluation doesn't blow up on an incomplete expression.
  const clean = expr.replace(/[+\-*/.]+$/, (m) => (m.includes('.') ? m : ''));
  if (!clean) throw new Error('empty expression');
  // eslint-disable-next-line no-new-func
  const result = Function(`"use strict"; return (${clean});`)();
  if (typeof result !== 'number' || !isFinite(result)) throw new Error('bad result');
  return calcRound(result);
}

// Scientific functions apply to the fully-evaluated current value — pressing
// one evaluates whatever expression is on screen, then replaces the display
// with the function's result (same feel as pressing "="). Angles for the
// trig functions are taken in degrees, matching a standard exam calculator.
const CALC_SCI_FNS = {
  sin: (x) => Math.sin((x * Math.PI) / 180),
  cos: (x) => Math.cos((x * Math.PI) / 180),
  tan: (x) => Math.tan((x * Math.PI) / 180),
  log: (x) => Math.log10(x),
  ln: (x) => Math.log(x),
  sq: (x) => x * x,
  sqrt: (x) => Math.sqrt(x),
  antilog: (x) => Math.pow(10, x),
};

function CalculatorWidget({ hidden }) {
  const [open, setOpen] = useState(false);
  const [expr, setExpr] = useState('');
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [errored, setErrored] = useState(false);

  // When the mobile question palette drawer opens, close the calculator dropdown
  // (if open) and drop the whole widget behind the drawer, rather than letting it
  // float on top of it.
  useEffect(() => {
    if (hidden) setOpen(false);
  }, [hidden]);

  const display = errored ? 'Error' : (expr || '0');

  const press = (val) => {
    if (val === 'AC') {
      setExpr(''); setJustEvaluated(false); setErrored(false);
      return;
    }
    if (val === 'DEL') {
      if (errored) { setExpr(''); setErrored(false); return; }
      if (justEvaluated) return; // don't backspace into a freshly computed result
      setExpr((e) => e.slice(0, -1));
      return;
    }
    if (val === '=') {
      try {
        const result = calcEvaluate(expr);
        setExpr(String(result));
        setJustEvaluated(true);
        setErrored(false);
      } catch (e) {
        setErrored(true);
        setJustEvaluated(false);
      }
      return;
    }

    if (CALC_SCI_FNS[val]) {
      try {
        const current = calcEvaluate(expr || '0');
        const result = calcRound(CALC_SCI_FNS[val](current));
        if (typeof result !== 'number' || !isFinite(result)) throw new Error('bad result');
        setExpr(String(result));
        setJustEvaluated(true);
        setErrored(false);
      } catch (e) {
        setErrored(true);
        setJustEvaluated(false);
      }
      return;
    }

    const isOperator = ['+', '-', '*', '/'].includes(val);

    if (errored) {
      // Any key after an error starts a fresh expression.
      setErrored(false);
      setExpr(isOperator ? '' : val);
      setJustEvaluated(false);
      return;
    }

    setExpr((e) => {
      if (justEvaluated) {
        setJustEvaluated(false);
        if (isOperator) return e + val; // chain another operation onto the result
        return val === '.' ? '0.' : val;  // start a brand-new number
      }
      if (val === '.') {
        // No second decimal point within the current number segment.
        if (calcLastSegment(e).includes('.')) return e;
        return e === '' ? '0.' : e + '.';
      }
      if (isOperator) {
        if (e === '') return val === '-' ? '-' : e; // only "-" may lead
        if (/[+\-*/]$/.test(e)) return e.slice(0, -1) + val; // swap trailing operator
        return e + val;
      }
      return e + val;
    });
  };

  return (
    <div className="mt-calc-wrap" style={hidden ? { zIndex: 30, position: 'relative' } : undefined}>
      <button
        className={`mt-calc-fab ${open ? 'open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        title={open ? 'Close calculator' : 'Open calculator'}
        aria-label={open ? 'Close calculator' : 'Open calculator'}
        disabled={hidden}
      >
        {open ? <X size={18} /> : <Calculator size={18} />}
      </button>

      {open && (
        <div className="mt-calc-panel mt-fade-in">
          <div className="mt-calc-head">
            <span className="mt-calc-title"><Calculator size={13} /> Calculator</span>
            <button className="mt-calc-close" onClick={() => setOpen(false)} aria-label="Close calculator"><X size={15} /></button>
          </div>
          <div className="mt-calc-display">{display}</div>
          <div className="mt-calc-body">
            <div className="mt-calc-row">
              <button className="mt-calc-btn fn" onClick={() => press('sin')}>sin</button>
              <button className="mt-calc-btn fn" onClick={() => press('cos')}>cos</button>
              <button className="mt-calc-btn fn" onClick={() => press('tan')}>tan</button>
              <button className="mt-calc-btn fn" onClick={() => press('log')}>log</button>
            </div>
            <div className="mt-calc-row">
              <button className="mt-calc-btn fn" onClick={() => press('ln')}>ln</button>
              <button className="mt-calc-btn fn" onClick={() => press('sq')}>x²</button>
              <button className="mt-calc-btn fn" onClick={() => press('sqrt')}>√x</button>
              <button className="mt-calc-btn fn" onClick={() => press('antilog')}>antilog</button>
            </div>
            <div className="mt-calc-divider" />
            <div className="mt-calc-row">
              <button className="mt-calc-btn clear" onClick={() => press('AC')}>AC</button>
              <button className="mt-calc-btn clear" onClick={() => press('DEL')}><Delete size={16} /></button>
              <button className="mt-calc-btn op" onClick={() => press('%')}>%</button>
              <button className="mt-calc-btn op" onClick={() => press('/')}>÷</button>
            </div>
            <div className="mt-calc-row">
              <button className="mt-calc-btn" onClick={() => press('7')}>7</button>
              <button className="mt-calc-btn" onClick={() => press('8')}>8</button>
              <button className="mt-calc-btn" onClick={() => press('9')}>9</button>
              <button className="mt-calc-btn op" onClick={() => press('*')}>×</button>
            </div>
            <div className="mt-calc-row">
              <button className="mt-calc-btn" onClick={() => press('4')}>4</button>
              <button className="mt-calc-btn" onClick={() => press('5')}>5</button>
              <button className="mt-calc-btn" onClick={() => press('6')}>6</button>
              <button className="mt-calc-btn op" onClick={() => press('-')}>−</button>
            </div>
            <div className="mt-calc-row">
              <button className="mt-calc-btn" onClick={() => press('1')}>1</button>
              <button className="mt-calc-btn" onClick={() => press('2')}>2</button>
              <button className="mt-calc-btn" onClick={() => press('3')}>3</button>
              <button className="mt-calc-btn op" onClick={() => press('+')}>+</button>
            </div>
            <div className="mt-calc-row">
              <button className="mt-calc-btn zero" onClick={() => press('0')}>0</button>
              <button className="mt-calc-btn" onClick={() => press('.')}>.</button>
              <button className="mt-calc-btn equals" onClick={() => press('=')}>=</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Tracks whether we're at the desktop ("lg", >=1024px) layout using a real
// matchMedia listener, instead of leaving it purely to CSS. We need this in
// JS because the mobile question-palette drawer (and the calculator lock
// tied to it) must never end up in a state where the drawer's "open" flag
// is true but the drawer itself is CSS-hidden — that stranded state is what
// was locking the calculator permanently on wider/laptop screens. Tying the
// drawer's lifecycle to this single source of truth means the two can never
// disagree, regardless of window resizing, browser zoom, or a scrollbar
// nudging the viewport a few pixels either side of the breakpoint.
const DESKTOP_QUERY = '(min-width: 1024px)';
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(DESKTOP_QUERY).matches : false
  );
  useEffect(() => {
    if (!window.matchMedia) return;
    const mql = window.matchMedia(DESKTOP_QUERY);
    const onChange = (e) => setIsDesktop(e.matches);
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else mql.addListener(onChange); // older Safari
    setIsDesktop(mql.matches);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else mql.removeListener(onChange);
    };
  }, []);
  return isDesktop;
}

// Splits question/option text on "[[fig:ID]]" markers left by extraction,
// returning an ordered list of plain-text chunks and figure references —
// this is what lets a marker sitting in the middle of a sentence turn into
// an actual inline picture instead of literal bracket text.
function splitFigureMarkers(str) {
  if (typeof str !== 'string' || !str.includes('[[fig:')) return [{ type: 'text', value: str || '' }];
  const parts = [];
  const re = /\[\[fig:([^\]]+)]]/g;
  let last = 0, m;
  while ((m = re.exec(str))) {
    if (m.index > last) parts.push({ type: 'text', value: str.slice(last, m.index) });
    parts.push({ type: 'figure', id: m[1] });
    last = re.lastIndex;
  }
  if (last < str.length) parts.push({ type: 'text', value: str.slice(last) });
  return parts;
}

// A single figure, cropped straight from the source PDF page. Tap/click to
// see it full-size — small print inside a diagram (axis labels, circuit
// values) is often unreadable at the compact inline size.
function FigureImage({ src }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <img
        src={src}
        alt="Figure"
        onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
        style={{
          display: 'block', maxWidth: '100%', maxHeight: 220, borderRadius: 8,
          border: '1px solid var(--rule)', margin: '0.5rem 0', cursor: 'zoom-in'
        }}
      />
      {expanded && (
        <div
          onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(20,17,13,0.86)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', cursor: 'zoom-out'
          }}
        >
          <img src={src} alt="Figure enlarged" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8 }} />
        </div>
      )}
    </>
  );
}

// Renders question/option text that may contain "[[fig:ID]]" markers as the
// real cropped picture inline with the surrounding words, falling back to
// plain text untouched when there are no markers (the overwhelming majority
// of questions) or when a marker has no matching rendered image (extraction
// wasn't a PDF, or that one figure failed to crop) — in which case the
// marker is simply dropped rather than shown as literal bracket text.
function FigureText({ text, figures }) {
  const parts = splitFigureMarkers(text);
  if (parts.length === 1 && parts[0].type === 'text') return parts[0].value;
  return parts.map((p, i) => {
    if (p.type === 'text') return p.value ? <React.Fragment key={i}>{p.value}</React.Fragment> : null;
    const src = figures && figures[p.id];
    return src ? <FigureImage key={i} src={src} /> : null;
  });
}

function TestScreen({ paper, config, onFinish }) {
  const [state, dispatch] = useReducer(testReducer, undefined, () => {
    // If the app was switched away, backgrounded, or the page got reloaded
    // mid-test (common on mobile when the OS reclaims memory), resume the
    // saved attempt instead of silently restarting a fresh one.
    const saved = loadTestProgress();
    if (
      saved && saved.state && !saved.state.finished && saved.paper && saved.config &&
      saved.paper.title === paper.title &&
      saved.state.flatQuestions.length === buildFlatQuestions(paper).length
    ) {
      return saved.state;
    }
    return initTestState(paper, config);
  });
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPaletteMobile, setShowPaletteMobile] = useState(false);
  const [showFsPrompt, setShowFsPrompt] = useState(false);
  const isDesktop = useIsDesktop();
  const stateRef = useRef(state);
  stateRef.current = state;

  // Autosave every change (answers, navigation, timer ticks) so an
  // interrupted attempt — app switched, tab backgrounded, page reloaded —
  // can be resumed exactly where it left off rather than discontinuing.
  useEffect(() => {
    if (!state.finished) saveTestProgress(paper, config, state);
  }, [state, paper, config]);

  // Safety net: if the window is (or becomes) desktop-sized while the mobile
  // palette drawer thinks it's open — e.g. the browser was resized/maximized,
  // or the viewport briefly reported < 1024px due to a scrollbar — force the
  // drawer closed immediately. Without this, the drawer could be flagged
  // "open" while CSS hides it (no close button reachable), which is exactly
  // what was leaving the calculator disabled with no way to re-enable it.
  useEffect(() => {
    if (isDesktop && showPaletteMobile) setShowPaletteMobile(false);
  }, [isDesktop, showPaletteMobile]);

  useEffect(() => {
    const tick = () => dispatch({ type: 'TICK', now: Date.now() });
    const interval = setInterval(tick, 1000);
    // Mobile browsers throttle/suspend setInterval while the app is in the
    // background or another app is switched to. Rather than let the clock
    // silently stall, resync immediately (elapsed-time-based TICK catches up
    // in one shot) the moment the app is visible/focused again.
    const onVisible = () => { if (document.visibilityState === 'visible') tick(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', tick);
    window.addEventListener('pageshow', tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', tick);
      window.removeEventListener('pageshow', tick);
    };
  }, []);

  // Enter fullscreen as soon as the test screen mounts (fallback in case
  // the "Begin mock test" click didn't get the gesture through), and make
  // sure we always leave fullscreen when the test screen unmounts.
  useEffect(() => {
    enterFullscreen();
    const handler = () => {
      const isFs = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
      setShowFsPrompt(!isFs);
    };
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    handler();
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler);
      exitFullscreen();
    };
  }, []);

  useEffect(() => {
    if (state.finished) {
      clearTestProgress();
      exitFullscreen();
      onFinish({ ...state, figures: paper.figures || null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.finished]);

  const q = state.flatQuestions[state.currentIndex];
  const answer = state.answers[q.id];
  const isLocked = state.lockedSections[q.sectionId];

  const overallCritical = state.overallRemaining <= 60;
  const sectionCritical = state.config.useSectionTiming && (state.sectionRemaining[q.sectionId] ?? 0) <= 30;

  const counts = useMemo(() => {
    const c = { answered: 0, notAnswered: 0, marked: 0, notVisited: 0 };
    state.flatQuestions.forEach(fq => {
      const st = state.status[fq.id];
      if (st === 'answered' || st === 'answered-marked') c.answered++;
      else if (st === 'marked') c.marked++;
      else if (st === 'not-answered') c.notAnswered++;
      else c.notVisited++;
    });
    return c;
  }, [state.status, state.flatQuestions]);

  const sectionsForPalette = paper.sections;

  return (
    <div className="mt-viewport-fixed">
      {/* Header */}
      <div className="border-b mt-hairline px-3 md:px-6 py-2.5 md:py-3 flex items-center justify-between gap-2 md:gap-3 flex-shrink-0" style={{ background: '#fff' }}>
        <div className="min-w-0">
          <div className="mt-serif font-semibold text-sm md:text-base truncate">{paper.title}</div>
          <div className="text-xs truncate" style={{ color: 'var(--ink-soft)' }}>{paper.sections.length > 1 ? `${q.sectionName} · ` : ''}Q{state.currentIndex + 1} of {state.flatQuestions.length}</div>
        </div>
        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          {state.config.useSectionTiming && (
            <div className="text-right hidden sm:block">
              <div className="mt-label" style={{ fontSize: '0.62rem' }}>Section</div>
              <div className={`mt-flip mt-mono text-sm ${sectionCritical ? 'mt-pulse' : ''}`} style={{ color: sectionCritical ? 'var(--alert)' : 'var(--ink)' }}>
                {fmtClock(state.sectionRemaining[q.sectionId] ?? 0)}
              </div>
            </div>
          )}
          {state.config.calculatorEnabled && <CalculatorWidget hidden={!isDesktop && showPaletteMobile} />}
          <div className="text-right">
            <div className="mt-label" style={{ fontSize: '0.62rem' }}>Time left</div>
            <div className={`mt-flip mt-mono text-base md:text-xl ${overallCritical ? 'mt-pulse' : ''}`} style={{ color: overallCritical ? 'var(--alert)' : 'var(--ink)' }}>
              {fmtClock(state.overallRemaining)}
            </div>
          </div>
          {!isDesktop && (
            <button className="mt-btn mt-btn-ghost" onClick={() => setShowPaletteMobile(true)}><Layers size={16} /></button>
          )}
        </div>
      </div>

      {showFsPrompt && (
        <div className="flex-shrink-0 flex items-center justify-between gap-3 px-3 md:px-6 py-2 text-xs" style={{ background: 'var(--brass-soft)', color: 'var(--ink)' }}>
          <span className="flex items-center gap-1.5"><AlertTriangle size={13} style={{ color: 'var(--brass)' }} /> You're not in full screen mode.</span>
          <button className="mt-btn mt-btn-brass" style={{ padding: '0.35rem 0.7rem', fontSize: '0.72rem' }} onClick={enterFullscreen}>Enter full screen</button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Main question panel */}
        <div className="flex-1 overflow-y-auto mt-scrollbar p-5 md:p-8">
          <div className="max-w-2xl mx-auto">
            {isLocked && (
              <div className="mb-4 flex items-center gap-2 text-sm p-3 rounded" style={{ background: 'var(--alert-soft)', color: 'var(--alert)' }}>
                <AlertTriangle size={16} /> This section's time is up. Your response is locked in.
              </div>
            )}
            {state.config.useQuestionTiming && !isLocked && (
              <div className="mb-4 flex items-center gap-2 text-xs" style={{ color: 'var(--ink-soft)' }}>
                <Clock size={13} />
                <span>{fmtClock(state.questionRemaining ?? 0)} left on this question</span>
                <div className="flex-1 h-1 rounded" style={{ background: 'var(--rule)' }}>
                  <div className="h-1 rounded" style={{ width: `${Math.max(0, Math.min(100, ((state.questionRemaining ?? 0) / state.config.questionSeconds) * 100))}%`, background: (state.questionRemaining ?? 0) <= 10 ? 'var(--alert)' : 'var(--brass)' }} />
                </div>
              </div>
            )}

            {q.orGroup && !isLocked && (() => {
              const group = state.groupInfo[q.orGroup];
              const order = state.answerOrder[q.orGroup] || [];
              const members = group.members
                .map(mid => ({ q: state.flatQuestions.find(fq => fq.id === mid), idx: state.flatQuestions.findIndex(fq => fq.id === mid) }))
                .filter(m => m.q);
              return (
                <div className="mb-4 p-3 rounded text-xs flex items-start gap-2" style={{ background: 'var(--brass-soft)', color: 'var(--ink)' }}>
                  <Link2 size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--brass)' }} />
                  <div className="flex-1">
                    <div className="font-semibold mb-1.5">
                      This is an OR question — answer only {group.chooseCount} of these {members.length} ({order.length}/{group.chooseCount} answered)
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {members.map(({ q: mq, idx }) => {
                        const isCurrent = mq.id === q.id;
                        const isCounted = order.includes(mq.id);
                        return (
                          <button
                            key={mq.id}
                            className="mt-btn"
                            style={{
                              padding: '0.25rem 0.55rem', fontSize: '0.72rem',
                              background: isCurrent ? 'var(--ink)' : (isCounted ? 'var(--answered)' : '#fff'),
                              color: isCurrent || isCounted ? '#fff' : 'var(--ink-soft)',
                              border: '1px solid ' + (isCurrent ? 'var(--ink)' : (isCounted ? 'var(--answered)' : 'var(--rule)'))
                            }}
                            onClick={() => !isCurrent && dispatch({ type: 'GOTO', index: idx })}
                          >
                            Q{idx + 1}{isCounted ? ' ✓' : ''}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ color: 'var(--ink-soft)' }}>
                      {order.length >= group.chooseCount && !order.includes(q.id)
                        ? 'Answering this will replace your oldest answer among these alternatives.'
                        : 'Only your answers to the required number above will be scored — the rest are optional.'}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="mt-serif text-lg leading-relaxed" style={{ minWidth: 0 }}>
                <span className="mt-mono text-sm mr-2" style={{ color: 'var(--ink-faint)' }}>Q{state.currentIndex + 1}.</span>
                <FigureText text={q.text} figures={paper.figures} />
              </div>
            </div>
            <div className="text-xs mb-5" style={{ color: 'var(--ink-faint)' }}>
              {q.marks} mark{q.marks === 1 ? '' : 's'}
              {(() => {
                const nm = getNegativeMarking(state.config, q.type, q.marks);
                return nm > 0 ? ` · −${nm} if wrong` : '';
              })()}
              {q.type === 'msq' ? ' · one or more options may be correct' : ''}
              {q.orGroup ? ' · OR question' : ''}
            </div>

            {q.type === 'mcq' && (
              <div className="space-y-2">
                {(q.options || []).map((opt, i) => (
                  <div key={i} className={`mt-option-row ${answer === opt ? 'selected' : ''}`} onClick={() => !isLocked && dispatch({ type: 'SELECT_ANSWER', value: opt })}>
                    <div className={`mt-radio ${answer === opt ? 'checked' : ''}`} />
                    <span className="text-sm" style={{ minWidth: 0 }}>{String.fromCharCode(65 + i)}. <FigureText text={opt} figures={paper.figures} /></span>
                  </div>
                ))}
              </div>
            )}
            {q.type === 'msq' && (
              <div className="space-y-2">
                {(q.options || []).map((opt, i) => {
                  const selected = Array.isArray(answer) && answer.includes(opt);
                  return (
                    <div key={i} className={`mt-option-row ${selected ? 'selected' : ''}`} onClick={() => !isLocked && dispatch({ type: 'TOGGLE_MSQ_OPTION', value: opt })}>
                      <div className="mt-radio" style={{ borderRadius: '4px' }}>
                        {selected ? <Check size={11} style={{ color: 'var(--ink)' }} /> : null}
                      </div>
                      <span className="text-sm" style={{ minWidth: 0 }}>{String.fromCharCode(65 + i)}. <FigureText text={opt} figures={paper.figures} /></span>
                    </div>
                  );
                })}
              </div>
            )}
            {q.type === 'numeric' && (
              <input
                type="number"
                className="mt-input max-w-xs"
                placeholder="Enter numeric answer"
                value={answer ?? ''}
                disabled={isLocked}
                onChange={(e) => dispatch({ type: 'SELECT_ANSWER', value: e.target.value })}
              />
            )}
            {q.type === 'short' && (
              <input
                type="text"
                className="mt-input"
                placeholder="Enter your answer"
                value={answer ?? ''}
                disabled={isLocked}
                onChange={(e) => dispatch({ type: 'SELECT_ANSWER', value: e.target.value })}
              />
            )}
            {q.type === 'descriptive' && (
              <textarea
                className="mt-textarea mt-scrollbar"
                rows={8}
                placeholder="Write your answer…"
                value={answer ?? ''}
                disabled={isLocked}
                onChange={(e) => dispatch({ type: 'SELECT_ANSWER', value: e.target.value })}
              />
            )}
          </div>
        </div>

        {/* Palette sidebar (desktop) — palette scrolls, Submit Test stays
            pinned at the bottom of the sidebar itself (not the question
            action bar), matching the reference layout. */}
        {isDesktop && (
          <div className="w-72 border-l mt-hairline flex flex-col" style={{ background: '#fff' }}>
            <div className="flex-1 overflow-y-auto mt-scrollbar p-4">
              <PaletteContent state={state} dispatch={dispatch} counts={counts} sections={sectionsForPalette} />
            </div>
            <div className="flex-shrink-0 p-4 border-t mt-hairline">
              <button className="mt-btn mt-btn-brass w-full justify-center" onClick={() => setShowSubmitModal(true)}>Submit Test</button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom action bar — stays fixed at the bottom of the viewport; only the
          question panel above scrolls. Labels collapse to icons on narrow screens.
          Submit Test lives in the sidebar/palette drawer instead of here. */}
      <div className="flex-shrink-0 border-t mt-hairline px-2.5 md:px-6 py-2.5 md:py-3 flex items-center justify-between gap-1.5 md:gap-2" style={{ background: '#fff' }}>
        <div className="flex items-center gap-1.5 md:gap-2">
          <button className="mt-btn mt-btn-ghost" onClick={() => dispatch({ type: 'PREV' })} disabled={state.currentIndex === 0}><ChevronLeft size={15} /> <span className="hidden sm:inline">Previous</span></button>
          <button className="mt-btn mt-btn-outline-accent" onClick={() => { dispatch({ type: 'TOGGLE_MARK' }); dispatch({ type: 'NEXT' }); }} disabled={isLocked}><Flag size={14} /> <span className="hidden sm:inline">Mark for Review &amp; Next</span><span className="sm:hidden">Mark</span></button>
          <button className="mt-btn mt-btn-outline-accent" onClick={() => dispatch({ type: 'CLEAR' })} disabled={isLocked}><RotateCcw size={14} /> <span className="hidden sm:inline">Clear Response</span><span className="sm:hidden">Clear</span></button>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <button className="mt-btn mt-btn-primary" onClick={() => dispatch({ type: 'NEXT' })}><span className="hidden sm:inline">Save & Next</span><span className="sm:hidden">Next</span> <ChevronRight size={15} /></button>
          {!isDesktop && (
            <button className="mt-btn mt-btn-brass" onClick={() => setShowSubmitModal(true)}><span className="hidden sm:inline">Submit Test</span><span className="sm:hidden">Submit</span></button>
          )}
        </div>
      </div>

      {!isDesktop && showPaletteMobile && (
        <div className="fixed inset-0 z-40 flex justify-end" style={{ background: 'rgba(28,37,65,0.4)' }} onClick={() => setShowPaletteMobile(false)}>
          <div className="w-72 max-w-[85vw] h-full bg-white flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex-1 overflow-y-auto mt-scrollbar p-4">
              <div className="flex justify-end mb-2"><button onClick={() => setShowPaletteMobile(false)}><X size={18} /></button></div>
              <PaletteContent state={state} dispatch={dispatch} counts={counts} sections={sectionsForPalette} onGoto={() => setShowPaletteMobile(false)} />
            </div>
            <div className="flex-shrink-0 p-4 border-t mt-hairline">
              <button className="mt-btn mt-btn-brass w-full justify-center" onClick={() => { setShowPaletteMobile(false); setShowSubmitModal(true); }}>Submit Test</button>
            </div>
          </div>
        </div>
      )}

      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(28,37,65,0.45)' }}>
          <div className="mt-card p-6 max-w-sm w-full mt-fade-in">
            <div className="mt-serif text-lg font-semibold mb-3">Submit the test?</div>
            <div className="space-y-1.5 text-sm mb-5">
              <div className="flex justify-between"><span style={{ color: 'var(--ink-soft)' }}>Answered</span><span className="mt-mono">{counts.answered}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--ink-soft)' }}>Not answered</span><span className="mt-mono">{counts.notAnswered}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--ink-soft)' }}>Marked for review</span><span className="mt-mono">{counts.marked}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--ink-soft)' }}>Not visited</span><span className="mt-mono">{counts.notVisited}</span></div>
              <div className="flex justify-between pt-1"><span style={{ color: 'var(--ink-soft)' }}>Time remaining</span><span className="mt-mono">{fmtClock(state.overallRemaining)}</span></div>
            </div>
            <div className="flex gap-2">
              <button className="mt-btn mt-btn-ghost flex-1 justify-center" onClick={() => setShowSubmitModal(false)}>Keep going</button>
              <button className="mt-btn mt-btn-brass flex-1 justify-center" onClick={() => dispatch({ type: 'SUBMIT' })}>Submit now</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function PaletteContent({ state, dispatch, counts, sections, onGoto }) {
  const statusClass = (fq) => {
    if (state.lockedSections[fq.sectionId]) return 'locked';
    const st = state.status[fq.id];
    if (!st) return 'not-visited';
    return st;
  };
  return (
    <div>
      <div className="mt-label mb-3">Question palette</div>
      <div className="grid grid-cols-2 gap-2 mb-5 text-xs">
        <LegendDot color="var(--answered)" label={`Answered (${counts.answered})`} />
        <LegendDot color="var(--alert)" label={`Not answered (${counts.notAnswered})`} />
        <LegendDot color="var(--review)" label={`Marked (${counts.marked})`} />
        <LegendDot color="var(--ink-faint)" label={`Not visited (${counts.notVisited})`} />
      </div>
      <div className="flex items-center gap-1.5 text-xs mb-4" style={{ color: 'var(--ink-soft)' }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--brass)', display: 'inline-block' }} />
        <span>OR question — only some of a group need answering</span>
      </div>
      {sections.map(sec => {
        const qs = state.flatQuestions.map((fq, idx) => ({ fq, idx })).filter(x => x.fq.sectionId === sec.id);
        if (!qs.length) return null;
        return (
          <div key={sec.id} className="mb-4">
            {sections.length > 1 && (
              <div className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--ink-soft)' }}>
                {sec.name}
                {state.lockedSections[sec.id] && <span className="text-xs" style={{ color: 'var(--alert)' }}>(locked)</span>}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {qs.map(({ fq, idx }) => (
                <button
                  key={fq.id}
                  className={`mt-bubble ${statusClass(fq)} ${idx === state.currentIndex ? 'current' : ''} ${fq.orGroup ? 'or-group' : ''}`}
                  onClick={() => { dispatch({ type: 'GOTO', index: idx }); onGoto && onGoto(); }}
                  disabled={state.lockedSections[fq.sectionId]}
                  title={fq.orGroup ? `OR question — choose ${state.groupInfo[fq.orGroup]?.chooseCount || 1} of its group` : undefined}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span style={{ width: 9, height: 9, borderRadius: 999, background: color, display: 'inline-block' }} />
      <span style={{ color: 'var(--ink-soft)' }}>{label}</span>
    </div>
  );
}

/* ============================================================
   SCREEN 5 — RESULTS
   ============================================================ */
function normalize(v) {
  return (v ?? '').toString().trim().toLowerCase();
}

function hasRealAnswer(q, ans) {
  if (q.type === 'msq') return Array.isArray(ans) && ans.length > 0;
  return ans !== undefined && ans !== '' && ans !== null;
}

// For msq, correctness requires the selected set to exactly match the correct
// set (all correct options chosen, no incorrect ones) — the standard GATE/SSC rule.
function answerIsCorrect(q, ans) {
  if (q.type === 'msq') {
    if (!Array.isArray(ans) || !Array.isArray(q.correctAnswer)) return false;
    const a = Array.from(new Set(ans.map(normalize))).sort();
    const b = Array.from(new Set(q.correctAnswer.map(normalize))).sort();
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }
  return normalize(ans) === normalize(q.correctAnswer);
}

// Formats a score to up to 3 decimal places, trimming trailing zeros
// (7 -> "7", 7.5 -> "7.5", 7.256 -> "7.256") and fixing float precision
// artifacts from repeated negative-marking subtraction (e.g. 6.999999999).
function fmtScore(n) {
  const rounded = Math.round((n + Number.EPSILON) * 1000) / 1000;
  return rounded.toString();
}

// True for a question type/correctAnswer combo that the "gradable" (auto-scored)
// branch below would score — mirrors the mcq/msq/numeric check used everywhere else.
function isAutoGradable(q) {
  const hasCorrectAnswer = q.type === 'msq' ? Array.isArray(q.correctAnswer) && q.correctAnswer.length > 0 : !!q.correctAnswer;
  return (q.type === 'mcq' || q.type === 'msq' || q.type === 'numeric') && hasCorrectAnswer;
}

function gradeTest(state) {
  let maxObjective = 0, obtained = 0, correctCount = 0, wrongCount = 0, unansweredObjective = 0;
  const needsReview = [];
  const perQuestion = [];
  const groupInfo = state.groupInfo || {};
  const answerOrder = state.answerOrder || {};
  const groupAccountedFor = {};

  state.flatQuestions.forEach((q, idx) => {
    let verdict = 'ungraded';

    if (q.orGroup && groupInfo[q.orGroup]) {
      const group = groupInfo[q.orGroup];
      const order = answerOrder[q.orGroup] || [];
      const wasAnswered = order.includes(q.id);

      // Account for the group's contribution to maxObjective / unanswered count
      // exactly once (the first time we encounter any of its members), so a
      // 2-question "either/or" contributes one slot's worth of marks, not two.
      if (!groupAccountedFor[q.orGroup]) {
        groupAccountedFor[q.orGroup] = true;
        const members = state.flatQuestions.filter(m => m.orGroup === q.orGroup);
        const gradableMembers = members.filter(m => isAutoGradable(m) || (m.type === 'short' && m.correctAnswer));
        if (gradableMembers.length) {
          const topMarks = gradableMembers.map(m => m.marks).sort((a, b) => b - a).slice(0, group.chooseCount);
          maxObjective += topMarks.reduce((a, b) => a + b, 0);
          const answeredGradableCount = gradableMembers.filter(m => order.includes(m.id)).length;
          unansweredObjective += Math.max(0, group.chooseCount - answeredGradableCount);
        }
      }

      // A member the candidate didn't choose to answer isn't required and isn't
      // scored — it's simply excluded rather than marked wrong/unanswered.
      if (!wasAnswered) {
        perQuestion.push({ index: idx + 1, id: q.id, time: state.timeSpent[q.id] || 0, verdict: 'not-required' });
        return;
      }
    }

    const ans = state.answers[q.id];
    const hasAnswer = hasRealAnswer(q, ans);
    const gradable = isAutoGradable(q);

    if (gradable) {
      if (!q.orGroup) maxObjective += q.marks;
      if (!hasAnswer) {
        if (!q.orGroup) unansweredObjective++;
        verdict = 'unanswered';
      } else if (answerIsCorrect(q, ans)) {
        obtained += q.marks;
        correctCount++;
        verdict = 'correct';
      } else {
        obtained -= getNegativeMarking(state.config, q.type, q.marks);
        wrongCount++;
        verdict = 'wrong';
      }
    } else if (q.type === 'short' && q.correctAnswer) {
      if (!q.orGroup) maxObjective += q.marks;
      if (!hasAnswer) { if (!q.orGroup) unansweredObjective++; verdict = 'unanswered'; }
      else if (answerIsCorrect(q, ans)) { obtained += q.marks; correctCount++; verdict = 'correct'; }
      else { obtained -= getNegativeMarking(state.config, q.type, q.marks); wrongCount++; verdict = 'wrong'; needsReview.push(q); }
    } else {
      needsReview.push(q);
    }

    perQuestion.push({
      index: idx + 1,
      id: q.id,
      time: state.timeSpent[q.id] || 0,
      verdict
    });
  });

  return { maxObjective, obtained, correctCount, wrongCount, unansweredObjective, needsReview, perQuestion };
}

// Builds and downloads a PDF analytics report for the completed test:
// overall score, breakdown counts, time used, and a per-question table.
// jsPDF/autotable are fairly heavy and only needed here, so they're
// dynamically imported at click-time rather than bundled up front —
// same pattern used for mammoth (.docx parsing) in UploadScreen.
async function generateResultsPdf(state, grade) {
  const [{ default: jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const autoTable = autoTableModule.default;

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 40;
  const ink = [28, 37, 65];
  const brass = [169, 130, 47];
  const inkSoft = [76, 86, 122];

  let y = 50;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...ink);
  doc.text('Mocksy — Mock Test Report', marginX, y);

  y += 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...inkSoft);
  doc.text(state.paper.title || 'Untitled Mock Test', marginX, y);

  const timeUsed = Math.max(0, state.config.totalMinutes * 60 - state.overallRemaining);
  y += 16;
  doc.setFontSize(9.5);
  doc.text(`Completed on ${new Date().toLocaleString()} · Time used: ${fmtClock(timeUsed)}`, marginX, y);

  // Summary stat boxes
  y += 24;
  const stats = [
    ['Score', grade.maxObjective > 0 ? `${fmtScore(grade.obtained)}/${fmtScore(grade.maxObjective)}` : '—'],
    ['Correct', String(grade.correctCount)],
    ['Wrong', String(grade.wrongCount)],
    ['Unanswered', String(grade.unansweredObjective)],
  ];
  const boxW = (pageWidth - marginX * 2 - 3 * 10) / 4;
  const boxH = 46;
  stats.forEach(([label, value], i) => {
    const x = marginX + i * (boxW + 10);
    doc.setDrawColor(220, 213, 194);
    doc.setLineWidth(1);
    doc.roundedRect(x, y, boxW, boxH, 4, 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...inkSoft);
    doc.text(label.toUpperCase(), x + boxW / 2, y + 17, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...ink);
    doc.text(value, x + boxW / 2, y + 35, { align: 'center' });
  });

  y += boxH + 16;

  if (grade.needsReview.length > 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...brass);
    doc.text(
      `${grade.needsReview.length} short/descriptive answer${grade.needsReview.length === 1 ? '' : 's'} need manual review — not included in the score above.`,
      marginX, y
    );
    y += 14;
  }

  // Per-question breakdown table
  const rows = state.flatQuestions.map((q, idx) => {
    const ans = state.answers[q.id];
    const hasCorrectAnswer = q.type === 'msq' ? Array.isArray(q.correctAnswer) && q.correctAnswer.length > 0 : !!q.correctAnswer;
    const gradable = (q.type === 'mcq' || q.type === 'msq' || q.type === 'numeric' || q.type === 'short') && hasCorrectAnswer;
    const answered = hasRealAnswer(q, ans);
    const correct = gradable && answered && answerIsCorrect(q, ans);
    const ansDisplay = Array.isArray(ans) ? ans.join(', ') : (ans ?? '');
    const correctDisplay = Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : (q.correctAnswer ?? '');
    const isSkippedAlternative = q.orGroup && !((state.answerOrder && state.answerOrder[q.orGroup]) || []).includes(q.id);
    const verdict = isSkippedAlternative ? 'Not required (OR)' : (!answered ? 'Not answered' : (gradable ? (correct ? 'Correct' : 'Wrong') : 'Ungraded'));
    return [
      String(idx + 1),
      q.sectionName || '',
      isSkippedAlternative ? '—' : (answered ? (ansDisplay || '—') : '—'),
      gradable ? (correctDisplay || '—') : '—',
      verdict,
      fmtClock(state.timeSpent[q.id] || 0),
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [['#', 'Section', 'Your answer', 'Correct answer', 'Result', 'Time']],
    body: rows,
    styles: { font: 'helvetica', fontSize: 8.5, textColor: ink, cellPadding: 5, overflow: 'linebreak' },
    headStyles: { fillColor: ink, textColor: [251, 248, 241], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [242, 237, 225] },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 70 },
      4: { cellWidth: 62 },
      5: { cellWidth: 42 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const v = data.cell.raw;
        if (v === 'Correct') data.cell.styles.textColor = [47, 111, 78];
        else if (v === 'Wrong') data.cell.styles.textColor = [178, 58, 46];
        else data.cell.styles.textColor = [91, 100, 136];
      }
    },
  });

  const safeTitle = (state.paper.title || 'mock-test').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  doc.save(`${safeTitle}-report.pdf`);
}

function ResultsScreen({ state, onRestart }) {
  const grade = useMemo(() => gradeTest(state), [state]);
  const [filter, setFilter] = useState('all');
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generateResultsPdf(state, grade);
    } catch (e) {
      console.error('Failed to generate report PDF:', e);
      window.alert("Sorry, the report couldn't be generated. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const filtered = state.flatQuestions.filter((q, idx) => {
    if (filter === 'all') return true;
    const st = state.status[q.id];
    if (filter === 'answered') return st === 'answered' || st === 'answered-marked';
    if (filter === 'unanswered') return !st || st === 'not-answered' || st === 'marked';
    if (filter === 'marked') return st === 'marked' || st === 'answered-marked';
    return true;
  });

  const chartData = grade.perQuestion.map(p => ({ name: `${p.index}`, seconds: p.time, verdict: p.verdict }));
  const verdictColor = { correct: 'var(--answered)', wrong: 'var(--alert)', unanswered: 'var(--ink-faint)', ungraded: 'var(--brass)', 'not-required': 'var(--rule)' };

  const timeUsed = Math.max(0, state.config.totalMinutes * 60 - state.overallRemaining);

  return (
    <div className="mt-viewport-fixed">
      <div className="flex-1 overflow-y-auto mt-scrollbar p-6 md:p-10 flex justify-center">
      <div className="w-full max-w-3xl mt-fade-in pb-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="mt-seal"><BarChart3 size={18} /></div>
          <div>
            <div className="mt-serif text-2xl font-semibold leading-tight">{state.paper.title} — Results</div>
            <div className="text-sm" style={{ color: 'var(--ink-soft)' }}>Completed in {fmtClock(timeUsed)}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Score" value={grade.maxObjective > 0 ? `${fmtScore(grade.obtained)}/${fmtScore(grade.maxObjective)}` : '—'} />
          <StatCard label="Correct" value={grade.correctCount} color="var(--answered)" />
          <StatCard label="Wrong" value={grade.wrongCount} color="var(--alert)" />
          <StatCard label="Unanswered" value={grade.unansweredObjective} color="var(--ink-faint)" />
        </div>

        {grade.needsReview.length > 0 && (
          <div className="text-xs mb-6 p-3 rounded flex items-start gap-2" style={{ background: 'var(--brass-soft)', color: 'var(--ink)' }}>
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--brass)' }} />
            <span>{grade.needsReview.length} short/descriptive answer{grade.needsReview.length === 1 ? '' : 's'} need manual review — they aren't included in the score above.</span>
          </div>
        )}

        <div className="mt-card p-5 mb-6">
          <div className="mt-label mb-3">Time spent per question</div>
          <Suspense fallback={<div style={{ width: '100%', height: 200 }} className="flex items-center justify-center text-xs" >
            <span style={{ color: 'var(--ink-faint)' }}>Loading chart…</span>
          </div>}>
            <ResultsChart chartData={chartData} verdictColor={verdictColor} />
          </Suspense>
        </div>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {['all', 'answered', 'unanswered', 'marked'].map(f => (
            <button key={f} className="mt-btn" style={filter === f ? { background: 'var(--ink)', color: 'var(--paper)' } : { background: 'transparent', color: 'var(--ink-soft)', border: '1px solid var(--rule)' }} onClick={() => setFilter(f)}>
              {f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((q) => {
            const idx = state.flatQuestions.findIndex(fq => fq.id === q.id);
            const ans = state.answers[q.id];
            const hasCorrectAnswer = q.type === 'msq' ? Array.isArray(q.correctAnswer) && q.correctAnswer.length > 0 : !!q.correctAnswer;
            const gradable = (q.type === 'mcq' || q.type === 'msq' || q.type === 'numeric' || q.type === 'short') && hasCorrectAnswer;
            const answered = hasRealAnswer(q, ans);
            const correct = gradable && answered && answerIsCorrect(q, ans);
            const ansDisplay = Array.isArray(ans) ? ans.join(', ') : ans;
            const correctDisplay = Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer;
            const isSkippedAlternative = q.orGroup && !((state.answerOrder && state.answerOrder[q.orGroup]) || []).includes(q.id);
            return (
              <div key={q.id} className="mt-card p-4" style={isSkippedAlternative ? { opacity: 0.7 } : undefined}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="text-sm mt-serif" style={{ minWidth: 0 }}>
                    <span className="mt-mono text-xs mr-1.5" style={{ color: 'var(--ink-faint)' }}>Q{idx + 1}.</span>
                    {q.orGroup && <Link2 size={12} className="inline mb-0.5 mr-1" style={{ color: 'var(--brass)' }} />}
                    <FigureText text={q.text} figures={state.figures} />
                  </div>
                  <span className="text-xs mt-mono flex-shrink-0" style={{ color: 'var(--ink-faint)' }}>{fmtClock(state.timeSpent[q.id] || 0)}</span>
                </div>
                {isSkippedAlternative ? (
                  <div className="text-xs" style={{ color: 'var(--ink-faint)' }}>
                    Not required — you answered an alternative from this OR group instead.
                  </div>
                ) : (
                  <>
                    <div className="text-xs mb-1" style={{ color: 'var(--ink-soft)' }}>
                      Your answer: <span style={{ color: answered ? (gradable ? (correct ? 'var(--answered)' : 'var(--alert)') : 'var(--ink)') : 'var(--ink-faint)' }}>
                        {ansDisplay ? <FigureText text={typeof ansDisplay === 'string' ? ansDisplay : String(ansDisplay)} figures={state.figures} /> : 'Not answered'}
                      </span>
                    </div>
                    {q.correctAnswer && (
                      <div className="text-xs" style={{ color: 'var(--ink-soft)' }}>
                        {q.type === 'descriptive' ? 'Reference answer' : 'Correct answer'}: <span style={{ color: 'var(--answered)' }}>
                          <FigureText text={typeof correctDisplay === 'string' ? correctDisplay : String(correctDisplay)} figures={state.figures} />
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      </div>

      <div className="flex-shrink-0 border-t mt-hairline p-3 md:p-4 flex flex-wrap items-center justify-center gap-2" style={{ background: 'var(--paper)' }}>
        <button className="mt-btn mt-btn-ghost" onClick={handleDownload} disabled={downloading}>
          {downloading ? <Loader2 size={15} className="mt-pulse" /> : <FileDown size={15} />}
          {downloading ? 'Preparing report…' : 'Download report'}
        </button>
        <button className="mt-btn mt-btn-brass" onClick={onRestart}><RotateCcw size={15} /> Start another mock test</button>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="mt-card p-4 text-center">
      <div className="mt-label mb-1">{label}</div>
      <div className="mt-mono text-2xl font-semibold" style={{ color: color || 'var(--ink)' }}>{value}</div>
    </div>
  );
}

/* ============================================================
   ROOT APP — exported as MockTestApp
   ============================================================ */
export default function MockTestApp() {
  const savedProgressRef = useRef(loadTestProgress());
  const hasResumable = !!(savedProgressRef.current && savedProgressRef.current.state && !savedProgressRef.current.state.finished && savedProgressRef.current.paper && savedProgressRef.current.config);

  const [stage, setStage] = useState(hasResumable ? 'test' : 'upload');
  const [paper, setPaper] = useState(hasResumable ? savedProgressRef.current.paper : null);
  const [config, setConfig] = useState(hasResumable ? savedProgressRef.current.config : null);
  const [finalState, setFinalState] = useState(null);
  // Tracks UploadScreen's own idle/working/solving/error status so we can
  // tell "sitting on the empty drop-zone" apart from "actively fetching/
  // reading a paper" — both happen while stage === 'upload'.
  const [uploadStatus, setUploadStatus] = useState('idle');

  const reset = () => { clearTestProgress(); setStage('upload'); setPaper(null); setConfig(null); setFinalState(null); };

  // Full site chrome (nav links + footer) only on the idle upload screen —
  // the same treatment as Home/Contact/Privacy. Everything else in the
  // exam flow (fetching/reading, review, configure, test, results) gets
  // just the bare logo header and no footer, so it stays distraction-free.
  const showChrome = stage === 'upload' && (uploadStatus === 'idle' || uploadStatus === 'error');

  return (
    <div className="mt-app-shell">
      <SiteHeader showInstall={showChrome} showNav={showChrome} />
      <main className="mt-stage-area">
        {stage === 'upload' && (
          <UploadScreen onExtracted={(p) => { setPaper(p); setStage('review'); }} onStatusChange={setUploadStatus} />
        )}
        {stage === 'review' && paper && (
          <ReviewScreen paper={paper} setPaper={setPaper} onBack={() => setStage('upload')} onContinue={() => setStage('configure')} />
        )}
        {stage === 'configure' && paper && (
          <ConfigureScreen paper={paper} onBack={() => setStage('review')} onStart={(cfg) => { setConfig(cfg); setStage('test'); }} />
        )}
        {stage === 'test' && paper && config && (
          <TestScreen paper={paper} config={config} onFinish={(st) => { setFinalState(st); setStage('results'); }} />
        )}
        {stage === 'results' && finalState && (
          <ResultsScreen state={finalState} onRestart={reset} />
        )}
      </main>
      {showChrome && <SiteFooter />}
    </div>
  );
}