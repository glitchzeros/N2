import { eventBus } from '@/engine/core/events/EventBus';
import type { AnalyticsSink } from '@/config/monitoring/analytics';
import { ConsoleSink } from '@/config/monitoring/analytics';
import { BufferedSink } from '@/config/monitoring/analytics-buffer';

let unsubscribers: Array<() => void> = [];
let initialized = false;

export function initTelemetry(sink?: AnalyticsSink): void {
  if (initialized) return;
  initialized = true;
  const finalSink = sink ?? new BufferedSink(new ConsoleSink(), 5000);
  unsubscribers = [
    eventBus.on('muzzle', (p: any) => finalSink.record('fire', { ...p })),
    eventBus.on('hit', (p: any) => finalSink.record('hit', { ...p })),
    eventBus.on('kill', (p: any) => finalSink.record('kill', { ...p })),
    eventBus.on('shake', (p: any) => finalSink.record('shake', { ...p })),
  ];
}

export function disposeTelemetry(): void {
  for (const u of unsubscribers) u();
  unsubscribers = [];
  initialized = false;
}