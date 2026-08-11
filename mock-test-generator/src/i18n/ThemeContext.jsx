// ThemeContext.jsx
// Single source of truth for the site-wide light/dark theme, mirroring how
// LanguageContext.jsx handles EN/HI. Provided once at the app root (see
// App.js) so the toggle in SiteHeader affects every page, and the choice
// persists across navigation and reloads via localStorage.
//
// Default behaviour: until the user explicitly picks a theme, Mocksy
// follows the OS-level `prefers-color-scheme` setting and keeps following
// it live (e.g. if the OS switches to dark mode at sunset, the site follows
// without a reload). The moment the user taps the toggle, that becomes an
// explicit "mode" (light or dark) which is remembered and no longer moves
// with the OS setting — same override behaviour as a normal dark-mode
// toggle. There's no "auto" indicator in the UI beyond that: unset ==
// system, set == the user's explicit choice.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'mocksy_theme'; // 'light' | 'dark' | absent (= follow system)
const ThemeContext = createContext({ theme: 'light', mode: null, setMode: () => {}, toggleTheme: () => {} });

function systemPrefersDark() {
  try {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

function readStoredMode() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === 'dark' || saved === 'light' ? saved : null;
  } catch {
    // localStorage can throw in some privacy modes — treat as "no override".
    return null;
  }
}

export function ThemeProvider({ children }) {
  // mode = explicit user choice ('light' | 'dark'), or null to follow the OS.
  const [mode, setModeState] = useState(readStoredMode);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  // Keep systemDark in sync with the OS while no explicit override is set.
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setSystemDark(e.matches);
    // Older Safari only supports addListener/removeListener.
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else if (mql.addListener) mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else if (mql.removeListener) mql.removeListener(onChange);
    };
  }, []);

  const theme = mode || (systemDark ? 'dark' : 'light');

  useEffect(() => {
    // GlobalStyles.jsx keys every dark-mode override off this attribute.
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setMode = useCallback((next) => {
    const normalized = next === 'dark' ? 'dark' : next === 'light' ? 'light' : null;
    setModeState(normalized);
    try {
      if (normalized) window.localStorage.setItem(STORAGE_KEY, normalized);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
  }, []);

  // Toggling always sets an explicit choice — the opposite of whatever is
  // currently showing (system-resolved or not).
  const toggleTheme = useCallback(() => {
    setMode(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setMode]);

  const value = useMemo(() => ({ theme, mode, setMode, toggleTheme }), [theme, mode, setMode, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}