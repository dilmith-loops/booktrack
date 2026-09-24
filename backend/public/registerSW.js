if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const isBooktrack = window.location.pathname.startsWith('/booktrack');
    const swPath = isBooktrack ? '/booktrack/sw.js' : '/sw.js';
    const swScope = isBooktrack ? '/booktrack/' : '/';
    navigator.serviceWorker.register(swPath, { scope: swScope }).catch((err) => {
      console.warn('PWA ServiceWorker registration skipped:', err);
    });
  });
}