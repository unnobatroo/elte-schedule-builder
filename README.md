# ELTE Schedule Builder

A small schedule planner for ELTE students. Paste subject codes, compare groups, spot conflicts, hide classes you do not want, and export the result to Google Calendar.

The useful bit is that you can plan ahead. Tanrend exposes the underlying course data through an endpoint before it shows that data in its regular frontend. This project uses that endpoint to make upcoming schedule information available earlier and in a much nicer format.

Requests go through a tiny Express API with a SQLite cache. Your schedule stays in your browser's local storage.

## Run it locally

You need Node.js 20.17 or newer.

```bash
npm ci
npm run dev
```

In another terminal, start the API:

```bash
npm start
```

Open <http://localhost:5173>. The API runs on port 3000 and Vite proxies `/api` requests to it.

Want Docker instead?

```bash
docker compose -f docker-compose.dev.yml up --build
```

## Useful commands

```bash
npm run check          # verify formatting and lint rules
npm test -- --run      # run the test suite once
npm run test:coverage  # run tests and enforce coverage thresholds
npm run test:e2e       # run the browser happy path
npm run build          # create a production build
npm start              # serve the API and built frontend
```

The browser happy-path test uses Chromium. Install it once, then run the test:

```bash
npx playwright install chromium
npm run test:e2e
```

The E2E command builds the production frontend, starts the Express server with
an in-memory SQLite cache, and exercises only the local `DEMO-*` data.

## How it is put together

- Svelte 5 + Vite frontend
- Schedule-X calendar
- Express API
- SQLite response cache
- Vitest tests

Contributions are welcome. Please keep behavior changes covered by tests—the app is used by real students during registration.

Using a coding agent? Start it from the repository root so it picks up [AGENTS.md](AGENTS.md), which contains the architecture notes, safety rules, and verification commands for this project.
