import { eventBus } from '@/engine/core/events/EventBus';
import type { AnalyticsSink } from '@/config/monitoring/analytics';
import { ConsoleSink } from '@/config/monitoring/analytics';

let unsubscribers: Array<() => void> = [];
let initialized = false;

export function initTelemetry(sink: AnalyticsSink = new ConsoleSink()): void {
  if (initialized) return;
  initialized = true;
  unsubscribers = [
    eventBus.on('muzzle', (p: any) => sink.record('fire', { ...p })),
    eventBus.on('hit', (p: any) => sink.record('hit', { ...p })),
    eventBus.on('kill', (p: any) => sink.record('kill', { ...p })),
    eventBus.on('shake', (p: any) => sink.record('shake', { ...p })),
  ];
}

export function disposeTelemetry(): void {
  for (const u of unsubscribers) u();
  unsubscribers = [];
  initialized = false;
}