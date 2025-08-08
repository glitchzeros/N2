# Nexus Royale

A web-native battle royale MVP with an ECS architecture, Three.js renderer, procedural terrain, basic AI, simple networking stubs, and performance-focused systems.

## Quick start

- Install: `npm install`
- Dev server: `npm run dev`
- Type check: `npm run typecheck`
- Tests: `npm test`
- Build: `npm run build`

## Feature flags (URL params)

- `?noVFX=1` disable screen shake and muzzle/tracers
- `?noHUD=1` hide HUD overlays (for perf testing)
- `?bots=N` spawn N bots (default 5)

## Features

- ECS core with systems for input, movement, weapons, AI, health regen
- Three.js renderer with flat-shaded neon style, camera follow, culling
- Procedural terrain generation (value-noise)
- Audio SFX (pulse rifle) and UI feedback (HUD, hit marker, kill feed)
- Screen shake, muzzle flash, tracers
- Accessibility: high-contrast and colorblind modes; input remapping
- PWA manifest and service worker
- Telemetry (buffered console sink), RUM and error tracking stubs
- CI workflow for typecheck, tests, build

## Structure

See `src/` for engine, game, ui, and platform layers. Tests live in `tests/`.

## License

MIT