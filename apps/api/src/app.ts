import { Hono } from 'hono'
import { GreetingStore, InvalidNameError, greet, normalizeName } from './greetings.js'

export interface AppOptions {
  version?: string
  store?: GreetingStore
}

export function createApp(options: AppOptions = {}) {
  const version = options.version ?? 'dev'
  const store = options.store ?? new GreetingStore()
  const app = new Hono()

  app.get('/healthz', (c) => c.json({ status: 'ok' }))

  app.get('/api/version', (c) => c.json({ version }))

  app.get('/api/hello', (c) => {
    const name = normalizeName(c.req.query('name') ?? 'world')
    return c.json({ message: greet(name) })
  })

  app.get('/api/greetings', (c) => c.json({ greetings: store.list() }))


  app.post('/api/greetings', async (c) => {
    const body = await c.req.json().catch(() => ({}))
    const name = normalizeName((body as { name?: unknown }).name)
    return c.json(store.add(name), 201)
  })

  app.onError((err, c) => {
    if (err instanceof InvalidNameError) {
      return c.json({ error: err.message }, 400)
    }
    console.error(err)
    return c.json({ error: 'internal error' }, 500)
  })

  return app
}
