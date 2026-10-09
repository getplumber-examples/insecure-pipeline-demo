# hello-pipeline

> ⚠️ **Training fixture.** Used in a Plumber CI/CD security demo. A later change
> introduces an intentionally insecure pipeline. Do not reuse the workflow.

A small greetings service: a [Hono](https://hono.dev) API on Node 22 and a React
interface, shipped together as one Docker image and deployed to Fly.io.

## API

| Endpoint | What it does |
| --- | --- |
| `GET /healthz` | Liveness check |
| `GET /api/version` | The deployed version (commit SHA) |
| `GET /api/hello?name=Ada` | `{"message": "Hello, Ada!"}` |
| `GET /api/greetings` | The 20 most recent greetings |
| `POST /api/greetings` | Stores a greeting for `{"name": "Ada"}` |

## Development

Requires Node 22 (see `.nvmrc`).

```bash
npm ci
npm run dev          # API on :3000, interface on :5173
npm run test
```

## License

[MIT](./LICENSE)
