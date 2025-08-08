export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('/sw.js')
    .then(reg => {
      // eslint-disable-next-line no-console
      console.log('[SW] registered', reg.scope);
      reg.addEventListener('updatefound', () => {
        const installing = reg.installing;
        if (installing) installing.addEventListener('statechange', () => {
          // eslint-disable-next-line no-console
          console.log('[SW] state', installing.state);
        });
      });
    })
    .catch(err => {
      // eslint-disable-next-line no-console
      console.warn('[SW] register failed', err);
    });
}