import type { NetMessage } from '@/engine/net/protocol/Messages';

export function encodeMessage(msg: NetMessage): string {
  // Placeholder: JSON encoding (swap with MessagePack later)
  return JSON.stringify(msg);
}

export function decodeMessage(data: ArrayBuffer | string): NetMessage {
  const text = typeof data === 'string' ? data : new TextDecoder().decode(new Uint8Array(data));
  return JSON.parse(text) as NetMessage;
}