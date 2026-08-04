// SiteFooter.jsx
// Shown on the marketing pages (Home / Privacy / Contact) only — the
// exam-flow screens (upload/review/configure/test/results) intentionally
// omit it so their locked-height, single-scroll-region layout (see
// .mt-viewport-fixed in GlobalStyles.jsx) stays untouched.
import React from 'react';
import { Github, Linkedin } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { FOOTER_STRINGS } from '../i18n/strings';

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
              <Github size={14} strokeWidth={2} />
            </a>
            <a href="https://www.linkedin.com/in/prateek-tripathi-3a100a252/" target="_blank" rel="noopener noreferrer" aria-label="Prateek Tripathi on LinkedIn">
              <Linkedin size={14} strokeWidth={2} />
            </a>
          </span>
          {' & '}
          <span className="mt-site-footer-person">
            Anmol Pandey
            <a href="https://github.com/AnmolPandey9119" target="_blank" rel="noopener noreferrer" aria-label="Anmol Pandey on GitHub">
              <Github size={14} strokeWidth={2} />
            </a>
            <a href="https://www.linkedin.com/in/anmol-pandey-240105376/" target="_blank" rel="noopener noreferrer" aria-label="Anmol Pandey on LinkedIn">
              <Linkedin size={14} strokeWidth={2} />
            </a>
          </span>
        </span>
      </div>
    </footer>
  );
}