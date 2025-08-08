# Local Development

Prerequisites: Node.js 20+

- Install dependencies: `npm install`
- Run dev server: `npm run dev`
- Run unit tests: `npm test`
- Type check: `npm run typecheck`
- Build production bundle: `npm run build`

Optional:
- Run with Playwright (e2e, TBD): `npx playwright test` (set up server beforehand)
- CI runs on every push via GitHub Actions.

Tips:
- Code lives under `src/` split by engine/game/ui/platform.
- Add unit tests under `tests/unit/` matching the feature area.
- Avoid long-running commands in CI; ensure tests run headless.