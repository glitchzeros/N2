export type PredictedState = { tick: number; entities: Map<number, Record<string, unknown>> };
export type AuthoritativeState = { tick: number; entities: Map<number, Record<string, unknown>> };

export class StateReconciler {
  private lastAckTick = 0;

  acknowledge(tick: number): void { this.lastAckTick = Math.max(this.lastAckTick, tick); }
  getLastAck(): number { return this.lastAckTick; }

  reconcile(predicted: PredictedState, server: AuthoritativeState): PredictedState {
    if (server.tick <= predicted.tick) {
      // Replace entities with authoritative values for known ids
      for (const [id, comps] of server.entities.entries()) {
        predicted.entities.set(id, comps);
      }
      return predicted;
    }
    // If server ahead, adopt server snapshot
    return { tick: server.tick, entities: new Map(server.entities) };
  }
}