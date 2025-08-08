import { WebSocketClient } from '@/engine/net/transport/WebSocketClient';
import type { StateDeltaMessage, NetMessage } from '@/engine/net/protocol/Messages';
import { encodeMessage, decodeMessage } from '@/engine/net/protocol/Codec';
import { StateReconciler } from '@/engine/net/sync/StateReconciler';

export type InputProvider = () => { moveX: number; moveY: number; lookX: number; lookY: number; fire: boolean };

export class ClientSync {
  private seq = 0;
  constructor(private ws: WebSocketClient, private reconciler: StateReconciler) {}

  start(onDelta?: (delta: StateDeltaMessage) => void): void {
    this.ws.on({
      open: () => {},
      message: (data) => {
        const msg = decodeMessage(data) as NetMessage;
        if (msg.type === 'state_delta') {
          this.reconciler.acknowledge(msg.tick);
          onDelta?.(msg);
        }
      }
    });
    this.ws.connect();
  }

  sendInput(provide: InputProvider): void {
    const s = provide();
    const payload = encodeMessage({ type: 'input', seq: ++this.seq, ...s });
    this.ws.send(payload);
  }
}