# ELTE Schedule Builder 🎓

A small schedule planner for ELTE students. Paste subject codes, compare groups, spot conflicts, hide classes you do not want, and export the result to Google Calendar.

[Open the planner](https://schedule.w04m1.dev) · [Read the user guide](docs/user-guide.md) · [Get help](SUPPORT.md) · [Contribute](CONTRIBUTING.md)

The useful bit is that you can plan ahead. Tanrend exposes the underlying course data through an endpoint before it shows that data in its regular frontend. This project uses that endpoint to make upcoming schedule information available earlier and in a much nicer format.

Requests go through a tiny Express API with a SQLite cache. Your schedule stays in your browser's local storage.

> [!IMPORTANT]
> This is an independent student project. It is not affiliated with, endorsed
> by, or operated by Eötvös Loránd University (ELTE). Tanrend remains the
> authoritative source for course information.

## Use the planner

You can paste Neptun subject codes into the Schedule Builder or search Tanrend
from the Search page and add a specific class. Use `DEMO-1` through `DEMO-6` to
try the complete workflow without depending on live Tanrend results.

The planner can compare groups, mark overlapping classes, hide individual
events, keep multiple local schedules, create share links, and open visible
events as Google Calendar templates. See the [user guide](docs/user-guide.md)
for the full workflow and limitations.

## Status and support

The application is actively maintained on a best-effort basis and is used by
students during registration. Course data can be incomplete or stale, so always
verify the final schedule in official ELTE systems.

Use [SUPPORT.md](SUPPORT.md) for help, bug reports, and feature requests. Report
security concerns privately through [SECURITY.md](SECURITY.md), not through a
public issue.

## Data and privacy

Your schedule stays in your browser unless you deliberately create a share link
or open a Google Calendar export.

- No account is required.
- Subject codes are sent to this application's Express API, which requests
  Tanrend and caches responses in SQLite.
- Schedules and interface preferences are stored in the browser's
  `localStorage` and are not synchronized between devices.
- Share links contain the enabled class codes and lecture-exemption setting.
  Anyone with a link can read that information.
- Google receives event details only when you choose an event in the export
  dialog and open its Google Calendar template.

## Run it locally

You need Node.js 24.15 through 24.x and npm 11.17 or newer. The supported npm
version is pinned in `package.json` because installs enforce an explicit
dependency-script policy.

```bash
npm install --global npm@11.17.0
npm ci
npm run dev
```

In another terminal, start the API:

```bash
npm start
```

Open <http://localhost:5173>. The API runs on port 3000 and Vite proxies `/api` requests to it.

Optional local configuration lives in `.env`. Copy `.env.example` and adjust the
documented ports, proxy target, cache path, and backend safeguards as needed.
Invalid port or proxy URL values stop startup with a clear error.
Set `DEBUG_SERVER=true` when you need verbose request, queue, and cache logs.

Want Docker instead?

```bash
docker compose -f docker-compose.dev.yml up --build
```

Production images and the Dokploy release procedure are documented in
[docs/deployment.md](docs/deployment.md). Published changes are listed in the
[changelog](CHANGELOG.md).

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

| Part     | Technology                 |
| -------- | -------------------------- |
| Frontend | Svelte 5 and Vite          |
| Calendar | Schedule-X                 |
| API      | Express                    |
| Cache    | SQLite                     |
| Tests    | Vitest and Testing Library |

The compatibility-sensitive design choices are recorded in
[docs/decisions.md](docs/decisions.md).

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) and
keep behavior changes covered by tests—the app is used by real students during
registration. Participation is governed by the
[Code of Conduct](CODE_OF_CONDUCT.md).

Using a coding agent? Start it from the repository root so it picks up
[AGENTS.md](AGENTS.md), which contains the architecture notes, safety rules, and
verification commands for this project. Use the
[task handoff template](docs/task-handoff-template.md) when work will continue in
another session or with another contributor.
