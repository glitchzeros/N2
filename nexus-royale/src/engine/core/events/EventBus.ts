export type EventHandler<T = unknown> = (payload: T) => void;

export class EventBus {
  private map = new Map<string, Set<EventHandler<any>>>();

  on<T>(event: string, handler: EventHandler<T>): () => void {
    let set = this.map.get(event);
    if (!set) { set = new Set(); this.map.set(event, set); }
    set.add(handler as EventHandler<any>);
    return () => this.off(event, handler);
  }

  off<T>(event: string, handler: EventHandler<T>): void {
    const set = this.map.get(event);
    if (!set) return;
    set.delete(handler as EventHandler<any>);
    if (set.size === 0) this.map.delete(event);
  }

  emit<T>(event: string, payload: T): void {
    const set = this.map.get(event);
    if (!set) return;
    for (const h of set) h(payload);
  }
}

export const eventBus = new EventBus();