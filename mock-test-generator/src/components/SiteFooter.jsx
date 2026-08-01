// SiteFooter.jsx
// Shown on the marketing pages (Home / Privacy / Contact) only — the
// exam-flow screens (upload/review/configure/test/results) intentionally
// omit it so their locked-height, single-scroll-region layout (see
// .mt-viewport-fixed in GlobalStyles.jsx) stays untouched.
import React from 'react';
import { Link } from 'react-router-dom';

export default function SiteFooter() {
  return (
    <footer className="mt-site-footer">
      <div className="mt-site-footer-inner">
        <span className="mt-site-footer-copy">© {new Date().getFullYear()} Mocksy — free, ad-free mock test generator.</span>
        <nav className="mt-site-footer-links">
          <Link to="/">Home</Link>
          <Link to="/create">Create a test</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/contact">Contact Us</Link>
          <a href="https://github.com/tprateek01/Mock-Test-Generator" target="_blank" rel="noopener noreferrer">GitHub</a>
        </nav>
      </div>
    </footer>
  );
}
