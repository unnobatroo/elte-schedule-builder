# Repository settings checklist

These settings live on GitHub and cannot be enforced by committed files alone.
Review them after the Package 5 commits reach the default branch.

## Contributor intake

- Enable **Issues** for the repository.
- Remove interaction limits that prevent ordinary external users from creating
  issues, or document a deliberate alternative in `SUPPORT.md`.
- Confirm that GitHub detects the bug and feature issue forms.
- Confirm that new pull requests load `.github/pull_request_template.md`.

## Private security intake

- Enable **Private vulnerability reporting** under repository security settings.
- Confirm that the **Report a vulnerability** link opens a private advisory form.
- Confirm that the repository Security page detects `SECURITY.md`.

## About metadata

Suggested description:

> Plan ELTE schedules, compare class groups, find conflicts, and export visible events.

Suggested website:

> https://schedule.w04m1.dev

Suggested topics:

- `elte`
- `schedule-builder`
- `student-tools`
- `svelte`
- `vite`

The description should identify the project as unofficial if GitHub's available
space permits.

## Community files

Confirm that GitHub's community profile detects:

- `README.md`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `SUPPORT.md`
- issue forms and the pull-request template

## Merge protection

Package 5 does not change merge policy, but the default branch should continue
requiring the project's green CI check before merge if branch protection or a
ruleset is available.
