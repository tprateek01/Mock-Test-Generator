// SiteHeader.jsx
// Extracted from MockTestApp.jsx and extended with site navigation
// (Home / Privacy / Contact) for the new marketing pages. The exam-flow
// screens (upload/review/configure/test/results) pass showNav={false} to
// keep their header minimal and distraction-free, matching prior behavior.
import React from 'react';
import { NavLink } from 'react-router-dom';
import InstallAppButton from './InstallAppButton';

export default function SiteHeader({ showInstall = false, showNav = true }) {
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
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>Home</NavLink>
          <NavLink to="/create" className={({ isActive }) => (isActive ? 'active' : '')}>Create a test</NavLink>
          <NavLink to="/contact" className={({ isActive }) => (isActive ? 'active' : '')}>Contact</NavLink>
          <NavLink to="/privacy" className={({ isActive }) => (isActive ? 'active' : '')}>Privacy</NavLink>
        </nav>
      )}

      {showInstall && <InstallAppButton />}
    </header>
  );
}
