// MarketingLayout.jsx
// Shared shell for the marketing pages (Home / Privacy / Contact).
// Reuses the same .mt-app-shell (100dvh flex column) + .mt-stage-area
// (the scrollable region below the header) classes the exam-flow screens
// already use, so behavior is consistent across the whole site: header
// and footer are fixed flex-shrink:0 siblings that stay put, and only
// the content in between (.mt-stage-area) scrolls. This is deliberately
// NOT position:fixed — a flex sibling with flex-shrink:0 pins it at the
// bottom without fighting the on-screen keyboard or mobile viewport-resize
// quirks the way "fixed bottom-0" footers do.
import React from 'react';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

export default function MarketingLayout({ children }) {
  return (
    <div className="mt-app-shell">
      <SiteHeader showNav showInstall />
      <main className="mt-stage-area">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}