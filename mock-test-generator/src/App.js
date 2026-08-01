import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import GlobalStyles from './components/GlobalStyles';
import HomePage from './pages/HomePage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ContactUs from './pages/ContactUs';
import MockTestApp from './MockTestApp';

function App() {
  return (
    // .mt-root carries the design-system CSS variables (--paper, --ink,
    // --brass, …) used by every page — it has to wrap the whole Router so
    // marketing pages and the exam-flow app both get them, not just one.
    <div className="mt-root" style={{ minHeight: '100vh' }}>
      <GlobalStyles />
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
    </div>
  );
}

export default App;
