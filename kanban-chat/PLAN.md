# Kanban MVP implementation checklist

## 1. Scaffold
- [x] Next.js client board in frontend with TypeScript, Tailwind, npm lockfile, and ESLint.
- [x] Ignore generated output, dependencies, local environment files, and test reports.
- [x] Configure Vitest, React Testing Library, and Playwright; document commands.

## 2. Visual design
- [x] Dark navy layout, prescribed accents, refined cards, and responsive horizontal board.
- [x] One board, five fixed columns, twelve realistic sample cards.
- [x] Focus, hover, empty-column, drag states, and reduced-motion support.

## 3. Behavior
- [x] In-memory reducer; add, edit, confirm deletion, rename columns.
- [x] Pointer and keyboard reordering and cross-column moves, including empty columns.
- [x] Accessible editor with validation, cancel, focus containment and restoration.
- [x] Refresh resets all changes; no extra product features.

## 4. Verification and handoff
- [x] Reducer and component tests pass.
- [x] Production build, lint, and type checking pass.
- [x] Desktop and mobile screenshots inspected.
- [x] Chromium, Firefox, WebKit, and mobile touch integration tests pass (29 cases; seven input-specific cases skipped).
- [x] Final checks pass and development server is running at http://localhost:3000.

Build uses Next.js's supported Webpack path because Turbopack's CSS worker cannot bind a port in this environment.

Validation: 13 unit/component tests; 29 browser cases across Chromium, WebKit, Firefox, and mobile touch. Runtime and console error checks pass. Firefox was verified against the production build in the official Playwright Linux container because of macOS 27 launch issue https://github.com/microsoft/playwright/issues/42768.

Dependency audit: no production advisories. Five high-severity development-tool advisories remain in the Next.js ESLint dependency chain (braces); no compatible patched release is currently available.

## Follow-up: direct card deletion
- [x] Visible trash button on each card opens the existing confirmation directly.
- [x] Keep card closes the confirmation; deletion removes only the selected card.
- [x] Focus restoration verified on Chromium, WebKit, and mobile; drag regression checks pass.
- [x] Lint, type checking, 13 unit/component tests, and production build pass.

## Follow-up: card title edit button
- [x] Pencil beside each title opens the same editor as clicking the title/card.
- [x] Editing and focus restoration verified in Chromium, WebKit, and mobile; dragging still works.
- [x] Lint, type checking, and production build pass.
