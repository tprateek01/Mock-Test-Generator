// InstallAppButton.jsx
// Extracted from MockTestApp.jsx (unchanged logic) so SiteHeader can be
// used from both the exam-flow app shell and the new marketing pages.
//
// Behaviour by platform:
//  - Android: downloads the real Mocksy .apk (see /public/downloads/mocksy.apk)
//    and shows a short "how to install" overlay, since sideloaded APKs need
//    the user to allow installs from this source.
//  - iOS: APKs cannot run on iOS at all (Apple does not allow it), so we keep
//    the existing Add-to-Home-Screen walkthrough — that's the closest thing
//    to a "real app" iOS supports.
//  - Desktop / other: keep the existing native PWA install prompt.
//
// To ship the real APK: build it with PWABuilder (pwabuilder.com) or
// Bubblewrap against the live site, then drop the file at
// public/downloads/mocksy.apk (see public/downloads/README.md).
import React, { useState, useEffect } from 'react';
import { Download, Share, SquarePlus, Check, Settings, FolderOpen } from 'lucide-react';

const APK_PATH = '/downloads/mocksy.apk';
const APK_VERSION_PATH = '/downloads/mocksy-version.json';

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

// Checks that an APK has actually been published (not just the placeholder
// left in the repo) before we let Android users try to download it.
function useApkAvailability(isAndroid) {
  const [available, setAvailable] = useState(null); // null = unknown/checking

  useEffect(() => {
    if (!isAndroid) return;
    let cancelled = false;
    fetch(APK_VERSION_PATH, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setAvailable(!!(data && data.published));
      })
      .catch(() => {
        if (!cancelled) setAvailable(false);
      });
    return () => { cancelled = true; };
  }, [isAndroid]);

  return available;
}

export default function InstallAppButton() {
  const { deferredPrompt, isStandalone, clearPrompt } = useInstallPrompt();
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [showAndroidHelp, setShowAndroidHelp] = useState(false);

  const ua = window.navigator.userAgent || '';
  const isIos = /iphone|ipad|ipod/i.test(ua) && !window.MSStream;
  const isAndroid = /android/i.test(ua);
  const apkAvailable = useApkAvailability(isAndroid);

  // Already installed — nothing to offer.
  if (isStandalone) return null;
  // Android: only hide the button once we've confirmed there's no APK yet.
  // Non-Android desktop: hide if the browser hasn't (or won't) fire
  // beforeinstallprompt (e.g. desktop Firefox).
  if (isAndroid && apkAvailable === false) return null;
  if (!isIos && !isAndroid && !deferredPrompt) return null;

  const handleClick = async () => {
    if (isIos) {
      setShowIosHelp(true);
      return;
    }
    if (isAndroid) {
      // Trigger the real APK download.
      const link = document.createElement('a');
      link.href = APK_PATH;
      link.setAttribute('download', 'Mocksy.apk');
      document.body.appendChild(link);
      link.click();
      link.remove();
      setShowAndroidHelp(true);
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

      {showAndroidHelp && (
        <div className="mt-ios-help-overlay" onClick={() => setShowAndroidHelp(false)}>
          <div className="mt-ios-help-card" onClick={(e) => e.stopPropagation()}>
            <div className="mt-ios-help-title">Installing Mocksy.apk</div>
            <div className="mt-ios-help-sub">Your download has started. Since this isn't from the Play Store, Android needs one-time permission to install it.</div>
            <ol className="mt-ios-help-steps">
              <li>
                <span className="mt-ios-help-icon"><FolderOpen size={16} /></span>
                <span>Open <strong>Mocksy.apk</strong> from your notification shade or Downloads folder.</span>
              </li>
              <li>
                <span className="mt-ios-help-icon"><Settings size={16} /></span>
                <span>If prompted, tap <strong>Settings</strong> and allow <strong>Install unknown apps</strong> for this browser — this only appears the first time.</span>
              </li>
              <li>
                <span className="mt-ios-help-icon"><Check size={16} /></span>
                <span>Tap <strong>Install</strong>, then <strong>Open</strong> — Mocksy now runs like any other app on your phone.</span>
              </li>
            </ol>
            <button type="button" className="mt-btn mt-btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowAndroidHelp(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}