import { applyBaseTheme, setColorBlindMode } from '@/ui/themes/GlitchwaveTheme';

export class OptionsPanel {
  private container: HTMLElement | null = null;

  mount(parent: HTMLElement = document.body): void {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.bottom = '12px';
    el.style.left = '12px';
    el.style.padding = '8px 10px';
    el.style.background = 'rgba(10,10,16,0.4)';
    el.style.border = '1px solid #00f5d4';
    el.style.borderRadius = '6px';
    el.style.color = '#f0f0f0';
    el.style.fontFamily = "'Roboto Mono', monospace";
    el.style.fontSize = '12px';

    const hc = document.createElement('label');
    const hcCb = document.createElement('input'); hcCb.type = 'checkbox'; hcCb.style.marginRight = '6px';
    hc.append(hcCb, document.createTextNode('High Contrast'));

    const cb = document.createElement('label');
    cb.style.marginLeft = '12px';
    const sel = document.createElement('select');
    sel.innerHTML = `<option value="none">Normal</option>
      <option value="protanopia">Protanopia</option>
      <option value="deuteranopia">Deuteranopia</option>
      <option value="tritanopia">Tritanopia</option>`;
    cb.append(document.createTextNode(' Colorblind: '), sel);

    el.append(hc, cb);
    parent.appendChild(el);
    this.container = el;

    applyBaseTheme(false);
    setColorBlindMode('none');

    hcCb.addEventListener('change', () => applyBaseTheme(hcCb.checked));
    sel.addEventListener('change', () => setColorBlindMode(sel.value as any));
  }

  unmount(): void {
    if (this.container?.parentElement) this.container.parentElement.removeChild(this.container);
    this.container = null;
  }
}