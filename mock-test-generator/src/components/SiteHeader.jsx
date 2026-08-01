// SiteHeader.jsx
// Extracted from MockTestApp.jsx and extended with site navigation
// (Home / Privacy / Contact) for the new marketing pages. The exam-flow
// screens (upload/review/configure/test/results) pass showNav={false} to
// keep their header minimal and distraction-free, matching prior behavior.
//
// SiteHeader is the one component every route renders (directly here, or
// via MarketingLayout for Home/Privacy/Contact) — so the EN/HI language
// toggle lives here now, instead of being local to a single screen. That
// makes it appear at the top of every page, and its state is shared via
// LanguageContext so the choice carries across navigation.
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Languages } from 'lucide-react';
import InstallAppButton from './InstallAppButton';
import { useLanguage } from '../i18n/LanguageContext';
import { NAV_STRINGS } from '../i18n/strings';

export default function SiteHeader({ showInstall = false, showNav = true }) {
  const { lang, toggleLang } = useLanguage();
  const t = NAV_STRINGS[lang];

  return (
    <header className="mt-site-header">
      <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', textDecoration: 'none' }}>
        <img src={`${process.env.PUBLIC_URL}/mocksy-logo.jpg`} alt="Mocksy logo" />
        <div>
          <div className="mt-brand-name">Mocksy</div>
          <div className="mt-brand-tag">Mock Test Generator</div>
        </div>
      </NavLink>

      {showNav && (
        <nav className="mt-site-nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>{t.home}</NavLink>
          <NavLink to="/create" className={({ isActive }) => (isActive ? 'active' : '')}>{t.createTest}</NavLink>
          <NavLink to="/contact" className={({ isActive }) => (isActive ? 'active' : '')}>{t.contact}</NavLink>
          <NavLink to="/privacy" className={({ isActive }) => (isActive ? 'active' : '')}>{t.privacy}</NavLink>
        </nav>
      )}

      <div className="mt-header-actions">
        <button
          type="button"
          className="mt-lang-toggle"
          onClick={toggleLang}
          aria-label="Switch language / भाषा बदलें"
          title="Switch language / भाषा बदलें"
        >
          <Languages size={13} />
          <span className={lang === 'en' ? 'mt-lang-active' : ''}>EN</span>
          <span className="mt-lang-sep">/</span>
          <span className={lang === 'hi' ? 'mt-lang-active' : ''}>हिं</span>
        </button>
        {showInstall && <InstallAppButton />}
      </div>
    </header>
  );
}