import { AudioContextManager } from '@/engine/audio/mixer/AudioContextManager';

export class AudioOptionsPanel {
  private container: HTMLElement | null = null;

  mount(parent: HTMLElement = document.body): void {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.bottom = '12px';
    el.style.left = '50%';
    el.style.transform = 'translateX(-50%)';
    el.style.padding = '8px 10px';
    el.style.background = 'rgba(10,10,16,0.4)';
    el.style.border = '1px solid #00f5d4';
    el.style.borderRadius = '6px';
    el.style.color = '#f0f0f0';
    el.style.fontFamily = "'Roboto Mono', monospace";
    el.style.fontSize = '12px';

    const mkSlider = (label: string, on: (v: number) => void) => {
      const wrap = document.createElement('label');
      wrap.style.marginRight = '12px';
      wrap.textContent = label + ' ';
      const input = document.createElement('input');
      input.type = 'range'; input.min = '0'; input.max = '1'; input.step = '0.01'; input.value = '0.8';
      input.oninput = () => on(parseFloat(input.value));
      wrap.appendChild(input);
      return wrap;
    };

    const master = mkSlider('Master', (v) => AudioContextManager.instance.setMasterVolume(v));
    const sfx = mkSlider('SFX', (v) => AudioContextManager.instance.setSfxVolume(v));

    el.append(master, sfx);
    parent.appendChild(el);
    this.container = el;
  }

  unmount(): void {
    if (this.container?.parentElement) this.container.parentElement.removeChild(this.container);
    this.container = null;
  }
}