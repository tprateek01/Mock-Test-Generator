// InstallAppButton.jsx
// Extracted from MockTestApp.jsx (unchanged logic) so SiteHeader can be
// used from both the exam-flow app shell and the new marketing pages.
import React, { useState, useEffect } from 'react';
import { Download, Share, SquarePlus, Check } from 'lucide-react';

function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standaloneMedia = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    const iosStandalone = window.navigator.standalone === true;
    setIsStandalone(!!(standaloneMedia || iosStandalone));

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  return { deferredPrompt, isStandalone, clearPrompt: () => setDeferredPrompt(null) };
}

export default function InstallAppButton() {
  const { deferredPrompt, isStandalone, clearPrompt } = useInstallPrompt();
  const [showIosHelp, setShowIosHelp] = useState(false);

  const ua = window.navigator.userAgent || '';
  const isIos = /iphone|ipad|ipod/i.test(ua) && !window.MSStream;

  // Already installed — nothing to offer.
  if (isStandalone) return null;
  // Not iOS and the browser hasn't (or won't) fire beforeinstallprompt
  // (e.g. desktop Firefox, or it just hasn't fired yet) — hide rather
  // than show a button that does nothing.
  if (!isIos && !deferredPrompt) return null;

  const handleClick = async () => {
    if (isIos) {
      setShowIosHelp(true);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    clearPrompt();
  };

  return (
    <>
      <button type="button" className="mt-btn mt-btn-brass mt-install-btn" onClick={handleClick}>
        <Download size={16} />
        <span className="mt-install-btn-label">Download App</span>
      </button>

      {showIosHelp && (
        <div className="mt-ios-help-overlay" onClick={() => setShowIosHelp(false)}>
          <div className="mt-ios-help-card" onClick={(e) => e.stopPropagation()}>
            <div className="mt-ios-help-title">Install Mocksy on your device</div>
            <div className="mt-ios-help-sub">Adds an app icon to your Home Screen — opens full-screen, no browser bar.</div>
            <ol className="mt-ios-help-steps">
              <li>
                <span className="mt-ios-help-icon"><Share size={16} /></span>
                <span>Tap the <strong>Share</strong> icon in Safari's toolbar.</span>
              </li>
              <li>
                <span className="mt-ios-help-icon"><SquarePlus size={16} /></span>
                <span>Scroll down and tap <strong>Add to Home Screen</strong>.</span>
              </li>
              <li>
                <span className="mt-ios-help-icon"><Check size={16} /></span>
                <span>Tap <strong>Add</strong> — Mocksy now opens like any other app.</span>
              </li>
            </ol>
            <button type="button" className="mt-btn mt-btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowIosHelp(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
