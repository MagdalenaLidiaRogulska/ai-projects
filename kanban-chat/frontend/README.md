# Forma Kanban

From `frontend`, run `npm install` and `npm run dev`, then open http://localhost:3000.

One board, five renameable columns. Add, edit, delete, and drag cards with a pointer, touch, or keyboard (Space, arrows, Space to drop; Escape to cancel). Changes reset on refresh.

Checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
Browser tests: `npx playwright install`, then `npm run test:e2e`.

On macOS 27, bundled Firefox has a launch issue. Run local browser checks with `npm run test:e2e -- --project=chromium --project=webkit --project=mobile`; run Firefox on Linux. All four profiles were verified; see `../PLAN.md`.
