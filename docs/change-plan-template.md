# Change plan and handoff

Use this lightweight template for work that spans several files, changes a
compatibility-sensitive flow, or may be continued by another contributor.

## User outcome

What should a user be able to do, or what failure should stop happening?

## Scope

- Included:
- Excluded:

## Acceptance criteria

- [ ] Observable behavior:
- [ ] Regression coverage:
- [ ] Compatibility expectations:

## Risk areas

Note any impact on enabled classes, conflicts, local storage, shared URLs, local
calendar dates, Tanrend throttling, caching, or external services.

## Implementation notes

Record the chosen approach and any important rejected alternative.

## Verification

- [ ] `npm run check`
- [ ] `npm test -- --run`
- [ ] `npm run build`
- [ ] `npm run test:e2e`
- [ ] `git diff --check`
- [ ] Additional focused or manual verification:

## Handoff

- Current state:
- Decisions already made:
- Remaining work:
- Known limitations or blockers:
