type ColorBlindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';

let styleEl: HTMLStyleElement | null = null;

function ensureStyle(): HTMLStyleElement {
  if (styleEl) return styleEl;
  styleEl = document.createElement('style');
  document.head.appendChild(styleEl);
  return styleEl;
}

export function applyBaseTheme(highContrast = false): void {
  const s = ensureStyle();
  s.textContent = `:root{
    --bg: #0a0a10;
    --bg2: #1a1a2e;
    --accent: #e94560;
    --cyan: #00f5d4;
    --text: #f0f0f0;
  }
  body{ background: var(--bg); color: var(--text); }
  ${highContrast ? 'body{ filter: none !important; } :root{ --bg:#000; --bg2:#000; --accent:#fff; --cyan:#fff; --text:#fff; }' : ''}`;
}

export function setColorBlindMode(mode: ColorBlindMode): void {
  const el = document.documentElement;
  el.setAttribute('data-colorblind', mode);
  const filter =
    mode === 'protanopia' ? 'grayscale(0.2) contrast(1.1)' :
    mode === 'deuteranopia' ? 'grayscale(0.2) contrast(1.05) sepia(0.1)' :
    mode === 'tritanopia' ? 'grayscale(0.2) hue-rotate(20deg)' : 'none';
  document.body.style.filter = filter;
}