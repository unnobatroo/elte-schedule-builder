# Task handoff template

Use this template when work stops before completion, changes hands, or needs to
be resumed in another agent session. Replace the prompts with concrete facts and
link relevant issues, pull requests, commits, and files.

## Status

- **State:** Not started / In progress / Ready for review / Blocked
- **Branch and last commit:**
- **Completed scope:**
- **Remaining scope:**
- **Working-tree changes:** None, or list every uncommitted file and its purpose.

## Acceptance criteria

- [ ] Describe each observable outcome required for completion.
- [ ] Identify compatibility requirements for saved schedules, shared URLs,
      calendar dates, Tanrend throttling, or deployment when applicable.

## Verification

| Check               | Result  | Notes                            |
| ------------------- | ------- | -------------------------------- |
| Focused test(s)     | Not run | Add exact commands and failures. |
| `npm run check`     | Not run |                                  |
| `npm test -- --run` | Not run |                                  |
| `npm run build`     | Not run |                                  |
| `npm run test:e2e`  | Not run |                                  |
| `git diff --check`  | Not run |                                  |

Add `npm audit --omit=dev` for dependency changes and the DEMO API smoke check
from `AGENTS.md` for backend changes. Never report a check as passing unless it
ran against the handed-off revision.

## Deferred risks and decisions

- **Known risks or failing checks:**
- **Intentionally deferred work:**
- **Decisions made and alternatives rejected:**
- **User input or external access still required:**

## Resume steps

1. Confirm the repository, branch, commit, and `git status` match this handoff.
2. Read the linked issue or pull request and inspect the listed changed files.
3. Reproduce the last verified state with the focused command above.
4. Continue with the first remaining acceptance criterion.
5. Run the full verification required by `AGENTS.md` before handing off again.
