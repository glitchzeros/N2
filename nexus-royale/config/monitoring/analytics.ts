export interface AnalyticsSink {
  record(event: string, payload: unknown): void;
}

export class ConsoleSink implements AnalyticsSink {
  record(event: string, payload: unknown): void {
    // eslint-disable-next-line no-console
    console.log('[Analytics]', event, payload);
  }
}