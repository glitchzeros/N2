import { disposeTelemetry, initTelemetry } from '@/game/meta/analytics/Telemetry';
import { ConsoleSink } from '@/config/monitoring/analytics';
import { BufferedSink } from '@/config/monitoring/analytics-buffer';

export class DebugPanel {
  private container: HTMLElement | null = null;

  mount(parent: HTMLElement = document.body): void {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.bottom = '12px';
    el.style.right = '50%';
    el.style.transform = 'translateX(50%)';
    el.style.padding = '8px 10px';
    el.style.background = 'rgba(10,10,16,0.4)';
    el.style.border = '1px solid #00f5d4';
    el.style.borderRadius = '6px';
    el.style.color = '#f0f0f0';
    el.style.fontFamily = "'Roboto Mono', monospace";
    el.style.fontSize = '12px';

    const label = document.createElement('label');
    label.textContent = 'Telemetry: Buffered';
    label.style.marginRight = '12px';
    const toggle = document.createElement('input');
    toggle.type = 'checkbox'; toggle.checked = true; toggle.style.marginLeft = '6px';
    label.appendChild(toggle);

    el.appendChild(label);
    parent.appendChild(el);
    this.container = el;

    toggle.onchange = () => {
      disposeTelemetry();
      if (toggle.checked) initTelemetry(new BufferedSink(new ConsoleSink(), 5000));
      else initTelemetry(new ConsoleSink());
      // eslint-disable-next-line no-console
      console.log('[Debug] Telemetry sink switched:', toggle.checked ? 'buffered' : 'console');
    };
  }

  unmount(): void {
    if (this.container?.parentElement) this.container.parentElement.removeChild(this.container);
    this.container = null;
  }
}