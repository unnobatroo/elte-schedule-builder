# Contributing

Thanks for helping improve ELTE Schedule Builder. The application is used by
students during registration, so small, behavior-preserving changes are easier
to review and safer to release.

## Before starting

1. Search existing issues and pull requests for related work.
2. For a bug, include a minimal reproduction. Prefer `DEMO-1` through `DEMO-6`
   when the problem can be reproduced without live Tanrend data.
3. For a larger change, describe the user outcome, scope, compatibility risks,
   and acceptance criteria. You can use
   [docs/change-plan-template.md](docs/change-plan-template.md).
4. Read [AGENTS.md](AGENTS.md) for the current architecture, safety boundaries,
   and verification requirements. Those rules are canonical for both human and
   automated contributors.

## Set up the project

Use Node.js 20.17 or newer and npm.

```bash
npm ci
npx playwright install chromium
```

Run the frontend and API in separate terminals:

```bash
npm run dev
npm start
```

Do not add another lockfile. If dependencies change, use npm and include the
resulting `package-lock.json` update.

## Make a change

- Keep each change focused and avoid unrelated cleanup.
- Put reusable schedule parsing, event, date, conflict, and sharing logic in
  `src/utils/` rather than duplicating it in components or tests.
- Use Svelte 5 runes and callback props as described in `AGENTS.md`.
- Preserve old `localStorage` data and `/import/<base64>` links unless the
  change includes a migration and compatibility tests.
- Treat schedule dates as local calendar dates; do not introduce UTC conversion
  through `toISOString()`.
- Preserve the Tanrend request queue, delay, and SQLite cache.
- Never commit credentials, local configuration, cache databases, `coverage/`,
  `dist/`, Playwright results, or other generated output.

## Add evidence

Add or strengthen a regression test before changing risky schedule behavior.
Tests must import production utilities rather than reproducing their
implementation.

Run focused tests while working. Before opening a pull request, run:

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

For backend changes, verify that `/api/subject/DEMO-1` returns HTTP 200 and demo
course rows.

## Open a pull request

- Explain the user-visible outcome and why the change is needed.
- Identify compatibility or migration concerns.
- List the exact verification performed.
- Add screenshots for visible UI changes.
- Call out anything intentionally deferred or requiring a repository setting.
- Keep commits reviewable; separate unrelated documentation, tooling, and
  behavior changes.

If another contributor needs to continue the work, complete the handoff section
in the change-plan template with the current state, decisions, verification, and
remaining steps.
