# insecure-pipeline-demo

[![Plumber Score](https://score.getplumber.io/github.com/getplumber-examples/insecure-pipeline-demo.svg)](https://score.getplumber.io/github.com/getplumber-examples/insecure-pipeline-demo) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

> ⚠️ **TRAINING FIXTURE — INTENTIONALLY INSECURE PIPELINE.**
> The application code is an ordinary small TypeScript API. The CI/CD workflow
> in [`.github/workflows/ci.yml`](.github/workflows/ci.yml) is **deliberately
> dangerous**: it carries a set of real CI/CD attack patterns for a Plumber
> security demo. Do not copy the workflow into a real project.

A small greetings service: a [Hono](https://hono.dev) API on Node 22 and a React
interface, shipped as one Docker image and deployed to Fly.io. The app is here
only so the pipeline has something plausible to build, test, and ship.

## Contents

- [The story this repo tells](#the-story-this-repo-tells)
- [What Plumber finds in the pipeline](#what-plumber-finds-in-the-pipeline)
- [Application layout](#application-layout)
- [Development](#development)
- [License](#license)

## The story this repo tells

Someone asked an AI agent for a small feature ("add a build-status endpoint").
The diff looked fine, the tests passed, the pipeline went green, they moved on.
Nobody read the part of the pull request that also edited the GitHub Actions
workflow. That edit wired in a compromised third-party action and handed it the
repository's secrets.

- **Act 1** — the app builds and the pipeline is green. Everything *looks* fine.
- **Act 2** — `plumber analyze` surfaces the attack patterns the green pipeline hid.
- **Act 3** — the Plumber agent proposes the fix and the score goes green honestly.

## What Plumber finds in the pipeline

Running `plumber analyze --score` from the repo root reports these findings
(see [`.github/workflows/`](.github/workflows/)) and a Plumber Score of
3 / 100 (E): one Critical attack path, three High, two Medium. The exact codes
and severities are confirmed in
[`docs/EXPECTED-FINDINGS.md`](docs/EXPECTED-FINDINGS.md).

| Code | Pattern | Why it matters |
| --- | --- | --- |
| `ISSUE-804` | `preview.yml` runs on `pull_request_target` and checks out the PR head | A fork's `package.json` scripts run with the repo's secrets and a write token: the classic "pwn request" |
| `ISSUE-207` | The pull request title is interpolated straight into a `run:` script | Anyone who can open a PR gets code execution on the runner (script injection) |
| `ISSUE-209` | The PR branch name is written into `$GITHUB_ENV` | Attacker-controlled content becomes environment for every later step |
| `ISSUE-701` | Every action is pinned by a mutable tag (`@v1`, `@v4`), not a commit SHA | The exact tj-actions supply-chain vector: the tag can be swapped for a malicious build |
| `ISSUE-713` | `totally-fine-action` is not an authorized source | `.plumber.yaml` refuses to trust an action just for sharing our GitHub org |
| `ISSUE-309` | The whole secrets context is exported into the environment | Every secret is handed to every step, including the compromised action |
| `ISSUE-302` | A reusable workflow is called with `secrets: inherit` | Secrets flow to code the caller never reviews |
| `ISSUE-803` | A job runs with `permissions: write-all` | A compromised step can rewrite the repo, releases, and packages |
| `ISSUE-801` | The `image` job declares no `permissions:` block at all | The token silently inherits the repository default scope |
| `ISSUE-307` | The `image` job checks out with credentials persisted in `.git/config` | The token lingers on disk for any later step or packed artifact |
| `ISSUE-203` | Step debug logging is force-enabled | Secrets and internals leak into logs anyone with read access can see |

The compromised action itself lives in the companion repo
[`totally-fine-action`](https://github.com/getplumber-examples/totally-fine-action).

The badge at the top of this page is live: the
[`plumber.yml`](.github/workflows/plumber.yml) workflow runs Plumber on every
push and pull request and publishes the `main` score to
[score.getplumber.io](https://score.getplumber.io/github.com/getplumber-examples/insecure-pipeline-demo)
over CI OIDC, no secret involved. It runs with `soft-fail` so the pipeline
stays green while the badge says E, which is the whole point of the demo.

## Tech stack

- **Runtime:** Node 22
- **API:** [Hono](https://hono.dev) (TypeScript)
- **Interface:** React + Vite (TypeScript)
- **Tests:** Vitest with Testing Library
- **Packaging:** a single Docker image
- **Hosting:** Fly.io

## Application layout

```
apps/
  api/        Hono API on Node 22 (TypeScript, Vitest)
  web/        React + Vite interface (TypeScript, Vitest, Testing Library)
scripts/
  smoke.sh    smoke test for a deployed instance
Dockerfile    one image: the API serves the built interface
fly.toml      Fly.io config for staging and production
```

| Endpoint | What it does |
| --- | --- |
| `GET /healthz` | Liveness check |
| `GET /api/version` | The deployed version (commit SHA) |
| `GET /api/hello?name=Ada` | `{"message": "Hello, Ada!"}` |
| `GET /api/greetings` | The 20 most recent greetings |
| `POST /api/greetings` | Stores a greeting for `{"name": "Ada"}` |
| `GET /api/status` | Version, stored count, and start time (the "feature") |

## Development

Requires Node 22 (see `.nvmrc`). With [nvm](https://github.com/nvm-sh/nvm) installed, run `nvm use` to switch to the pinned version.

```bash
npm ci
npm run dev          # API on :3000, interface on :5173
npm run test         # runs the full suite: 19 API + 4 web tests, all green
```

## License

[MIT](./LICENSE). An educational security fixture, provided with no warranty.

## Status note

This is an educational demo, maintained on a best-effort basis.
