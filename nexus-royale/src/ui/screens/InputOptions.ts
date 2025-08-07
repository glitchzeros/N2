import { input, defaultMapping, InputMapping } from '@/platform/web/Input';
import { createStorage } from '@/platform/web/Storage';

const STORAGE_KEY = 'nr.input.mapping.v1';

export class InputOptionsPanel {
  private container: HTMLElement | null = null;
  private storage = createStorage();

  mount(parent: HTMLElement = document.body): void {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.bottom = '12px';
    el.style.right = '12px';
    el.style.padding = '8px 10px';
    el.style.background = 'rgba(10,10,16,0.4)';
    el.style.border = '1px solid #00f5d4';
    el.style.borderRadius = '6px';
    el.style.color = '#f0f0f0';
    el.style.fontFamily = "'Roboto Mono', monospace";
    el.style.fontSize = '12px';

    const title = document.createElement('div');
    title.textContent = 'Input Mapping';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '6px';

    const summary = document.createElement('div');
    summary.style.whiteSpace = 'pre';

    const reset = document.createElement('button');
    reset.textContent = 'Reset Defaults';
    reset.style.marginTop = '6px';

    el.append(title, summary, reset);
    parent.appendChild(el);
    this.container = el;

    const saved = this.storage.get<InputMapping | null>(STORAGE_KEY, null);
    if (saved) input.setMapping(saved);

    const render = () => {
      const m = input.getMapping();
      summary.textContent = `Left: ${m.left.join(', ')}\nRight: ${m.right.join(', ')}\nFwd: ${m.forward.join(', ')}\nBack: ${m.backward.join(', ')}\nFire: ${m.fire.join(', ')}`;
    };

    render();

    reset.onclick = () => {
      input.setMapping(defaultMapping);
      this.storage.set(STORAGE_KEY, defaultMapping);
      render();
    };
  }

  unmount(): void {
    if (this.container?.parentElement) this.container.parentElement.removeChild(this.container);
    this.container = null;
  }
}