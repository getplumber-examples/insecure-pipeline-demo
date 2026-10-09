import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { createApp } from './app.js'

const port = Number(process.env.PORT ?? 3000)
const app = createApp({ version: process.env.APP_VERSION })

// In production the API also serves the built web interface.
const webRoot = process.env.WEB_ROOT ?? fileURLToPath(new URL('../../web/dist', import.meta.url))
if (existsSync(webRoot)) {
  app.use('/*', serveStatic({ root: webRoot }))
}

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`hello-pipeline listening on http://localhost:${info.port}`)
})
