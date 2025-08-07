export function initErrorTracking(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('error', (e) => {
    // eslint-disable-next-line no-console
    console.warn('[Error]', e.message, e.error);
  });
  window.addEventListener('unhandledrejection', (e) => {
    // eslint-disable-next-line no-console
    console.warn('[UnhandledRejection]', e.reason);
  });
}