# Networking Sync (Client Stubs)

This project includes client-side stubs to prepare for deterministic lockstep with rollback.

- Messages: `src/engine/net/protocol/Messages.ts`
- Codec: `src/engine/net/protocol/Codec.ts` (JSON for now; swap with MessagePack)
- Transport: `src/engine/net/transport/WebSocketClient.ts`
- Reconciliation: `src/engine/net/sync/StateReconciler.ts`
- Client loop: `src/engine/net/sync/ClientSync.ts`

To extend:
1. Replace `Codec` with MessagePack and add schema validation.
2. Build a server that emits `state_delta` messages (authoritative state) and consumes `input` messages.
3. Wire `ClientSync.sendInput` to the actual input provider (e.g., `Input.snapshot`) and call per frame or on change.
4. Use `StateReconciler` to merge server state into the client ECS.