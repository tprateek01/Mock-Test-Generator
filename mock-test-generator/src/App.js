import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import GlobalStyles from './components/GlobalStyles';
import HomePage from './pages/HomePage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ContactUs from './pages/ContactUs';
import MockTestApp from './MockTestApp';
import { LanguageProvider } from './i18n/LanguageContext';

function App() {
  return (
    // .mt-root carries the design-system CSS variables (--paper, --ink,
    // --brass, …) used by every page — it has to wrap the whole Router so
    // marketing pages and the exam-flow app both get them, not just one.
    // LanguageProvider wraps everything too, so the EN/HI toggle in
    // SiteHeader (shown on every page) shares one language state across
    // the whole site instead of each page/screen having its own copy.
    <div className="mt-root" style={{ minHeight: '100vh' }}>
      <GlobalStyles />
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/contact" element={<ContactUs />} />
            {/* The actual tool: upload → review → configure → test → results */}
            <Route path="/create" element={<MockTestApp />} />
            {/* Unknown paths fall back to the home page rather than a dead end */}
            <Route path="*" element={<HomePage />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </div>
  );
}

export default App;