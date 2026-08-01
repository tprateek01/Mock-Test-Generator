// MarketingLayout.jsx
// Shared shell for the marketing pages (Home / Privacy / Contact).
// Reuses the same .mt-app-shell (100dvh flex column) + .mt-stage-area
// (the scrollable region below the header) classes the exam-flow screens
// already use, so behavior is consistent across the whole site: header
// stays put, page content scrolls, and the footer is a normal last child
// of the scrollable region — never position:fixed, so it can't fight the
// on-screen keyboard or mobile viewport-resize quirks the way the old
// per-screen "fixed bottom-0" footers did.
import React from 'react';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

export default function MarketingLayout({ children }) {
  return (
    <div className="mt-app-shell">
      <SiteHeader showNav />
      <main className="mt-stage-area">
        {children}
        <SiteFooter />
      </main>
    </div>
  );
}
