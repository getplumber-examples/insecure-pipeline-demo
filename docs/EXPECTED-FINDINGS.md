# Expected Plumber findings

Run from the repo root (GitHub auth via `gh` recommended so the run completes
and shows a letter score):

```bash
plumber analyze --score-point
```

Five controls fail on `.github/workflows/ci.yml`. Nothing else fails: checkouts
set `persist-credentials: false`, and every job declares `permissions`, so the
report stays focused on the five patterns the demo is about.

| Code | Severity | Control | Where | The fix |
| --- | --- | --- | --- | --- |
| `ISSUE-203` | Critical | Pipeline must not enable debug trace | `coverage` job sets `ACTIONS_STEP_DEBUG: true` | Remove the debug variable |
| `ISSUE-309` | Critical | Workflows must not expose all secrets at once | `coverage` job sets `ALL_SECRETS: ${{ toJSON(secrets) }}` | Pass only the secrets a step needs, by name |
| `ISSUE-302` | High | Reusable workflows must not inherit secrets | `deploy` job calls `deploy.yml` with `secrets: inherit` | Forward named secrets explicitly |
| `ISSUE-701` | High | Third-party actions must be pinned by commit SHA | `coverage` job uses `compromised-action-demo@v1` | Pin to a commit SHA (and vet the action) |
| `ISSUE-803` | High | Workflow must not grant write-all permissions | `coverage` job sets `permissions: write-all` | Grant only the scopes the job needs |

## How the attack chains together

`ISSUE-309` hands every repository secret to the `coverage` job's environment.
`ISSUE-803` gives that job write access to the whole repository. `ISSUE-701`
lets a third-party action run there, trusted by a mutable tag that an attacker
can repoint. `ISSUE-203` makes sure the leaked material also lands in the logs.
`ISSUE-302` then forwards the same secrets into a second workflow. Each finding
is a rung; together they are the ladder.

The `coverage` step runs
[`getplumber-examples/compromised-action-demo`](https://github.com/getplumber-examples/compromised-action-demo),
which is built to behave like a supply-chain-compromised action.
