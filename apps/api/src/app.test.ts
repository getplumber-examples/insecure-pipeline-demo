import { describe, expect, it } from 'vitest'
import { createApp } from './app.js'

describe('API', () => {
  it('GET /healthz', async () => {
    const res = await createApp().request('/healthz')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok' })
  })

  it('GET /api/version returns the configured version', async () => {
    const res = await createApp({ version: 'abc1234' }).request('/api/version')
    expect(await res.json()).toEqual({ version: 'abc1234' })
  })

  it('GET /api/hello defaults to world', async () => {
    const res = await createApp().request('/api/hello')
    expect(await res.json()).toEqual({ message: 'Hello, world!' })
  })

  it('GET /api/hello greets by name', async () => {
    const res = await createApp().request('/api/hello?name=Ada')
    expect(await res.json()).toEqual({ message: 'Hello, Ada!' })
  })

  it('GET /api/hello rejects bad names', async () => {
    const res = await createApp().request('/api/hello?name=%3Cscript%3E')
    expect(res.status).toBe(400)
  })

  it('POST /api/greetings stores a greeting', async () => {
    const app = createApp()
    const created = await app.request('/api/greetings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Ada' }),
    })
    expect(created.status).toBe(201)

    const list = await app.request('/api/greetings')
    const body = (await list.json()) as { greetings: { message: string }[] }
    expect(body.greetings.map((g) => g.message)).toEqual(['Hello, Ada!'])
  })

  it('POST /api/greetings rejects a missing name', async () => {
    const res = await createApp().request('/api/greetings', { method: 'POST' })
    expect(res.status).toBe(400)
  })
})
