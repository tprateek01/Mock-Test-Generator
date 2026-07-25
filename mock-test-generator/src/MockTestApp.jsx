import React, { useState, useEffect, useRef, useReducer, useMemo } from 'react';
import mammoth from 'mammoth';
import {
  Upload, FileText, ClipboardPaste, Clock, Flag,
  ChevronLeft, ChevronRight, AlertTriangle, X, Plus, Trash2, Pencil,
  Play, RotateCcw, Loader2, ListChecks, Timer,
  BarChart3, Layers, ArrowRight, Check, Calculator, Delete
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

/* ============================================================
   GLOBAL STYLE — "Hall Ticket" design language
   Paper ivory background, exam-ink navy, brass seal accent,
   mono digits for the clock, serif for headers.
   ============================================================ */
function GlobalStyles() {
  return (
    <style>{`
      /* Fonts are preloaded in public/index.html's <head> instead of via @import
         here — an @import inside a JS-injected <style> tag can't start
         downloading until the whole JS bundle has loaded/parsed/executed,
         which was blocking first paint and hurting mobile Performance. */

      .mt-root {
        --paper: #FBF8F1;
        --paper-dim: #F2EDE1;
        --ink: #1C2541;
        --ink-soft: #4C567A;
        --ink-faint: #8A93AE;
        --rule: #DCD5C2;
        --brass: #A9822F;
        --brass-soft: #E8DCB8;
        --alert: #B23A2E;
        --alert-soft: #F4DEDA;
        --answered: #2F6F4E;
        --answered-soft: #DCEBE1;
        --review: #6E4C9E;
        --review-soft: #E7DEF3;
        background: var(--paper);
        color: var(--ink);
        font-family: 'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif;
        min-height: 100%;
        width: 100%;
      }
      .mt-serif { font-family: 'Source Serif 4', Georgia, serif; }
      .mt-mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-variant-numeric: tabular-nums; }

      .mt-card {
        background: #fff;
        border: 1px solid var(--rule);
        border-radius: 3px;
        box-shadow: 0 1px 0 rgba(28,37,65,0.03);
      }
      .mt-hairline { border-color: var(--rule); }

      .mt-btn {
        font-family: 'IBM Plex Sans', sans-serif;
        font-weight: 600;
        font-size: 0.875rem;
        border-radius: 3px;
        padding: 0.6rem 1.1rem;
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        transition: filter 0.12s ease, transform 0.05s ease;
        cursor: pointer;
        border: 1px solid transparent;
      }
      .mt-btn:active { transform: translateY(1px); }
      .mt-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      .mt-btn-primary { background: var(--ink); color: var(--paper); }
      .mt-btn-primary:hover:not(:disabled) { filter: brightness(1.15); }
      .mt-btn-brass { background: var(--brass); color: #fff; }
      .mt-btn-brass:hover:not(:disabled) { filter: brightness(1.08); }
      .mt-btn-ghost { background: transparent; color: var(--ink); border-color: var(--rule); }
      .mt-btn-ghost:hover:not(:disabled) { background: var(--paper-dim); }
      .mt-btn-danger { background: transparent; color: var(--alert); border-color: var(--alert-soft); }
      .mt-btn-danger:hover:not(:disabled) { background: var(--alert-soft); }
      .mt-btn-review { background: var(--review); color: #fff; }
      .mt-btn-review:hover:not(:disabled) { filter: brightness(1.1); }

      .mt-input, .mt-textarea, .mt-select {
        font-family: 'IBM Plex Sans', sans-serif;
        background: #fff;
        border: 1px solid var(--rule);
        border-radius: 3px;
        padding: 0.55rem 0.7rem;
        font-size: 0.9rem;
        color: var(--ink);
        width: 100%;
      }
      .mt-input:focus, .mt-textarea:focus, .mt-select:focus {
        outline: 2px solid var(--brass);
        outline-offset: 1px;
        border-color: var(--brass);
      }

      .mt-label {
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--ink-soft);
        font-weight: 600;
      }

      .mt-seal {
        width: 2.6rem; height: 2.6rem;
        border-radius: 999px;
        border: 1.5px solid var(--brass);
        display: flex; align-items: center; justify-content: center;
        color: var(--brass);
        position: relative;
        flex-shrink: 0;
      }
      .mt-seal::after {
        content: '';
        position: absolute; inset: 3px;
        border-radius: 999px;
        border: 1px dashed var(--brass);
        opacity: 0.5;
      }

      /* OMR-style bubble palette buttons */
      .mt-bubble {
        width: 2.5rem; height: 2.5rem;
        border-radius: 999px;
        display: flex; align-items: center; justify-content: center;
        font-family: 'IBM Plex Mono', monospace;
        font-weight: 600;
        font-size: 0.85rem;
        border: 1.5px solid var(--rule);
        color: var(--ink-soft);
        background: #fff;
        cursor: pointer;
        transition: transform 0.08s ease;
        position: relative;
      }
      .mt-bubble:hover { transform: scale(1.06); }
      .mt-bubble.current { outline: 2px solid var(--ink); outline-offset: 2px; }
      .mt-bubble.not-visited { background: #fff; border-color: var(--rule); color: var(--ink-faint); }
      .mt-bubble.not-answered { background: var(--alert-soft); border-color: var(--alert); color: var(--alert); }
      .mt-bubble.answered { background: var(--answered); border-color: var(--answered); color: #fff; }
      .mt-bubble.marked { background: var(--review); border-color: var(--review); color: #fff; }
      .mt-bubble.answered-marked { background: var(--review); border-color: var(--review); color: #fff; }
      .mt-bubble.answered-marked::after {
        content: '';
        position: absolute; bottom: 2px; right: 2px;
        width: 7px; height: 7px; border-radius: 999px;
        background: var(--answered);
        border: 1.5px solid #fff;
      }
      .mt-bubble.locked { opacity: 0.35; cursor: not-allowed; }

      .mt-flip {
        font-family: 'IBM Plex Mono', monospace;
        font-weight: 700;
        letter-spacing: 0.02em;
        font-variant-numeric: tabular-nums;
      }

      @keyframes mt-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
      .mt-pulse { animation: mt-pulse 1s ease-in-out infinite; }

      .mt-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
      .mt-scrollbar::-webkit-scrollbar-thumb { background: var(--rule); border-radius: 999px; }
      .mt-scrollbar::-webkit-scrollbar-track { background: transparent; }

      .mt-fade-in { animation: mt-fade-in 0.25s ease both; }
      @keyframes mt-fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

      .mt-radio {
        width: 1.1rem; height: 1.1rem;
        border-radius: 999px;
        border: 1.5px solid var(--rule);
        flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
      }
      .mt-radio.checked { border-color: var(--ink); }
      .mt-radio.checked::after {
        content: ''; width: 0.55rem; height: 0.55rem; border-radius: 999px; background: var(--ink);
      }

      .mt-option-row {
        border: 1px solid var(--rule);
        border-radius: 3px;
        padding: 0.65rem 0.8rem;
        display: flex; align-items: flex-start; gap: 0.7rem;
        cursor: pointer;
        transition: border-color 0.1s ease, background 0.1s ease;
      }
      .mt-option-row:hover { border-color: var(--ink-faint); }
      .mt-option-row.selected { border-color: var(--ink); background: var(--paper-dim); }

      /* Locks a screen to the height of its container (the app shell's
         content area, below the site header) so header/footer stay put
         and only the inner content region scrolls. */
      .mt-viewport-fixed {
        height: 100%;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      /* Top-level app shell: site header + scrollable/fixed stage area */
      .mt-app-shell {
        height: 100vh;
        height: 100dvh;
        display: flex;
        flex-direction: column;
      }
      .mt-site-header {
        flex-shrink: 0;
        height: 4.75rem;
        display: flex;
        align-items: center;
        gap: 0.9rem;
        padding: 0 1.25rem;
        background: var(--paper);
        border-bottom: 1px solid var(--rule);
      }
      .mt-site-header img {
        height: 3.6rem;
        width: 3.6rem;
        object-fit: cover;
        border-radius: 50%;
        flex-shrink: 0;
        border: 2px solid var(--brass);
        box-shadow: 0 2px 6px rgba(28,37,65,0.15);
      }
      .mt-brand-name {
        font-family: 'Pacifico', cursive;
        font-weight: 400;
        font-size: 2rem;
        line-height: 1.4;
        padding-bottom: 0.15em;
        overflow: visible;
        background: linear-gradient(90deg, var(--ink) 0%, var(--brass) 100%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        display: inline-block;
      }
      .mt-brand-tag {
        font-family: 'IBM Plex Sans', sans-serif;
        font-size: 0.68rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--ink-soft);
        font-weight: 600;
        margin-top: 0.1rem;
      }
      .mt-stage-area {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
      }

      /* Virtual calculator — header launcher + dropdown popover, available
         during the test only when the candidate opted in beforehand. Sits
         inline in the header, just before the time-left clock. */
      .mt-calc-wrap {
        position: relative;
        display: flex;
        align-items: center;
        flex-shrink: 0;
      }
      .mt-calc-fab {
        position: static;
        width: 2.3rem;
        height: 2.3rem;
        border-radius: 999px;
        background: var(--ink);
        color: var(--paper);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(28,37,65,0.25);
        border: none;
        cursor: pointer;
        z-index: 60;
        transition: transform 0.12s ease, filter 0.12s ease;
      }
      .mt-calc-fab:hover { filter: brightness(1.2); }
      .mt-calc-fab:active { transform: scale(0.94); }
      .mt-calc-fab.open { background: var(--brass); }
      .mt-calc-fab:disabled { opacity: 0.45; cursor: not-allowed; }

      .mt-calc-panel {
        position: absolute;
        top: calc(100% + 0.6rem);
        right: 0;
        width: 292px;
        max-width: calc(100vw - 2rem);
        background: #fff;
        border: 1px solid var(--rule);
        border-radius: 8px;
        box-shadow: 0 14px 34px rgba(28,37,65,0.28);
        z-index: 60;
        overflow: hidden;
      }
      .mt-calc-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.6rem 0.8rem;
        background: var(--paper-dim);
        border-bottom: 1px solid var(--rule);
      }
      .mt-calc-title {
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 600;
        color: var(--ink-soft);
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }
      .mt-calc-close {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--ink-soft);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.15rem;
      }
      .mt-calc-close:hover { color: var(--alert); }
      .mt-calc-display {
        margin: 0.7rem 0.8rem 0.2rem;
        background: var(--paper);
        border: 1px solid var(--rule);
        border-radius: 6px;
        padding: 0.6rem 0.7rem;
        text-align: right;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 1.35rem;
        font-weight: 600;
        color: var(--ink);
        overflow-x: auto;
        white-space: nowrap;
      }
      .mt-calc-body { padding: 0.7rem 0.8rem 0.85rem; }
      .mt-calc-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.4rem;
        margin-bottom: 0.4rem;
      }
      .mt-calc-row:last-child { margin-bottom: 0; }
      .mt-calc-btn {
        border: 1px solid var(--rule);
        border-radius: 6px;
        background: #fff;
        color: var(--ink);
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.95rem;
        font-weight: 600;
        height: 2.3rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.06s ease, filter 0.1s ease;
      }
      .mt-calc-btn:hover { filter: brightness(0.97); background: var(--paper-dim); }
      .mt-calc-btn:active { transform: translateY(1px); }
      .mt-calc-btn.op { color: var(--brass); border-color: var(--brass-soft); background: var(--brass-soft); }
      .mt-calc-btn.op:hover { filter: brightness(1.05); }
      .mt-calc-btn.clear { color: var(--alert); }
      .mt-calc-btn.equals { background: var(--ink); color: var(--paper); border-color: var(--ink); grid-column: span 2; }
      .mt-calc-btn.equals:hover { filter: brightness(1.2); }
      .mt-calc-btn.zero { grid-column: span 2; }
      .mt-calc-btn.fn {
        font-size: 0.68rem;
        font-weight: 600;
        color: var(--ink-soft);
        background: var(--paper-dim);
        letter-spacing: 0.01em;
      }
      .mt-calc-btn.fn:hover { color: var(--ink); filter: brightness(0.97); }
      .mt-calc-divider {
        height: 1px;
        background: var(--rule);
        margin: 0 0 0.5rem;
      }

      @media (max-width: 480px) {
        .mt-btn { padding: 0.55rem 0.7rem; font-size: 0.8rem; gap: 0.3rem; }
        .mt-bubble { width: 2.1rem; height: 2.1rem; font-size: 0.75rem; }
        .mt-site-header { height: 4.4rem; padding: 0 0.85rem; gap: 0.6rem; }
        .mt-site-header img { height: 2.8rem; width: 2.8rem; }
        .mt-brand-name { font-size: 1.55rem; }
        .mt-calc-fab { width: 2.1rem; height: 2.1rem; }
        .mt-calc-panel { right: -0.85rem; width: 250px; }
        .mt-calc-btn.fn { font-size: 0.6rem; }
      }
    `}</style>
  );
}

/* ============================================================
   HELPERS
   ============================================================ */
let _id = 0;
const uid = (p = 'x') => `${p}_${Date.now().toString(36)}_${(_id++).toString(36)}`;

// negativeMarking on config is an object keyed by question type, e.g. { mcq: 0.33, msq: 0, numeric: 0, short: 0 }.
// Falls back gracefully if it's ever just a plain number (older config shape).
function getNegativeMarking(config, type) {
  const nm = config && config.negativeMarking;
  if (nm == null) return 0;
  if (typeof nm === 'number') return nm;
  return nm[type] || 0;
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

// In dev, this stays empty and requests go through setupProxy.js to localhost:3001.
// In production, set REACT_APP_API_BASE to your deployed backend's URL (see deployment notes).
const API_BASE = process.env.REACT_APP_API_BASE || '';

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
{"title":"string","totalQuestionsInSource":number|null,"sections":[{"name":"string","questions":[{"type":"mcq|msq|numeric|short|descriptive","text":"string","options":["string"]|null,"marks":number,"correctAnswer":"string"|["string"]|null}]}],"complete":boolean}

Rules:
- "mcq" = multiple choice, exactly ONE correct option. "msq" = multiple SELECT, TWO OR MORE correct options (common in GATE-style papers, often marked "one or more options may be correct"). "numeric" = requires a numeric answer, no options. "short" = brief word/phrase/one-line answer. "descriptive" = long-form written answer.
- options: array of option text WITHOUT letter/number labels (e.g. "Paris", not "A) Paris"). Only for mcq/msq, else null.
- marks: marks stated in the source if present, else default to 1.
- correctAnswer: fill in ONLY if an answer key is clearly present in the source. For mcq, give the exact option text as a single string. For msq, give an ARRAY of the exact option text(s) marked correct (even if only one is marked in the source, still use an array for msq). Never invent an answer — use null if unsure.
- Group questions under their section headings exactly as they appear (e.g. "Section A", "Physics", "Part I"). If there are no explicit sections, use one section named "Section 1".
- Preserve original question order.
- totalQuestionsInSource: on your FIRST response only, scan the whole source (page numbers, question numbering, "Q1..Q100" style headers, table of contents, etc.) and give your best-effort count of the TOTAL number of questions the source actually contains, even though you will only extract a partial batch in this response. This is a sanity check used to make sure nothing gets missed later — take it seriously and base it on real evidence in the document (highest question number visible, explicit counts stated, etc.), not a guess. On later continuation responses, repeat the same number (or refine it if you now have better evidence), or null if truly unknowable.
- Your response has a strict output-length budget. Include as many COMPLETE questions as fit — never cut a question, an option list, or a passage in half. If you reach the budget before finishing the source, stop right after the last fully-written question and set "complete": false. If you have covered the entire source, set "complete": true.
- When told to continue, resume immediately after the last question you already sent. Never repeat a question.

PASSAGE / COMPREHENSION SETS — read carefully, this is a common failure point:
- When several questions share one reading passage, case study, data table, or other common stimulus text, embed the passage's FULL text — complete and verbatim, never summarized, paraphrased, or shortened — inside the "text" field of the FIRST question in that set, before the question itself (e.g. "Passage: <entire passage text>\\n\\nQuestion: <the actual question>").
- For every OTHER question in that same set, do NOT repeat the passage again — its "text" field should contain only that individual question (you may add a short lead-in like "Based on the passage above,").
- Never start emitting a passage-based question unless you are confident your remaining output budget can fit the ENTIRE passage plus that first question. If you are not sure it will fit, stop BEFORE starting that question (set "complete": false) rather than emitting a half-written passage — a truncated passage is worse than a delayed one.
- When continuing after a stop like that, re-emit the FULL passage from the beginning (since it was never sent), never a fragment.

Real-world source documents are messy. Handle all of the following without asking for clarification:
- IGNORE entire pages or blocks that are advertisements, app-download banners, subscription/promo pages, watermarks, logos, or website chrome (e.g. "Download the app", "Get it on Google Play", pricing/subscription tables). These never contain real questions — skip them entirely and continue to the next real question.
- IGNORE repeating diagonal or tiled watermark text overlaid on the page (e.g. a brand name repeated across the page). It is not question content.
- If the source is an ANSWER KEY / already-attempted paper where the correct option is marked visually (e.g. a green checkmark/tick, a colored highlight, or bold/colored text) and an incorrect or "selected" option is marked differently (e.g. a red cross), read the VISUAL marking to identify correctAnswer as the option marked correct — do not confuse "the option the candidate chose" with "the correct option" if the source distinguishes them (e.g. a note like "chosen option" vs "correct option"); only extract the CORRECT one into correctAnswer.
- IGNORE stray numbers or codes that appear detached from question text with no clear label (e.g. a bare number floating next to or inside a question that isn't part of the question's wording, options, or marks) — these are usually leftover layout artifacts (like a candidate's response-id marker) from the original source and must not be included in the question text or treated as an option.
- If a question references an image, diagram, table, or figure that is essential to answering it (e.g. a Venn diagram, graph, or geometric figure) and the figure's content cannot be captured in text, still extract the question text as-is and set correctAnswer from any visible answer key; do not fabricate a description of the figure.
- Multi-page PDFs: question numbering continues across pages/sections seamlessly — do not restart numbering or duplicate a question that spans a page break.`;

async function extractQuestions(sourceParts, onProgress) {
  let contents = [{
    role: 'user',
    parts: [...sourceParts, { text: 'Extract all questions from this exam paper into the JSON schema described in the system instructions. Begin with the first question.' }]
  }];
  const sections = [];
  let iterations = 0;
  let title = 'Mock Test';
  let expectedTotal = null;
  let reconcileRounds = 0;
  let staleStreak = 0;

  const MAX_ITERATIONS = 60;
  const MAX_RECONCILE_ROUNDS = 6;
  // Large per-call output budget: the old 1000-token cap was the root cause of
  // both missed questions and mid-passage cutoffs — it forced the model to stop
  // after just a few questions (or partway through a long passage) every time.
  const MAX_OUTPUT_TOKENS = 8192;

  const totalSoFar = () => sections.reduce((n, s) => n + s.questions.length, 0);

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    const raw = await callGemini(contents, EXTRACTION_SYSTEM, MAX_OUTPUT_TOKENS);
    let parsed;
    try {
      parsed = parseJsonLoose(raw);
    } catch (e) {
      contents = [...contents, { role: 'model', parts: [{ text: raw }] }, { role: 'user', parts: [{ text: 'That was not valid JSON (possibly cut off). Resend ONLY valid, complete, minified JSON matching the schema — a smaller batch of questions if needed so the response fits, but every question in it must be complete, including any passage text in full.' }] }];
      continue;
    }

    if (parsed.title) title = parsed.title;
    if (expectedTotal === null && typeof parsed.totalQuestionsInSource === 'number' && parsed.totalQuestionsInSource > 0) {
      expectedTotal = parsed.totalQuestionsInSource;
    }

    const beforeCount = totalSoFar();
    (parsed.sections || []).forEach(sec => {
      let existing = sections.find(s => s.name === sec.name);
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
        existing.questions.push({
          id: uid('q'),
          type,
          text: q.text || '',
          options: (type === 'mcq' || type === 'msq') && Array.isArray(q.options) ? q.options : null,
          marks: typeof q.marks === 'number' && q.marks > 0 ? q.marks : 1,
          correctAnswer
        });
      });
    });
    const afterCount = totalSoFar();
    onProgress && onProgress(afterCount);

    const madeProgress = afterCount > beforeCount;
    staleStreak = madeProgress ? 0 : staleStreak + 1;
    // Two responses in a row with zero new questions means the model is stuck —
    // stop rather than burn through all remaining iterations for nothing.
    if (staleStreak >= 2) break;

    if (!parsed.complete) {
      contents = [...contents, { role: 'model', parts: [{ text: raw }] }, { role: 'user', parts: [{ text: `You have extracted ${afterCount} question(s) so far${expectedTotal ? ` out of an estimated ${expectedTotal}` : ''}. Continue extracting the NEXT batch from exactly where you left off, same JSON schema. Never repeat a question already extracted. If a question shares a passage you already sent in full in a previous response, do not resend that passage text — just continue with the question.` }] }];
      continue;
    }

    // The model says it's finished — but before trusting that, check it against
    // its own earlier estimate of the total. This is what catches "90 out of 100"
    // style undercounts instead of silently accepting an incomplete extraction.
    if (expectedTotal && afterCount < expectedTotal && reconcileRounds < MAX_RECONCILE_ROUNDS) {
      reconcileRounds++;
      contents = [...contents, { role: 'model', parts: [{ text: raw }] }, { role: 'user', parts: [{ text: `You estimated earlier that this source has about ${expectedTotal} questions, but you have only extracted ${afterCount} so far. Carefully re-scan the ENTIRE source end to end, including any pages, sections, or passage-based question sets you may have skipped, and extract every remaining question you find, same JSON schema. Never repeat a question already extracted. If after a careful re-check there truly are no more questions, set "complete": true again.` }] }];
      continue;
    }

    break;
  }
  return { title, sections };
}

/* ============================================================
   SCREEN 1 — UPLOAD
   ============================================================ */
function UploadScreen({ onExtracted }) {
  const [mode, setMode] = useState('file'); // 'file' | 'paste'
  const [pastedText, setPastedText] = useState('');
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | working | error
  const [progressCount, setProgressCount] = useState(0);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

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
    try {
      let sourceParts;
      if (mode === 'paste') {
        if (!pastedText.trim()) throw new Error('Paste some question text first.');
        sourceParts = [{ text: pastedText }];
      } else {
        if (!file) throw new Error('Choose a file first.');
        const name = file.name.toLowerCase();
        if (name.endsWith('.docx') || name.endsWith('.doc')) {
          const buf = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer: buf });
          sourceParts = [{ text: result.value }];
        } else if (name.endsWith('.pdf')) {
          const b64 = await fileToBase64(file);
          sourceParts = [{ inlineData: { mimeType: 'application/pdf', data: b64 } }];
        } else if (name.endsWith('.txt')) {
          const text = await file.text();
          sourceParts = [{ text }];
        } else {
          const b64 = await fileToBase64(file);
          const mediaType = file.type || 'image/png';
          sourceParts = [{ inlineData: { mimeType: mediaType, data: b64 } }];
        }
      }
      const paper = await extractQuestions(sourceParts, (n) => setProgressCount(n));
      if (!paper.sections.length || !paper.sections.some(s => s.questions.length)) {
        throw new Error('No questions could be found in that source. Try another file, or start blank and add questions manually.');
      }
      onExtracted(paper);
    } catch (e) {
      setError(e.message || 'Something went wrong while reading that paper.');
      setStatus('error');
    }
  };

  if (status === 'working') {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="mt-card mt-fade-in p-10 max-w-md w-full text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" style={{ color: 'var(--brass)' }} />
          <div className="mt-serif text-lg font-semibold mb-1">Reading the paper…</div>
          <div className="text-sm" style={{ color: 'var(--ink-soft)' }}>
            {progressCount > 0 ? `${progressCount} question${progressCount === 1 ? '' : 's'} extracted so far` : 'Scanning for questions and sections'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-6 md:p-10 flex justify-center">
      <div className="w-full max-w-2xl mt-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <div className="mt-seal"><ListChecks size={18} /></div>
          <div>
            <div className="mt-serif text-2xl font-semibold leading-tight">Mock Test Hall</div>
            <div className="text-sm" style={{ color: 'var(--ink-soft)' }}>Turn any paper into a timed, proctored mock test</div>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button className="mt-btn" style={mode === 'file' ? { background: 'var(--ink)', color: 'var(--paper)' } : { background: 'transparent', color: 'var(--ink-soft)', border: '1px solid var(--rule)' }} onClick={() => setMode('file')}>
            <Upload size={15} /> Upload file
          </button>
          <button className="mt-btn" style={mode === 'paste' ? { background: 'var(--ink)', color: 'var(--paper)' } : { background: 'transparent', color: 'var(--ink-soft)', border: '1px solid var(--rule)' }} onClick={() => setMode('paste')}>
            <ClipboardPaste size={15} /> Paste text
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
                <div className="text-xs" style={{ color: 'var(--ink-faint)' }}>{(file.size / 1024).toFixed(0)} KB — click to replace</div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload size={28} style={{ color: 'var(--ink-faint)' }} />
                <div className="font-medium text-sm">Drop a paper here, or click to browse</div>
                <div className="text-xs" style={{ color: 'var(--ink-faint)' }}>PDF, Word (.docx), image, or plain text</div>
              </div>
            )}
          </div>
        ) : (
          <textarea
            className="mt-textarea mt-scrollbar"
            rows={10}
            placeholder="Paste the question paper text here…"
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
          />
        )}

        {error && (
          <div className="mt-3 flex items-start gap-2 text-sm p-3 rounded" style={{ background: 'var(--alert-soft)', color: 'var(--alert)' }}>
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-6">
          <button className="mt-btn mt-btn-ghost" onClick={startBlank}>
            <Pencil size={15} /> Start blank instead
          </button>
          <button className="mt-btn mt-btn-brass" onClick={run} disabled={mode === 'file' ? !file : !pastedText.trim()}>
            Extract questions <ArrowRight size={15} />
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
    const q = { id: uid('q'), type: 'mcq', text: '', options: ['', '', '', ''], marks: 1, correctAnswer: null };
    sections[sIdx] = { ...sections[sIdx], questions: [...sections[sIdx].questions, q] };
    setPaper({ ...paper, sections });
  };

  return (
    <div className="min-h-full p-6 md:p-10 flex justify-center">
      <div className="w-full max-w-3xl mt-fade-in pb-24">
        <div className="mb-6">
          <div className="mt-label mb-1">Paper title</div>
          <input className="mt-input mt-serif text-lg font-semibold" value={paper.title} onChange={(e) => updateTitle(e.target.value)} />
          <div className="text-sm mt-2" style={{ color: 'var(--ink-soft)' }}>{paper.sections.length} section{paper.sections.length === 1 ? '' : 's'} · {totalQ} question{totalQ === 1 ? '' : 's'} — check these over before you set the clock.</div>
        </div>

        <div className="space-y-6">
          {paper.sections.map((sec, sIdx) => (
            <div key={sec.id} className="mt-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <input className="mt-input mt-serif font-semibold flex-1" value={sec.name} onChange={(e) => updateSection(sIdx, { name: e.target.value })} />
                <button className="mt-btn mt-btn-danger" onClick={() => removeSection(sIdx)} title="Remove section"><Trash2 size={14} /></button>
              </div>

              <div className="space-y-4">
                {sec.questions.map((q, qIdx) => (
                  <QuestionEditRow
                    key={q.id}
                    q={q}
                    index={qIdx}
                    onChange={(patch) => updateQuestion(sIdx, qIdx, patch)}
                    onRemove={() => removeQuestion(sIdx, qIdx)}
                  />
                ))}
              </div>

              <button className="mt-btn mt-btn-ghost mt-3" onClick={() => addQuestion(sIdx)}>
                <Plus size={14} /> Add question
              </button>
            </div>
          ))}
        </div>

        <button className="mt-btn mt-btn-ghost mt-4" onClick={addSection}>
          <Plus size={14} /> Add section
        </button>

        <div className="fixed bottom-0 left-0 right-0 border-t mt-hairline p-4 flex items-center justify-between" style={{ background: 'var(--paper)' }}>
          <div className="max-w-3xl w-full mx-auto flex items-center justify-between">
            <button className="mt-btn mt-btn-ghost" onClick={onBack}><ChevronLeft size={15} /> Back</button>
            <button className="mt-btn mt-btn-brass" disabled={totalQ === 0} onClick={onContinue}>
              Set up timing <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionEditRow({ q, index, onChange, onRemove }) {
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
    <div className="border rounded p-3" style={{ borderColor: 'var(--rule)' }}>
      <div className="flex items-start gap-2 mb-2">
        <span className="mt-mono text-xs pt-2" style={{ color: 'var(--ink-faint)' }}>Q{index + 1}</span>
        <textarea className="mt-textarea flex-1" rows={2} placeholder="Question text" value={q.text} onChange={(e) => onChange({ text: e.target.value })} />
        <button className="mt-btn mt-btn-danger" onClick={onRemove} title="Remove question"><Trash2 size={13} /></button>
      </div>
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
          <input type="number" min={0} step={0.5} className="mt-input w-16" value={q.marks} onChange={(e) => onChange({ marks: parseFloat(e.target.value) || 0 })} />
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
  const [negativeMarking, setNegativeMarking] = useState(() => {
    const nm = {};
    ['mcq', 'msq', 'numeric', 'short'].forEach(t => { nm[t] = 0; });
    return nm;
  });
  const [calculatorEnabled, setCalculatorEnabled] = useState(false);

  const sectionSum = paper.sections.reduce((n, s) => n + (sectionMinutes[s.id] || 0), 0);

  return (
    <div className="min-h-full p-6 md:p-10 flex justify-center">
      <div className="w-full max-w-2xl mt-fade-in pb-24">
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
            <input type="number" min={1} className="mt-input w-28" value={totalMinutes} onChange={(e) => setTotalMinutes(parseInt(e.target.value) || 0)} />
            <span className="text-sm" style={{ color: 'var(--ink-soft)' }}>minutes — the exam auto-submits when this reaches zero</span>
          </div>
        </div>

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
                  <input type="number" min={1} className="mt-input w-20" value={sectionMinutes[s.id] || 0} onChange={(e) => setSectionMinutes({ ...sectionMinutes, [s.id]: parseInt(e.target.value) || 0 })} />
                  <span className="text-xs" style={{ color: 'var(--ink-faint)' }}>min</span>
                </div>
              ))}
              <div className="text-xs pt-1" style={{ color: sectionSum > totalMinutes ? 'var(--alert)' : 'var(--ink-faint)' }}>
                Sections total {sectionSum} min {sectionSum > totalMinutes ? '— exceeds total duration' : `of ${totalMinutes} min`}. Once a section's time runs out it locks and the test moves on.
              </div>
            </div>
          )}
        </div>

        <div className="mt-card p-5 mb-4">
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input type="checkbox" checked={useQuestionTiming} onChange={(e) => setUseQuestionTiming(e.target.checked)} />
            <span className="mt-label">Per-question time limit</span>
          </label>
          {useQuestionTiming && (
            <div className="flex items-center gap-3 pl-6">
              <input type="number" min={5} className="mt-input w-24" value={questionSeconds} onChange={(e) => setQuestionSeconds(parseInt(e.target.value) || 0)} />
              <span className="text-sm" style={{ color: 'var(--ink-soft)' }}>seconds per question — auto-advances when it hits zero</span>
            </div>
          )}
        </div>

        <div className="mt-card p-5 mb-4">
          <div className="mt-label mb-1">Negative marking</div>
          <div className="text-xs mb-3" style={{ color: 'var(--ink-soft)' }}>Marks deducted for each wrong answer — set separately per question type (0 = off).</div>
          {typesPresent.length === 0 ? (
            <div className="text-xs" style={{ color: 'var(--ink-faint)' }}>No auto-gradable question types (MCQ/MSQ/numeric/short) in this paper.</div>
          ) : (
            <div className="space-y-2">
              {typesPresent.map(t => (
                <div key={t} className="flex items-center gap-3">
                  <span className="text-sm flex-1">{QUESTION_TYPE_LABELS[t]}</span>
                  <input
                    type="number" min={0} step={0.25} className="mt-input w-24"
                    value={negativeMarking[t]}
                    onChange={(e) => setNegativeMarking({ ...negativeMarking, [t]: parseFloat(e.target.value) || 0 })}
                  />
                  <span className="text-xs" style={{ color: 'var(--ink-faint)' }}>marks off</span>
                </div>
              ))}
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

        <div className="fixed bottom-0 left-0 right-0 border-t mt-hairline p-4" style={{ background: 'var(--paper)' }}>
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

function initTestState(paper, config) {
  const flatQuestions = buildFlatQuestions(paper);
  const sectionRemaining = {};
  paper.sections.forEach(s => { sectionRemaining[s.id] = (config.sectionMinutes[s.id] || 0) * 60; });
  const status = {};
  if (flatQuestions[0]) status[flatQuestions[0].id] = 'not-answered';
  return {
    paper, config, flatQuestions,
    answers: {}, status, timeSpent: {},
    currentIndex: 0,
    overallRemaining: config.totalMinutes * 60,
    sectionRemaining,
    questionRemaining: config.useQuestionTiming ? config.questionSeconds : null,
    lockedSections: {},
    finished: false,
    startedAt: Date.now()
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
      const qid = state.flatQuestions[state.currentIndex].id;
      const cur = state.status[qid];
      const nextStatus = cur === 'marked' || cur === 'answered-marked' ? 'answered-marked' : 'answered';
      return { ...state, answers: { ...state.answers, [qid]: action.value }, status: { ...state.status, [qid]: nextStatus } };
    }
    case 'TOGGLE_MSQ_OPTION': {
      const qid = state.flatQuestions[state.currentIndex].id;
      const cur = state.status[qid];
      const existing = Array.isArray(state.answers[qid]) ? state.answers[qid] : [];
      const next = existing.includes(action.value) ? existing.filter(o => o !== action.value) : [...existing, action.value];
      const answers = { ...state.answers };
      if (next.length) answers[qid] = next; else delete answers[qid];
      const nextStatus = next.length
        ? (cur === 'marked' || cur === 'answered-marked' ? 'answered-marked' : 'answered')
        : (cur === 'answered-marked' ? 'marked' : 'not-answered');
      return { ...state, answers, status: { ...state.status, [qid]: nextStatus } };
    }
    case 'CLEAR': {
      const qid = state.flatQuestions[state.currentIndex].id;
      const cur = state.status[qid];
      const answers = { ...state.answers };
      delete answers[qid];
      const nextStatus = cur === 'answered-marked' ? 'marked' : 'not-answered';
      return { ...state, answers, status: { ...state.status, [qid]: nextStatus } };
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
      const q = state.flatQuestions[state.currentIndex];
      const overallRemaining = state.overallRemaining - 1;
      const timeSpent = { ...state.timeSpent, [q.id]: (state.timeSpent[q.id] || 0) + 1 };

      if (overallRemaining <= 0) {
        return { ...state, overallRemaining: 0, timeSpent, finished: true };
      }

      let sectionRemaining = state.sectionRemaining;
      let lockedSections = state.lockedSections;
      let currentIndex = state.currentIndex;
      let questionRemaining = state.questionRemaining;
      let status = state.status;
      let finished = false;

      if (state.config.useSectionTiming) {
        const secLeft = (state.sectionRemaining[q.sectionId] ?? 0) - 1;
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
        const qLeft = questionRemaining - 1;
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

      return { ...state, overallRemaining, timeSpent, sectionRemaining, lockedSections, currentIndex, questionRemaining, status, finished };
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

function TestScreen({ paper, config, onFinish }) {
  const [state, dispatch] = useReducer(testReducer, undefined, () => initTestState(paper, config));
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPaletteMobile, setShowPaletteMobile] = useState(false);
  const [showFsPrompt, setShowFsPrompt] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const interval = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearInterval(interval);
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
      exitFullscreen();
      onFinish(state);
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
          <div className="text-xs truncate" style={{ color: 'var(--ink-soft)' }}>{q.sectionName} · Q{state.currentIndex + 1} of {state.flatQuestions.length}</div>
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
          {state.config.calculatorEnabled && <CalculatorWidget hidden={showPaletteMobile} />}
          <div className="text-right">
            <div className="mt-label" style={{ fontSize: '0.62rem' }}>Time left</div>
            <div className={`mt-flip mt-mono text-base md:text-xl ${overallCritical ? 'mt-pulse' : ''}`} style={{ color: overallCritical ? 'var(--alert)' : 'var(--ink)' }}>
              {fmtClock(state.overallRemaining)}
            </div>
          </div>
          <button className="mt-btn mt-btn-ghost lg:hidden" onClick={() => setShowPaletteMobile(true)}><Layers size={16} /></button>
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

            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="mt-serif text-lg leading-relaxed">
                <span className="mt-mono text-sm mr-2" style={{ color: 'var(--ink-faint)' }}>Q{state.currentIndex + 1}.</span>
                {q.text}
              </div>
            </div>
            <div className="text-xs mb-5" style={{ color: 'var(--ink-faint)' }}>
              {q.marks} mark{q.marks === 1 ? '' : 's'}
              {(() => {
                const nm = getNegativeMarking(state.config, q.type);
                return nm > 0 ? ` · −${nm} if wrong` : '';
              })()}
              {q.type === 'msq' ? ' · one or more options may be correct' : ''}
            </div>

            {q.type === 'mcq' && (
              <div className="space-y-2">
                {(q.options || []).map((opt, i) => (
                  <div key={i} className={`mt-option-row ${answer === opt ? 'selected' : ''}`} onClick={() => !isLocked && dispatch({ type: 'SELECT_ANSWER', value: opt })}>
                    <div className={`mt-radio ${answer === opt ? 'checked' : ''}`} />
                    <span className="text-sm">{String.fromCharCode(65 + i)}. {opt}</span>
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
                      <span className="text-sm">{String.fromCharCode(65 + i)}. {opt}</span>
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

        {/* Palette sidebar (desktop) */}
        <div className="hidden lg:block w-72 border-l mt-hairline overflow-y-auto mt-scrollbar p-4" style={{ background: '#fff' }}>
          <PaletteContent state={state} dispatch={dispatch} counts={counts} sections={sectionsForPalette} />
        </div>
      </div>

      {/* Bottom action bar — stays fixed at the bottom of the viewport; only the
          question panel above scrolls. Labels collapse to icons on narrow screens. */}
      <div className="flex-shrink-0 border-t mt-hairline px-2.5 md:px-6 py-2.5 md:py-3 flex items-center justify-between gap-1.5 md:gap-2" style={{ background: '#fff' }}>
        <div className="flex items-center gap-1.5 md:gap-2">
          <button className="mt-btn mt-btn-ghost" onClick={() => dispatch({ type: 'PREV' })} disabled={state.currentIndex === 0}><ChevronLeft size={15} /> <span className="hidden sm:inline">Previous</span></button>
          <button className="mt-btn mt-btn-ghost" onClick={() => dispatch({ type: 'CLEAR' })} disabled={isLocked}><RotateCcw size={14} /> <span className="hidden sm:inline">Clear</span></button>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <button className="mt-btn mt-btn-review" onClick={() => { dispatch({ type: 'TOGGLE_MARK' }); dispatch({ type: 'NEXT' }); }} disabled={isLocked}><Flag size={14} /> <span className="hidden sm:inline">Mark & Next</span></button>
          <button className="mt-btn mt-btn-primary" onClick={() => dispatch({ type: 'NEXT' })}><span className="hidden sm:inline">Save & Next</span><span className="sm:hidden">Next</span> <ChevronRight size={15} /></button>
          <button className="mt-btn mt-btn-brass" onClick={() => setShowSubmitModal(true)}>Submit</button>
        </div>
      </div>

      {showPaletteMobile && (
        <div className="fixed inset-0 z-40 flex justify-end lg:hidden" style={{ background: 'rgba(28,37,65,0.4)' }} onClick={() => setShowPaletteMobile(false)}>
          <div className="w-72 max-w-[85vw] h-full bg-white p-4 overflow-y-auto mt-scrollbar" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end mb-2"><button onClick={() => setShowPaletteMobile(false)}><X size={18} /></button></div>
            <PaletteContent state={state} dispatch={dispatch} counts={counts} sections={sectionsForPalette} onGoto={() => setShowPaletteMobile(false)} />
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
      {sections.map(sec => {
        const qs = state.flatQuestions.map((fq, idx) => ({ fq, idx })).filter(x => x.fq.sectionId === sec.id);
        if (!qs.length) return null;
        return (
          <div key={sec.id} className="mb-4">
            <div className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--ink-soft)' }}>
              {sec.name}
              {state.lockedSections[sec.id] && <span className="text-xs" style={{ color: 'var(--alert)' }}>(locked)</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {qs.map(({ fq, idx }) => (
                <button
                  key={fq.id}
                  className={`mt-bubble ${statusClass(fq)} ${idx === state.currentIndex ? 'current' : ''}`}
                  onClick={() => { dispatch({ type: 'GOTO', index: idx }); onGoto && onGoto(); }}
                  disabled={state.lockedSections[fq.sectionId]}
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

function gradeTest(state) {
  let maxObjective = 0, obtained = 0, correctCount = 0, wrongCount = 0, unansweredObjective = 0;
  const needsReview = [];
  const perQuestion = [];

  state.flatQuestions.forEach((q, idx) => {
    const ans = state.answers[q.id];
    const hasAnswer = hasRealAnswer(q, ans);
    const hasCorrectAnswer = q.type === 'msq' ? Array.isArray(q.correctAnswer) && q.correctAnswer.length > 0 : !!q.correctAnswer;
    const gradable = (q.type === 'mcq' || q.type === 'msq' || q.type === 'numeric') && hasCorrectAnswer;
    let verdict = 'ungraded';

    if (gradable) {
      maxObjective += q.marks;
      if (!hasAnswer) {
        unansweredObjective++;
        verdict = 'unanswered';
      } else if (answerIsCorrect(q, ans)) {
        obtained += q.marks;
        correctCount++;
        verdict = 'correct';
      } else {
        obtained -= getNegativeMarking(state.config, q.type);
        wrongCount++;
        verdict = 'wrong';
      }
    } else if (q.type === 'short' && q.correctAnswer) {
      maxObjective += q.marks;
      if (!hasAnswer) { unansweredObjective++; verdict = 'unanswered'; }
      else if (answerIsCorrect(q, ans)) { obtained += q.marks; correctCount++; verdict = 'correct'; }
      else { obtained -= getNegativeMarking(state.config, q.type); wrongCount++; verdict = 'wrong'; needsReview.push(q); }
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

function ResultsScreen({ state, onRestart }) {
  const grade = useMemo(() => gradeTest(state), [state]);
  const [filter, setFilter] = useState('all');

  const filtered = state.flatQuestions.filter((q, idx) => {
    if (filter === 'all') return true;
    const st = state.status[q.id];
    if (filter === 'answered') return st === 'answered' || st === 'answered-marked';
    if (filter === 'unanswered') return !st || st === 'not-answered' || st === 'marked';
    if (filter === 'marked') return st === 'marked' || st === 'answered-marked';
    return true;
  });

  const chartData = grade.perQuestion.map(p => ({ name: `${p.index}`, seconds: p.time, verdict: p.verdict }));
  const verdictColor = { correct: 'var(--answered)', wrong: 'var(--alert)', unanswered: 'var(--ink-faint)', ungraded: 'var(--brass)' };

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
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--rule)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--ink-soft)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--ink-soft)' }} label={{ value: 'sec', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'var(--ink-soft)' }} />
                <Tooltip formatter={(v) => [`${v}s`, 'time spent']} labelFormatter={(l) => `Q${l}`} />
                <Bar dataKey="seconds" radius={[2, 2, 0, 0]}>
                  {chartData.map((d, i) => <Cell key={i} fill={verdictColor[d.verdict] || 'var(--brass)'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
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
            return (
              <div key={q.id} className="mt-card p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="text-sm mt-serif"><span className="mt-mono text-xs mr-1.5" style={{ color: 'var(--ink-faint)' }}>Q{idx + 1}.</span>{q.text}</div>
                  <span className="text-xs mt-mono flex-shrink-0" style={{ color: 'var(--ink-faint)' }}>{fmtClock(state.timeSpent[q.id] || 0)}</span>
                </div>
                <div className="text-xs mb-1" style={{ color: 'var(--ink-soft)' }}>
                  Your answer: <span style={{ color: answered ? (gradable ? (correct ? 'var(--answered)' : 'var(--alert)') : 'var(--ink)') : 'var(--ink-faint)' }}>{ansDisplay || 'Not answered'}</span>
                </div>
                {q.correctAnswer && (
                  <div className="text-xs" style={{ color: 'var(--ink-soft)' }}>
                    {q.type === 'descriptive' ? 'Reference answer' : 'Correct answer'}: <span style={{ color: 'var(--answered)' }}>{correctDisplay}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      </div>

      <div className="flex-shrink-0 border-t mt-hairline p-3 md:p-4 flex justify-center" style={{ background: 'var(--paper)' }}>
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
   SITE HEADER — logo + brand name, shown on every screen
   ============================================================ */
function SiteHeader() {
  return (
    <header className="mt-site-header">
      <img src={`${process.env.PUBLIC_URL}/mocksy-logo.jpg`} alt="Mocksy logo" />
      <div>
        <div className="mt-brand-name">Mocksy</div>
        <div className="mt-brand-tag">Mock Test Generator</div>
      </div>
    </header>
  );
}

/* ============================================================
   ROOT APP — exported as MockTestApp
   ============================================================ */
export default function MockTestApp() {
  const [stage, setStage] = useState('upload'); // upload | review | configure | test | results
  const [paper, setPaper] = useState(null);
  const [config, setConfig] = useState(null);
  const [finalState, setFinalState] = useState(null);

  const reset = () => { setStage('upload'); setPaper(null); setConfig(null); setFinalState(null); };

  return (
    <div className="mt-root mt-app-shell">
      <GlobalStyles />
      <SiteHeader />
      <div className="mt-stage-area">
        {stage === 'upload' && (
          <UploadScreen onExtracted={(p) => { setPaper(p); setStage('review'); }} />
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
      </div>
    </div>
  );
}