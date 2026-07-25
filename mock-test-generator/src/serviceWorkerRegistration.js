// Registers public/sw.js so the app can be installed as a PWA and works
// offline once installed. Safe no-op in browsers without service worker
// support, and in dev mode we skip it so `npm start` isn't caching stale
// bundles while you're editing.

export function register() {
  if (process.env.NODE_ENV !== 'production') return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    const swUrl = `${process.env.PUBLIC_URL}/sw.js`;
    navigator.serviceWorker.register(swUrl).catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  });
}

export function unregister() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.ready.then((registration) => {
    registration.unregister();
  }).catch(() => {});
}