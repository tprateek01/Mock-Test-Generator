// SiteFooter.jsx
// Shown on the marketing pages (Home / Privacy / Contact) only — the
// exam-flow screens (upload/review/configure/test/results) intentionally
// omit it so their locked-height, single-scroll-region layout (see
// .mt-viewport-fixed in GlobalStyles.jsx) stays untouched.
import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { FOOTER_STRINGS } from '../i18n/strings';

function GithubIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .5C5.73.5.75 5.48.75 11.75c0 5.02 3.26 9.28 7.78 10.78.57.1.78-.25.78-.55 0-.27-.01-1.16-.02-2.1-3.17.69-3.84-1.35-3.84-1.35-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.73-1.53-2.53-.29-5.19-1.27-5.19-5.63 0-1.24.44-2.26 1.17-3.06-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.15 1.17a10.9 10.9 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.57.23 2.73.11 3.02.73.8 1.17 1.82 1.17 3.06 0 4.37-2.67 5.34-5.21 5.62.41.36.77 1.06.77 2.14 0 1.54-.01 2.79-.01 3.17 0 .3.2.66.79.55A11.26 11.26 0 0 0 23.25 11.75C23.25 5.48 18.27.5 12 .5Z" />
    </svg>
  );
}

function LinkedinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.15 1.45-2.15 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.59 0 4.25 2.36 4.25 5.44v6.3ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z" />
    </svg>
  );
}

export default function SiteFooter() {
  const { lang } = useLanguage();
  const t = FOOTER_STRINGS[lang];

  return (
    <footer className="mt-site-footer">
      <div className="mt-site-footer-inner">
        <span className="mt-site-footer-copy">{t.copy(new Date().getFullYear())}</span>
        <span className="mt-site-footer-credit">
          {t.builtBy}{' '}
          <span className="mt-site-footer-person">
            Prateek Tripathi
            <a href="https://github.com/tprateek01" target="_blank" rel="noopener noreferrer" aria-label="Prateek Tripathi on GitHub">
              <GithubIcon />
            </a>
            <a href="https://www.linkedin.com/in/prateek-tripathi-3a100a252/" target="_blank" rel="noopener noreferrer" aria-label="Prateek Tripathi on LinkedIn">
              <LinkedinIcon />
            </a>
          </span>
          {' & '}
          <span className="mt-site-footer-person">
            Anmol Pandey
            <a href="https://github.com/AnmolPandey9119" target="_blank" rel="noopener noreferrer" aria-label="Anmol Pandey on GitHub">
              <GithubIcon />
            </a>
            <a href="https://www.linkedin.com/in/anmol-pandey-240105376/" target="_blank" rel="noopener noreferrer" aria-label="Anmol Pandey on LinkedIn">
              <LinkedinIcon />
            </a>
          </span>
        </span>
      </div>
    </footer>
  );
}