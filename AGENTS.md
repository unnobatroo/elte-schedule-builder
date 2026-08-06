# AGENTS.md

## Project priorities

- This is a production schedule planner used by ELTE students. Preserve existing behavior unless the task explicitly changes it.
- Prefer small, reviewable changes. Add or strengthen regression tests before changing risky schedule behavior.
- Keep the project straightforward for student contributors; avoid unnecessary abstractions and dependencies.

## Architecture

- `src/` is a Svelte 5 single-page application built with Vite.
- `src/App.svelte` owns the main saved schedule and UI state.
- `src/components/ScheduleWorkspace.svelte` owns sharing feedback and export
  dialog coordination; `AppHeader.svelte` and `AppFooter.svelte` own their
  presentation and styles.
- `src/routes/Tanrend.svelte` searches Tanrend data and adds selected classes to the saved schedule.
- `src/utils/schedule.js` contains shared parsing, date, event, conflict, and schedule-sharing logic.
- `server.js` is an Express proxy. It fetches Tanrend data, throttles upstream requests, and caches responses in SQLite.
- `tests/` uses Vitest and Testing Library. Tests must import production utilities instead of copying their implementations.
- The in-app FAQ is embedded in `src/components/FAQ.svelte`; it does not read `README.md`.
- `docs/decisions.md` records the rationale and consequences for compatibility-sensitive architecture choices.

## Setup and commands

Use Node.js 24.15 through 24.x and npm 11.17 or newer. Do not add another lockfile.

```bash
npm install --global npm@11.17.0
npm ci
npm run dev
npm start
npm run check
npm test -- --run
npm run test:coverage
npm run build
npx playwright install chromium
npm run test:e2e
```

The frontend runs on port 5173 and proxies `/api` to the backend on port 3000. `DEMO-1` through `DEMO-6` can exercise the app without depending on live Tanrend results.

## Working rules

- Inspect `git status` before editing and preserve unrelated contributor changes.
- Use [docs/task-handoff-template.md](docs/task-handoff-template.md) when work is
  paused, transferred, or resumed across agent sessions.
- Reuse or extend `src/utils/schedule.js` when logic is needed in multiple components. Do not maintain parallel implementations in components or tests.
- Keep saved schedule data backward-compatible. Existing users may have older objects in `localStorage` without newly added fields.
- Preserve the `/import/<base64>` sharing format unless a migration and compatibility test are included.
- Treat dates as local calendar dates. Do not introduce UTC conversion through `toISOString()` into schedule or Google Calendar logic.
- Keep the Tanrend request queue and delay. Do not turn searches into unthrottled parallel upstream requests.
- Never commit cache databases, generated coverage, `dist`, credentials, analytics IDs, or personal configuration.
- Use npm for dependency changes and commit the resulting `package-lock.json` update.

## Svelte conventions

- Use Svelte 5 runes: `$state` for mutable component state, `$derived` for computed state, `$effect` only for side effects, and `$props()` for props.
- Use callback props for component communication. Do not introduce `createEventDispatcher` or legacy `on:event` handlers.
- Return cleanup functions for listeners and other resources created by `$effect` or `onMount`.
- Prefer semantic HTML and keep `npm run build` free of Svelte accessibility warnings.
- Avoid moving ordinary pure logic into component state; put reusable pure logic in utilities and test it directly.

## Verification

Run focused tests while working. Before handing off any code change, run:

```bash
npm run check
npm test -- --run
npm run build
npm run test:e2e
git diff --check
```

For dependency changes, also run:

```bash
npm audit --omit=dev
```

For backend changes, start the server and verify that `/api/subject/DEMO-1` returns HTTP 200 and contains demo course rows.

## Code review rules

Flag changes that:

- alter enabled/disabled class selection, conflict detection, import/export, or local-storage behavior without regression coverage;
- duplicate parsing or event-building logic already present in `src/utils/schedule.js`;
- break old saved schedules or shared URLs;
- remove Tanrend throttling or bypass the SQLite cache unintentionally;
- add Svelte build warnings, inaccessible interactions, debug logging, secrets, or generated files;
- update tests to reproduce an implementation instead of testing the production implementation.

Do not commit, push, publish, or open a pull request unless the contributor explicitly asks for it.
