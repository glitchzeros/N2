export type InputMessage = {
  type: 'input';
  seq: number;
  moveX: number;
  moveY: number;
  lookX: number;
  lookY: number;
  fire: boolean;
};

export type StateDeltaMessage = {
  type: 'state_delta';
  tick: number;
  entities: Array<{ id: number; comps: Record<string, unknown> }>;
};

export type ServerEventMessage = {
  type: 'server_event';
  event: 'spawn' | 'despawn' | 'hit' | 'kill';
  payload: unknown;
};

export type NetMessage = InputMessage | StateDeltaMessage | ServerEventMessage;