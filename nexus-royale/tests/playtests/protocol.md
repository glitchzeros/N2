# Playtest Protocol

Goal: Validate core loop (Drop → Loot → Fight → Survive) and performance.

1. Load app (repeat visit for cache).
   - Expect load <3s (cached), FPS ~60 on desktop.
2. Movement
   - WASD moves, mouse look. Verify acceleration/friction feel.
3. Combat
   - Fire pulse rifle. Expect SFX, muzzle flash, tracers, hit marker.
   - Hit bot: damage numbers appear; kill triggers kill feed.
4. Camera & terrain
   - Camera follows without clipping; flat-shaded terrain visible; culling doesn’t pop incorrectly.
5. HUD
   - HP updates and regen over time; FPS readout visible.
6. Options
   - Toggle high-contrast/colorblind; input reset; adjust volumes.
7. Stability
   - No console errors; no UI crashes. Observe RUM logs.

Record issues and suggestions. Rate game feel (0-10) and clarity of feedback.