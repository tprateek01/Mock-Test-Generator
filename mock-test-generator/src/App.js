import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import './App.css';
import GlobalStyles from './components/GlobalStyles';
import HomePage from './pages/HomePage';
import { LanguageProvider } from './i18n/LanguageContext';
import { ThemeProvider } from './i18n/ThemeContext';

// PrivacyPolicy, ContactUs, and (especially) MockTestApp are code-split out
// of the initial bundle. MockTestApp alone pulls in PDF/OCR extraction,
// figure rendering, and the exam-flow UI — none of which a first-time
// visitor landing on the marketing home page needs to download or parse.
// Splitting these cuts unused JS on "/" and speeds up first paint there.
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const MockTestApp = lazy(() => import('./MockTestApp'));

function App() {
  return (
    // .mt-root carries the design-system CSS variables (--paper, --ink,
    // --brass, …) used by every page — it has to wrap the whole Router so
    // marketing pages and the exam-flow app both get them, not just one.
    // LanguageProvider wraps everything too, so the EN/HI toggle in
    // SiteHeader (shown on every page) shares one language state across
    // the whole site instead of each page/screen having its own copy.
    // ThemeProvider does the same for the light/dark toggle: it defaults to
    // the OS-level prefers-color-scheme setting, and once the user taps the
    // toggle in SiteHeader, that explicit choice is shared across every
    // page and persisted in localStorage (see src/i18n/ThemeContext.jsx).
    <div className="mt-root" style={{ minHeight: '100vh' }}>
      <GlobalStyles />
      <ThemeProvider>
        <LanguageProvider>
          <BrowserRouter>
            <Suspense fallback={null}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/contact" element={<ContactUs />} />
                {/* The actual tool: upload → review → configure → test → results */}
                <Route path="/create" element={<MockTestApp />} />
                {/* Unknown paths fall back to the home page rather than a dead end */}
                <Route path="*" element={<HomePage />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </LanguageProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;