// LanguageContext.jsx
// Single source of truth for the site-wide English/Hindi toggle. Previously
// the toggle lived as local state inside one screen (UploadScreen in
// MockTestApp.jsx) and only affected that screen. Now it's a React Context
// provided once at the app root (see App.js), so:
//   - the toggle button itself lives in SiteHeader, which renders on every
//     route, so it's visible at the top of every page;
//   - the chosen language is shared across every page/component that reads
//     it via useLanguage(), instead of each screen having its own copy;
//   - the choice persists across navigation and reloads via localStorage.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'mocksy_lang';
const LanguageContext = createContext({ lang: 'en', setLang: () => {}, toggleLang: () => {} });

function readInitialLang() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === 'hi' ? 'hi' : 'en';
  } catch {
    // localStorage can throw in some privacy modes — default to English.
    return 'en';
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readInitialLang);

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
    // Keeps <html lang="..."> correct for accessibility/SEO whichever
    // language is active.
    document.documentElement.lang = lang === 'hi' ? 'hi' : 'en';
  }, [lang]);

  const setLang = useCallback((next) => setLangState(next === 'hi' ? 'hi' : 'en'), []);
  const toggleLang = useCallback(() => setLangState((prev) => (prev === 'en' ? 'hi' : 'en')), []);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}