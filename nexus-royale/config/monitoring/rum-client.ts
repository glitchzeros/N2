export function initRUM(): void {
  if (typeof window === 'undefined') return;
  // Basic CLS-like and FPS sampling placeholder
  let last = performance.now();
  let frames = 0;
  function tick() {
    frames++;
    const now = performance.now();
    if (now - last > 5000) {
      const fps = frames * 1000 / (now - last);
      // eslint-disable-next-line no-console
      console.log('[RUM] fps(avg5s)=', Math.round(fps));
      frames = 0; last = now;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}