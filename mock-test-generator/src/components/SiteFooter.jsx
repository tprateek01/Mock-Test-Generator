// SiteFooter.jsx
// Shown on the marketing pages (Home / Privacy / Contact) only — the
// exam-flow screens (upload/review/configure/test/results) intentionally
// omit it so their locked-height, single-scroll-region layout (see
// .mt-viewport-fixed in GlobalStyles.jsx) stays untouched.
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { FOOTER_STRINGS } from '../i18n/strings';

export default function SiteFooter() {
  const { lang } = useLanguage();
  const t = FOOTER_STRINGS[lang];

  return (
    <footer className="mt-site-footer">
      <div className="mt-site-footer-inner">
        <span className="mt-site-footer-copy">{t.copy(new Date().getFullYear())}</span>
        <nav className="mt-site-footer-links">
          <Link to="/">{t.home}</Link>
          <Link to="/create">{t.createTest}</Link>
          <Link to="/privacy">{t.privacy}</Link>
          <Link to="/contact">{t.contact}</Link>
          <a href="https://github.com/tprateek01/Mock-Test-Generator" target="_blank" rel="noopener noreferrer">{t.github}</a>
        </nav>
      </div>
    </footer>
  );
}