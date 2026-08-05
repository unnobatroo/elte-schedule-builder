# Architecture decisions

This document records the reasons behind the project's compatibility-sensitive
choices. Change these decisions only with explicit migration and regression
coverage.

## Local calendar dates

**Decision:** Treat schedule dates and Google Calendar export dates as local
calendar dates. Construct them from local year, month, and day values and do not
round-trip them through `Date.prototype.toISOString()`.

**Why:** A class belongs to a Budapest calendar day and wall-clock time, not a
UTC instant. UTC conversion can shift the displayed day for contributors and
users in different time zones.

**Alternative considered:** Normalize dates to UTC. This is useful for absolute
timestamps but does not match the schedule's calendar-date semantics.

**Consequence:** Date utilities and export behavior need tests around week and
year boundaries in the local timezone.

## Stable shared-schedule URLs

**Decision:** Preserve the `/import/<base64>` format and continue decoding links
created by older versions.

**Why:** Shared links may remain in messages or bookmarks after the application
changes. Breaking the decoder silently loses the value of those links.

**Alternative considered:** Replace the payload whenever the schedule model
changes. A new format may be introduced only with versioning or a compatibility
decoder.

**Consequence:** The payload contains enabled class codes and the lecture-
exemption setting, not the complete internal schedule. Base64 is transport
encoding, not encryption; anyone with the URL can read it.

## Browser storage migration

**Decision:** Store named schedules under the current schedule-store key while
retaining the legacy `savedSubjects` and `lectureExemption` migration path.

**Why:** Existing users can return after an update with older `localStorage`.
Discarding or misreading it would erase their saved schedule without warning.

**Alternative considered:** Clear or replace incompatible browser state. That
would simplify loading but is unacceptable without an explicit user-facing
migration policy.

**Consequence:** New fields must have safe defaults, storage keys remain stable,
and migrations require tests using old saved objects.

## Tanrend proxy, throttling, and cache

**Decision:** Send subject requests through the Express backend, serialize
upstream work with a delay, coalesce matching requests, and cache responses in
SQLite with bounded resource use.

**Why:** The browser should not depend directly on Tanrend's cross-origin
behavior. Caching and throttling reduce repeated upstream traffic, while request
and cache limits protect this service from unbounded work.

**Alternative considered:** Fetch Tanrend directly or issue upstream requests in
parallel. Both are simpler locally but make the application less reliable and
can place unnecessary load on the upstream service.

**Consequence:** Refactors must preserve queueing and cache behavior. Integration
tests use an injected upstream function and temporary or in-memory SQLite rather
than the live Tanrend service.

## Deterministic DEMO subjects

**Decision:** Serve `DEMO-1` through `DEMO-6` locally without calling Tanrend.

**Why:** Contributors and users need a reproducible way to exercise searching,
selection, persistence, conflicts, and browser flows when live data is missing
or the upstream service is unavailable.

**Alternative considered:** Mock every layer independently. Unit mocks remain
useful, but they do not prove the assembled frontend and backend flow.

**Consequence:** DEMO responses are part of the development and testing contract.
The browser happy path and backend smoke checks should remain independent of the
network.
