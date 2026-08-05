# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-08-05

### Added

- Schedule planning from Tanrend subject data with conflict detection, multiple
  saved schedules, share links, and Google Calendar export.
- Deterministic demo subjects, automated tests, browser tests, and CI checks.
- Request throttling, SQLite caching, server safeguards, and security headers.
- Automated dependency update checks and production-container smoke testing.

### Changed

- Upgraded the application to Express 5, Marked 18, and Schedule-X 3.
- Pinned the production Node.js container image by digest for reproducible builds.

[Unreleased]: https://github.com/w04m1/elte-schedule-builder/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/w04m1/elte-schedule-builder/releases/tag/v0.1.0
