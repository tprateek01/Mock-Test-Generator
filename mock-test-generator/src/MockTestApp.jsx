import React, { useState, useEffect, useRef, useReducer, useMemo, Suspense, lazy } from 'react';
import {
  Upload, FileText, ClipboardPaste, Clock, Flag,
  ChevronLeft, ChevronRight, AlertTriangle, X, Plus, Trash2, Pencil,
  Play, RotateCcw, Loader2, ListChecks, Timer,
  BarChart3, Layers, ArrowRight, Check, Calculator, Delete,
  Download, Share, SquarePlus, FileDown, Languages, Link2, Unlink, Shuffle
} from 'lucide-react';

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
  },
};

// mammoth (.docx parsing) and recharts (results chart) are both fairly heavy
// and only needed on specific paths (uploading a Word doc; reaching the
// Results screen) — loading them lazily keeps them out of the initial bundle
// every visitor downloads on first paint.
const ResultsChart = lazy(() => import('./ResultsChart'));

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
        --ink-faint: #5B6488;
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
      .mt-btn-outline-accent { background: #fff; color: var(--review); border-color: var(--review); }
      .mt-btn-outline-accent:hover:not(:disabled) { background: var(--review-soft); }
      .mt-btn-outline-accent:disabled { background: #fff; }

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
      .mt-bubble.or-group::before {
        content: '';
        position: absolute; top: 2px; left: 2px;
        width: 7px; height: 7px; border-radius: 999px;
        background: var(--brass);
        border: 1.5px solid #fff;
      }

      .mt-flip {
        font-family: 'IBM Plex Mono', monospace;
        font-weight: 700;
        letter-spacing: 0.02em;
        font-variant-numeric: tabular-nums;
      }

      @keyframes mt-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
      .mt-pulse { animation: mt-pulse 1s ease-in-out infinite; }

      .mt-lang-toggle {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-family: 'IBM Plex Sans', sans-serif;
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--ink-soft);
        background: #fff;
        border: 1px solid var(--rule);
        border-radius: 999px;
        padding: 0.4rem 0.75rem;
        cursor: pointer;
        transition: filter 0.12s ease, transform 0.05s ease;
        flex-shrink: 0;
      }
      .mt-lang-toggle:hover { background: var(--paper-dim); }
      .mt-lang-toggle:active { transform: translateY(1px); }
      .mt-lang-toggle span { opacity: 0.45; }
      .mt-lang-toggle span.mt-lang-active { opacity: 1; color: var(--ink); }
      .mt-lang-toggle .mt-lang-sep { opacity: 0.3; }

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

      /* Install-app button, shown in the header on the home screen */
      .mt-install-btn {
        margin-left: auto;
        flex-shrink: 0;
        white-space: nowrap;
      }
      .mt-install-btn span.mt-install-btn-label {
        display: inline;
      }
      @media (max-width: 520px) {
        .mt-install-btn { padding: 0.55rem 0.7rem; }
        .mt-install-btn span.mt-install-btn-label { display: none; }
      }

      .mt-ios-help-overlay {
        position: fixed;
        inset: 0;
        background: rgba(28,37,65,0.45);
        display: flex;
        align-items: flex-end;
        justify-content: center;
        z-index: 60;
        padding: 1rem;
        animation: mt-fade-in 0.15s ease both;
      }
      @media (min-width: 640px) {
        .mt-ios-help-overlay { align-items: center; }
      }
      .mt-ios-help-card {
        background: var(--paper);
        border: 1px solid var(--rule);
        border-radius: 10px;
        max-width: 26rem;
        width: 100%;
        padding: 1.25rem 1.35rem 1.5rem;
        box-shadow: 0 12px 32px rgba(28,37,65,0.25);
      }
      .mt-ios-help-title {
        font-family: 'Source Serif 4', Georgia, serif;
        font-weight: 700;
        font-size: 1.15rem;
        color: var(--ink);
        margin-bottom: 0.15rem;
      }
      .mt-ios-help-sub {
        font-size: 0.82rem;
        color: var(--ink-soft);
        margin-bottom: 1rem;
      }
      .mt-ios-help-steps {
        list-style: none;
        margin: 0 0 1.25rem;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.7rem;
      }
      .mt-ios-help-steps li {
        display: flex;
        align-items: flex-start;
        gap: 0.65rem;
        font-size: 0.88rem;
        color: var(--ink);
        line-height: 1.4;
      }
      .mt-ios-help-steps .mt-ios-help-icon {
        flex-shrink: 0;
        width: 1.9rem;
        height: 1.9rem;
        border-radius: 999px;
        background: var(--brass-soft);
        color: var(--brass);
        display: flex;
        align-items: center;
        justify-content: center;
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
{"title":"string","totalQuestionsInSource":number|null,"sections":[{"name":"string","questions":[{"type":"mcq|msq|numeric|short|descriptive","questionNumber":number,"text":"string","options":["string"]|null,"marks":number,"correctAnswer":"string"|["string"]|null,"orGroup":"string"|null,"orGroupChoose":number|null}]}],"complete":boolean}

Rules:
- "mcq" = multiple choice, exactly ONE correct option. "msq" = multiple SELECT, TWO OR MORE correct options (common in GATE-style papers, often marked "one or more options may be correct"). "numeric" = requires a numeric answer, no options. "short" = brief word/phrase/one-line answer. "descriptive" = long-form written answer.
- options: array of option text WITHOUT letter/number labels (e.g. "Paris", not "A) Paris"). Only for mcq/msq, else null. If an option IS an image/diagram/shape rather than text (e.g. "which of these 4 figures is the odd one out", geometric-pattern options, graph-shaped options), do NOT skip it or leave it blank — write a precise, detailed textual description of exactly what's drawn (shape type, number of sides/sections, orientation, shading, arrows, labels, relative position of parts, etc.) so someone who cannot see the original could still tell this option apart from the others. Prefix any such description with "[Figure] " so the app can flag it for the candidate.
- marks: marks stated in the source if present, else default to 1.
- correctAnswer: fill in ONLY if an answer key is clearly present in the source. For mcq, give the exact option text as a single string. For msq, give an ARRAY of the exact option text(s) marked correct (even if only one is marked in the source, still use an array for msq). Never invent an answer — use null if unsure.
- orGroup / orGroupChoose — EITHER/OR QUESTIONS: real exam papers frequently say a candidate may attempt only SOME of a set of alternative questions, e.g. "Answer Q5(a) OR Q5(b)", "Attempt either Question 12 or Question 13", "Answer any THREE of the following FIVE questions", "Attempt any 4 questions from Q16 to Q20". Whenever the source explicitly states such a choice between two or more questions:
  - Give every question in that alternative set the SAME "orGroup" string id (invent a short stable id from the source's own numbering, e.g. "Q5", "Q16-20" — reuse the exact same id string for every member of that set, including across continuation responses).
  - Set "orGroupChoose" on every member of that set to the number of questions the candidate must actually answer from it (e.g. 1 for "either/or", 3 for "any three of the following five").
  - Questions NOT part of such a set: orGroup: null, orGroupChoose: null.
  - Do not invent OR groups — only mark them when the source's wording clearly states the choice (words like "either...or", "OR", "any N of the following", "attempt any N questions").
- Group questions under their section headings exactly as they appear (e.g. "Section A", "Physics", "Part I"). If there are no explicit sections, use one section named "Section 1".
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

async function extractQuestions(sourceParts, onProgress, maxQuestions = null, resume = null, onSaveState = null) {
  const cap = resume && resume.cap !== undefined
    ? resume.cap
    : (typeof maxQuestions === 'number' && maxQuestions > 0 ? Math.floor(maxQuestions) : null);
  let contents = (resume && resume.contents) || [{
    role: 'user',
    parts: [
      ...sourceParts,
      {
        text: cap
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
  // source instead of drifting over.
  const seenQuestionNumbers = new Set((resume && resume.seenQuestionNumbers) || []);
  // Plain object (not `let`) so the forEach callbacks below — recreated each
  // while-loop iteration — close over a stable `const` binding instead of a
  // reassigned loop variable. Functionally identical to `let globalSeq = 0;
  // globalSeq++`, but avoids ESLint's no-loop-func rule, which CRA's build
  // treats as a hard error under CI=true (as on Vercel).
  const seqRef = { current: (resume && resume.seq) || 0 };

  const MAX_ITERATIONS = 60;
  const MAX_RECONCILE_ROUNDS = 6;
  // Large per-call output budget: the old 1000-token cap was the root cause of
  // both missed questions and mid-passage cutoffs — it forced the model to stop
  // after just a few questions (or partway through a long passage) every time.
  const MAX_OUTPUT_TOKENS = 8192;

  const totalSoFar = () => sections.reduce((n, s) => n + s.questions.length, 0);

  if (resume && onProgress) onProgress(totalSoFar());

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    if (onSaveState) {
      await onSaveState({
        contents, sections, iterations, title, expectedTotal, reconcileRounds,
        seenQuestionNumbers: Array.from(seenQuestionNumbers), seq: seqRef.current, cap
      });
    }
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
        const orGroup = typeof q.orGroup === 'string' && q.orGroup.trim() ? q.orGroup.trim() : null;
        const orGroupChoose = orGroup && typeof q.orGroupChoose === 'number' && q.orGroupChoose > 0 ? Math.floor(q.orGroupChoose) : (orGroup ? 1 : null);
        const questionNumber = typeof q.questionNumber === 'number' && isFinite(q.questionNumber) ? q.questionNumber : null;
        // A question with a questionNumber we've already accepted is a
        // duplicate (most likely re-sent during a reconciliation re-scan) —
        // skip it so counts don't inflate and order doesn't get corrupted.
        if (questionNumber !== null && seenQuestionNumbers.has(questionNumber)) return;
        if (questionNumber !== null) seenQuestionNumbers.add(questionNumber);
        existing.questions.push({
          id: uid('q'),
          type,
          text: q.text || '',
          options: (type === 'mcq' || type === 'msq') && Array.isArray(q.options) ? q.options : null,
          marks: typeof q.marks === 'number' && q.marks > 0 ? q.marks : 1,
          correctAnswer,
          orGroup,
          orGroupChoose,
          // Internal-only, used to restore original document order below —
          // stripped before the paper is returned.
          __qn: questionNumber,
          __seq: seqRef.current++
        });
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
      contents = [...contents, { role: 'model', parts: [{ text: raw }] }, { role: 'user', parts: [{ text: `You have extracted ${afterCount} question(s) so far${expectedTotal ? ` out of an estimated ${expectedTotal}` : ''}. Continue extracting the NEXT batch from exactly where you left off, same JSON schema. Never repeat a question already extracted. If a question shares a passage you already sent in full in a previous response, do not resend that passage text — just continue with the question.` }] }];
      continue;
    }

    // The model says it's finished — but before trusting that, check it against
    // its own earlier estimate of the total. This is what catches "90 out of 100"
    // style undercounts instead of silently accepting an incomplete extraction.
    // Skipped entirely when a cap is set — an "undercount" relative to the
    // full source is expected and intentional in that case.
    if (!cap && expectedTotal && afterCount < expectedTotal && reconcileRounds < MAX_RECONCILE_ROUNDS) {
      reconcileRounds++;
      contents = [...contents, { role: 'model', parts: [{ text: raw }] }, { role: 'user', parts: [{ text: `You estimated earlier that this source has about ${expectedTotal} questions, but you have only extracted ${afterCount} so far. Carefully re-scan the ENTIRE source end to end, including any pages, sections, or passage-based question sets you may have skipped, and extract every remaining question you find, same JSON schema. Never repeat a question already extracted. If after a careful re-check there truly are no more questions, set "complete": true again.` }] }];
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
  // Home-page-only display language. Purely cosmetic — doesn't touch
  // extraction, review, timing, or test-taking, all of which stay English.
  const [lang, setLang] = useState('en'); // 'en' | 'hi'
  const t = HOME_STRINGS[lang];
  // Optional cap so someone with a huge source paper (or who just wants a
  // quick practice run) can pull only the first N questions instead of the
  // whole thing — cuts extraction time/cost too.
  const [limitEnabled, setLimitEnabled] = useState(false);
  const [questionLimit, setQuestionLimit] = useState(20);

  // If the app was switched away from / backgrounded mid-extraction and the
  // OS reloaded the page (reclaiming memory, which is what silently
  // discontinued fetching before), pick the interrupted extraction back up
  // automatically instead of making the user re-upload and start over.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await loadExtractionProgress();
      if (cancelled || !saved || !saved.contents) return;
      setStatus('working');
      setProgressCount((saved.sections || []).reduce((n, s) => n + s.questions.length, 0));
      try {
        const paper = await extractQuestions(
          [], (n) => { if (!cancelled) setProgressCount(n); }, saved.cap, saved,
          (snap) => saveExtractionProgress({ ...snap, sourceSignature: saved.sourceSignature })
        );
        if (cancelled) return;
        if (!paper.sections.length || !paper.sections.some(s => s.questions.length)) {
          throw new Error(t.errNoQuestions);
        }
        await clearExtractionProgress();
        onExtracted(paper);
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
                images.push({ inlineData: { mimeType, data: b64 } });
                // Leave a marker in the text flow so the model knows roughly
                // where each image sits relative to the surrounding text.
                return { src: '', alt: `[[embedded-image-${imgIdx}]]` };
              })
            }
          );
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
      const cap = limitEnabled && Number(questionLimit) > 0 ? Math.floor(Number(questionLimit)) : null;
      const paper = await extractQuestions(
        sourceParts, (n) => setProgressCount(n), cap, null,
        (snap) => saveExtractionProgress({ ...snap, sourceSignature })
      );
      if (!paper.sections.length || !paper.sections.some(s => s.questions.length)) {
        throw new Error(t.errNoQuestions);
      }
      await clearExtractionProgress();
      onExtracted(paper);
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
                <input
                  type="number" min={1} className="mt-input w-24"
                  value={questionLimit}
                  onChange={(e) => setQuestionLimit(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
              <div className="text-xs mt-1.5" style={{ color: 'var(--ink-faint)' }}>{t.limitHint(questionLimit)}</div>
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
    <div className="min-h-full p-6 md:p-10 flex justify-center">
      <div className="w-full max-w-3xl mt-fade-in pb-24">
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
                      <input
                        type="number" min={1} max={Math.max(1, selectedIds.size - 1)} className="mt-input w-14"
                        value={chooseCount} onChange={(e) => setChooseCount(parseInt(e.target.value) || 1)}
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
                          <input
                            type="number" min={1} max={idxs.length} className="mt-input w-11" style={{ padding: '0.1rem 0.3rem' }}
                            value={chosen}
                            onChange={(e) => setGroupChoose(sIdx, gid, Math.max(1, Math.min(idxs.length, parseInt(e.target.value) || 1)))}
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

        <div
          className="fixed bottom-0 left-0 right-0 border-t mt-hairline p-4 flex items-center justify-between"
          style={{ background: 'var(--paper)', zIndex: 20, paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
        >
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

function QuestionEditRow({ q, index, onChange, onRemove, selectable, selected, onToggleSelect }) {
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
        )}

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
                            <input
                              type="number" min={0} step={0.25} className="mt-input w-24"
                              value={cfg.byMarks[mk] ?? 0}
                              onChange={(e) => setNegativeMarking({ ...negativeMarking, [t]: { ...cfg, byMarks: { ...cfg.byMarks, [mk]: parseFloat(e.target.value) || 0 } } })}
                            />
                            <span className="text-xs" style={{ color: 'var(--ink-faint)' }}>marks off</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 pl-3">
                        <input
                          type="number" min={0} step={0.25} className="mt-input w-24"
                          value={cfg.flat}
                          onChange={(e) => setNegativeMarking({ ...negativeMarking, [t]: { ...cfg, flat: parseFloat(e.target.value) || 0 } })}
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

        <div
          className="fixed bottom-0 left-0 right-0 border-t mt-hairline p-4"
          style={{ background: 'var(--paper)', zIndex: 20, paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
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
const TEST_PROGRESS_KEY = 'mocksy_test_progress_v1';
function saveTestProgress(paper, config, state) {
  try {
    localStorage.setItem(TEST_PROGRESS_KEY, JSON.stringify({ paper, config, state, savedAt: Date.now() }));
  } catch (e) { /* ignore — autosave is best-effort */ }
}
function loadTestProgress() {
  try {
    const raw = localStorage.getItem(TEST_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}
function clearTestProgress() {
  try { localStorage.removeItem(TEST_PROGRESS_KEY); } catch (e) { /* ignore */ }
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
              <div className="mt-serif text-lg leading-relaxed">
                <span className="mt-mono text-sm mr-2" style={{ color: 'var(--ink-faint)' }}>Q{state.currentIndex + 1}.</span>
                {q.text}
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
        {isDesktop && (
          <div className="w-72 border-l mt-hairline overflow-y-auto mt-scrollbar p-4" style={{ background: '#fff' }}>
            <PaletteContent state={state} dispatch={dispatch} counts={counts} sections={sectionsForPalette} />
          </div>
        )}
      </div>

      {/* Bottom action bar — stays fixed at the bottom of the viewport; only the
          question panel above scrolls. Labels collapse to icons on narrow screens. */}
      <div className="flex-shrink-0 border-t mt-hairline px-2.5 md:px-6 py-2.5 md:py-3 flex items-center justify-between gap-1.5 md:gap-2" style={{ background: '#fff' }}>
        <div className="flex items-center gap-1.5 md:gap-2">
          <button className="mt-btn mt-btn-ghost" onClick={() => dispatch({ type: 'PREV' })} disabled={state.currentIndex === 0}><ChevronLeft size={15} /> <span className="hidden sm:inline">Previous</span></button>
          <button className="mt-btn mt-btn-outline-accent" onClick={() => { dispatch({ type: 'TOGGLE_MARK' }); dispatch({ type: 'NEXT' }); }} disabled={isLocked}><Flag size={14} /> <span className="hidden sm:inline">Mark for Review &amp; Next</span><span className="sm:hidden">Mark</span></button>
          <button className="mt-btn mt-btn-outline-accent" onClick={() => dispatch({ type: 'CLEAR' })} disabled={isLocked}><RotateCcw size={14} /> <span className="hidden sm:inline">Clear Response</span><span className="sm:hidden">Clear</span></button>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <button className="mt-btn mt-btn-primary" onClick={() => dispatch({ type: 'NEXT' })}><span className="hidden sm:inline">Save & Next</span><span className="sm:hidden">Next</span> <ChevronRight size={15} /></button>
          <button className="mt-btn mt-btn-brass" onClick={() => setShowSubmitModal(true)}><span className="hidden sm:inline">Submit Test</span><span className="sm:hidden">Submit</span></button>
        </div>
      </div>

      {!isDesktop && showPaletteMobile && (
        <div className="fixed inset-0 z-40 flex justify-end" style={{ background: 'rgba(28,37,65,0.4)' }} onClick={() => setShowPaletteMobile(false)}>
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
                  <div className="text-sm mt-serif">
                    <span className="mt-mono text-xs mr-1.5" style={{ color: 'var(--ink-faint)' }}>Q{idx + 1}.</span>
                    {q.orGroup && <Link2 size={12} className="inline mb-0.5 mr-1" style={{ color: 'var(--brass)' }} />}
                    {q.text}
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
                      Your answer: <span style={{ color: answered ? (gradable ? (correct ? 'var(--answered)' : 'var(--alert)') : 'var(--ink)') : 'var(--ink-faint)' }}>{ansDisplay || 'Not answered'}</span>
                    </div>
                    {q.correctAnswer && (
                      <div className="text-xs" style={{ color: 'var(--ink-soft)' }}>
                        {q.type === 'descriptive' ? 'Reference answer' : 'Correct answer'}: <span style={{ color: 'var(--answered)' }}>{correctDisplay}</span>
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
   SITE HEADER — logo + brand name, shown on every screen
   ============================================================ */
/* ------------------------------------------------------------
   INSTALL APP — turns the site into a real, icon-on-home-screen,
   full-screen, offline-capable app via the PWA install flow.
   Chrome/Edge/Android fire `beforeinstallprompt`, which we capture
   and trigger from our own button. iOS Safari doesn't support that
   event at all, so there we show short "Add to Home Screen" steps
   instead — that's the only way to install a PWA on iOS.
   ------------------------------------------------------------ */
function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standaloneMedia = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    const iosStandalone = window.navigator.standalone === true;
    setIsStandalone(!!(standaloneMedia || iosStandalone));

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  return { deferredPrompt, isStandalone, clearPrompt: () => setDeferredPrompt(null) };
}

function InstallAppButton() {
  const { deferredPrompt, isStandalone, clearPrompt } = useInstallPrompt();
  const [showIosHelp, setShowIosHelp] = useState(false);

  const ua = window.navigator.userAgent || '';
  const isIos = /iphone|ipad|ipod/i.test(ua) && !window.MSStream;

  // Already installed — nothing to offer.
  if (isStandalone) return null;
  // Not iOS and the browser hasn't (or won't) fire beforeinstallprompt
  // (e.g. desktop Firefox, or it just hasn't fired yet) — hide rather
  // than show a button that does nothing.
  if (!isIos && !deferredPrompt) return null;

  const handleClick = async () => {
    if (isIos) {
      setShowIosHelp(true);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    clearPrompt();
  };

  return (
    <>
      <button type="button" className="mt-btn mt-btn-brass mt-install-btn" onClick={handleClick}>
        <Download size={16} />
        <span className="mt-install-btn-label">Download App</span>
      </button>

      {showIosHelp && (
        <div className="mt-ios-help-overlay" onClick={() => setShowIosHelp(false)}>
          <div className="mt-ios-help-card" onClick={(e) => e.stopPropagation()}>
            <div className="mt-ios-help-title">Install Mocksy on your device</div>
            <div className="mt-ios-help-sub">Adds an app icon to your Home Screen — opens full-screen, no browser bar.</div>
            <ol className="mt-ios-help-steps">
              <li>
                <span className="mt-ios-help-icon"><Share size={16} /></span>
                <span>Tap the <strong>Share</strong> icon in Safari's toolbar.</span>
              </li>
              <li>
                <span className="mt-ios-help-icon"><SquarePlus size={16} /></span>
                <span>Scroll down and tap <strong>Add to Home Screen</strong>.</span>
              </li>
              <li>
                <span className="mt-ios-help-icon"><Check size={16} /></span>
                <span>Tap <strong>Add</strong> — Mocksy now opens like any other app.</span>
              </li>
            </ol>
            <button type="button" className="mt-btn mt-btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowIosHelp(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function SiteHeader({ showInstall }) {
  return (
    <header className="mt-site-header">
      <img src={`${process.env.PUBLIC_URL}/mocksy-logo.jpg`} alt="Mocksy logo" />
      <div>
        <div className="mt-brand-name">Mocksy</div>
        <div className="mt-brand-tag">Mock Test Generator</div>
      </div>
      {showInstall && <InstallAppButton />}
    </header>
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

  const reset = () => { clearTestProgress(); setStage('upload'); setPaper(null); setConfig(null); setFinalState(null); };

  return (
    <div className="mt-root mt-app-shell">
      <GlobalStyles />
      <SiteHeader showInstall={stage === 'upload'} />
      <main className="mt-stage-area">
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
      </main>
    </div>
  );
}