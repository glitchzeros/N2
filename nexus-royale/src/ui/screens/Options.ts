import { applyBaseTheme, setColorBlindMode } from '@/ui/themes/GlitchwaveTheme';
import { createStorage } from '@/platform/web/Storage';
import { setReduceMotion } from '@/config/experience/Settings';
import { setShowTracers } from '@/config/experience/Settings';

const STORAGE_KEY = 'nr.accessibility.v1';

type SavedOpts = { highContrast: boolean; colorBlind: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'; reduceMotion: boolean; showTracers: boolean };

export class OptionsPanel {
  private container: HTMLElement | null = null;
  private storage = createStorage();

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

    const saved = this.storage.get<SavedOpts | null>(STORAGE_KEY, null) ?? { highContrast: false, colorBlind: 'none', reduceMotion: false, showTracers: true };

    const hc = document.createElement('label');
    const hcCb = document.createElement('input'); hcCb.type = 'checkbox'; hcCb.style.marginRight = '6px'; hcCb.checked = saved.highContrast;
    hc.append(hcCb, document.createTextNode('High Contrast'));

    const cb = document.createElement('label');
    cb.style.marginLeft = '12px';
    const sel = document.createElement('select');
    sel.innerHTML = `<option value="none">Normal</option>
      <option value="protanopia">Protanopia</option>
      <option value="deuteranopia">Deuteranopia</option>
      <option value="tritanopia">Tritanopia</option>`;
    sel.value = saved.colorBlind;
    cb.append(document.createTextNode(' Colorblind: '), sel);

    const rm = document.createElement('label');
    rm.style.marginLeft = '12px';
    const rmCb = document.createElement('input'); rmCb.type = 'checkbox'; rmCb.style.marginRight = '6px'; rmCb.checked = saved.reduceMotion;
    rm.append(rmCb, document.createTextNode('Reduce Motion'));

    const tr = document.createElement('label');
    tr.style.marginLeft = '12px';
    const trCb = document.createElement('input'); trCb.type = 'checkbox'; trCb.style.marginRight = '6px'; trCb.checked = saved.showTracers;
    tr.append(trCb, document.createTextNode('Show Tracers'));

    el.append(hc, cb, rm, tr);
    parent.appendChild(el);
    this.container = el;

    applyBaseTheme(saved.highContrast);
    setColorBlindMode(saved.colorBlind);
    setReduceMotion(saved.reduceMotion);
    setShowTracers(saved.showTracers);

    const persist = () => this.storage.set(STORAGE_KEY, { highContrast: hcCb.checked, colorBlind: sel.value as SavedOpts['colorBlind'], reduceMotion: rmCb.checked, showTracers: trCb.checked });

    hcCb.addEventListener('change', () => { applyBaseTheme(hcCb.checked); persist(); });
    sel.addEventListener('change', () => { setColorBlindMode(sel.value as SavedOpts['colorBlind']); persist(); });
    rmCb.addEventListener('change', () => { setReduceMotion(rmCb.checked); persist(); });
    trCb.addEventListener('change', () => { setShowTracers(trCb.checked); persist(); });
  }

  unmount(): void {
    if (this.container?.parentElement) this.container.parentElement.removeChild(this.container);
    this.container = null;
  }
}