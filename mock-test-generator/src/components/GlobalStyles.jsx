// GlobalStyles.jsx
// Extracted from MockTestApp.jsx so the design-system CSS (the 
// "Hall Ticket" theme: paper ivory background, exam-ink navy, brass
// seal accent) can be shared by the exam-flow screens AND the new
// marketing pages (Home / Privacy / Contact) without duplicating it.
import React from 'react';

/* ============================================================
   GLOBAL STYLE — "Hall Ticket" design language
   Paper ivory background, exam-ink navy, brass seal accent,
   mono digits for the clock, serif for headers.
   ============================================================ */
export default function GlobalStyles() {
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

      /* Right-hand cluster in the header: language toggle + (optionally)
         the install-app button. This wrapper carries the margin-left:auto
         that pushes the cluster to the right, so it works whether one or
         both of its children are present. */
      .mt-header-actions {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: 0.6rem;
        flex-shrink: 0;
      }
      @media (max-width: 520px) {
        .mt-header-actions { gap: 0.4rem; }
      }

      /* Install-app button, shown in the header on the home screen */
      .mt-install-btn {
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

      /* --------------------------------------------------------
         SITE CHROME — nav links in the header, and the marketing
         footer shown on Home / Privacy / Contact pages.
         -------------------------------------------------------- */
      .mt-site-nav {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        margin-left: auto;
        flex-shrink: 0;
      }
      .mt-site-nav a {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--ink-soft);
        text-decoration: none;
        padding: 0.3rem 0.1rem;
        border-bottom: 2px solid transparent;
        transition: color 0.12s ease, border-color 0.12s ease;
      }
      .mt-site-nav a:hover { color: var(--ink); }
      .mt-site-nav a.active { color: var(--ink); border-bottom-color: var(--brass); }

      .mt-site-footer {
        flex-shrink: 0;
        border-top: 1px solid var(--rule);
        background: var(--paper-dim);
        padding: 1.1rem 1.25rem calc(1.1rem + env(safe-area-inset-bottom, 0px));
      }
      .mt-site-footer-inner {
        max-width: 64rem;
        margin: 0 auto;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
      }
      .mt-site-footer a {
        font-size: 0.82rem;
        color: var(--ink-soft);
        text-decoration: none;
      }
      .mt-site-footer a:hover { color: var(--ink); text-decoration: underline; }
      .mt-site-footer-copy { font-size: 0.78rem; color: var(--ink-faint); }
      .mt-site-footer-credit {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.2rem;
      }
      .mt-site-footer-credit-label {
        font-size: 0.78rem;
        color: var(--ink-faint);
      }
      .mt-site-footer-credit-sep {
        font-size: 0.78rem;
        color: var(--ink-faint);
      }
      .mt-site-footer-person {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.78rem;
        color: var(--ink-faint);
      }
      .mt-site-footer-person a {
        display: inline-flex;
        align-items: center;
        color: var(--ink-soft);
      }
      .mt-site-footer-person a:hover { color: var(--ink); }

      /* --------------------------------------------------------
         MARKETING PAGES — Home, Privacy Policy, Contact Us.
         Content-driven pages inside the normal document flow
         (scrolls with the page, unlike the app's locked-height
         tool screens).
         -------------------------------------------------------- */
      .mt-marketing-page {
        max-width: 46rem;
        margin: 0 auto;
        padding: 2.5rem 1.5rem 4rem;
      }
      .mt-marketing-page.mt-marketing-wide { max-width: 64rem; }
      .mt-hero {
        text-align: center;
        padding: 2rem 0 2.5rem;
      }
      .mt-hero-eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--brass);
        background: var(--brass-soft);
        border-radius: 999px;
        padding: 0.3rem 0.85rem;
        margin-bottom: 1rem;
      }
      .mt-hero h1 {
        font-family: 'Source Serif 4', Georgia, serif;
        font-size: clamp(1.9rem, 4.5vw, 2.9rem);
        font-weight: 700;
        line-height: 1.15;
        margin: 0 0 0.85rem;
      }
      .mt-hero p {
        font-size: 1.05rem;
        color: var(--ink-soft);
        max-width: 38rem;
        margin: 0 auto 1.75rem;
        line-height: 1.6;
      }
      .mt-hero-actions {
        display: flex;
        justify-content: center;
        gap: 0.75rem;
        flex-wrap: wrap;
      }
      .mt-feature-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.1rem;
        margin: 0 0 2.5rem;
      }
      @media (max-width: 780px) {
        .mt-feature-grid { grid-template-columns: repeat(2, 1fr); }
      }
      @media (max-width: 480px) {
        .mt-feature-grid { grid-template-columns: 1fr; }
      }
      .mt-feature-card {
        padding: 1.2rem 1.25rem;
        text-align: left;
        transition: transform 0.12s ease, box-shadow 0.12s ease;
      }
      .mt-feature-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(28,37,65,0.08);
      }
      .mt-feature-card .mt-seal { margin-bottom: 0.7rem; }
      .mt-feature-card h3 {
        font-size: 0.98rem;
        font-weight: 700;
        margin: 0 0 0.35rem;
      }
      .mt-feature-card p {
        font-size: 0.85rem;
        color: var(--ink-soft);
        line-height: 1.5;
        margin: 0;
      }
      .mt-steps {
        counter-reset: mt-step;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1.35rem;
        margin: 2.75rem 0 3.25rem;
      }
      @media (max-width: 900px) {
        .mt-steps { grid-template-columns: repeat(2, 1fr); }
      }
      @media (max-width: 480px) {
        .mt-steps { grid-template-columns: 1fr; }
      }
      .mt-step {
        position: relative;
        padding: 1.5rem 1.15rem 1.2rem;
        display: flex;
        flex-direction: column;
        border-top: 2px solid var(--brass);
        transition: transform 0.12s ease, box-shadow 0.12s ease;
      }
      .mt-step:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(28,37,65,0.08);
      }
      .mt-step::before {
        counter-increment: mt-step;
        content: counter(mt-step);
        position: absolute;
        top: -0.8rem; left: 1.1rem;
        width: 1.7rem; height: 1.7rem;
        border-radius: 999px;
        background: var(--ink);
        color: var(--paper);
        font-family: 'IBM Plex Mono', monospace;
        font-weight: 700;
        font-size: 0.8rem;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 0 0 3px var(--paper);
      }
      .mt-step h3 { font-size: 0.95rem; font-weight: 700; margin: 0.5rem 0 0.35rem; }
      .mt-step p { font-size: 0.83rem; color: var(--ink-soft); line-height: 1.5; margin: 0; }

      .mt-resume-banner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
        padding: 0.9rem 1.1rem;
        margin-bottom: 1.75rem;
        border-radius: 3px;
        background: var(--brass-soft);
        border: 1px solid var(--brass);
      }
      .mt-resume-banner p { margin: 0; font-size: 0.88rem; color: var(--ink); }

      /* Prose styling for the Privacy Policy / Contact Us pages */
      .mt-prose h2 {
        font-family: 'Source Serif 4', Georgia, serif;
        font-size: 1.3rem;
        font-weight: 700;
        margin: 2rem 0 0.6rem;
      }
      .mt-prose h2:first-child { margin-top: 0; }
      .mt-prose p { font-size: 0.92rem; line-height: 1.7; color: var(--ink-soft); margin: 0 0 0.9rem; }
      .mt-prose ul { margin: 0 0 0.9rem; padding-left: 1.2rem; }
      .mt-prose li { font-size: 0.92rem; line-height: 1.7; color: var(--ink-soft); margin-bottom: 0.35rem; }
      .mt-prose strong { color: var(--ink); }
      .mt-prose a { color: var(--brass); text-decoration: underline; }
      .mt-updated-badge {
        display: inline-block;
        font-size: 0.78rem;
        color: var(--ink-faint);
        margin-bottom: 2rem;
      }

      .mt-contact-card {
        display: flex;
        align-items: flex-start;
        gap: 0.9rem;
        padding: 1.1rem 1.2rem;
        margin-bottom: 0.9rem;
      }
      .mt-contact-card h3 { font-size: 0.92rem; font-weight: 700; margin: 0 0 0.2rem; }
      .mt-contact-card p { font-size: 0.85rem; color: var(--ink-soft); margin: 0; line-height: 1.5; }
      .mt-contact-card a { color: var(--brass); font-weight: 600; text-decoration: none; }
      .mt-contact-card a:hover { text-decoration: underline; }

      @media (max-width: 640px) {
        .mt-site-header {
          flex-wrap: wrap;
          height: auto;
          padding: 0.65rem 0.85rem;
          row-gap: 0.5rem;
        }
        .mt-site-header > a { flex-shrink: 0; }
        .mt-site-nav {
          flex-basis: 100%;
          margin-left: 0;
          flex-wrap: wrap;
          gap: 0.7rem 1rem;
        }
        .mt-site-nav a { font-size: 0.78rem; padding: 0.1rem 0; }
        .mt-site-footer { padding: 0.9rem 1rem calc(0.9rem + env(safe-area-inset-bottom, 0px)); }
        .mt-site-footer-inner { gap: 0.5rem; }
        .mt-site-footer a { font-size: 0.78rem; }
        .mt-site-footer-copy { font-size: 0.72rem; }
        .mt-site-footer-credit-label { font-size: 0.72rem; }
        .mt-site-footer-person { font-size: 0.72rem; }
      }
    `}</style>
  );
}