import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('App', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input)
      if (url === '/api/version') return json({ version: 'abc1234' })
      if (url === '/api/greetings' && init?.method === 'POST') {
        const { name } = JSON.parse(String(init.body)) as { name: string }
        if (name === 'bad!') return json({ error: 'name contains unsupported characters' }, 400)
        return json(
          { id: 1, name, message: `Hello, ${name}!`, createdAt: '2026-10-03T10:00:00.000Z' },
          201,
        )
      }
      if (url === '/api/greetings') return json({ greetings: [] })
      return json({ error: 'not found' }, 404)
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('shows the default greeting and the API version', async () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hello, world!')
    expect(await screen.findByText('api abc1234')).toBeInTheDocument()
  })

  it('greets the person who submits the form', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Who should we greet?'), 'Ada')
    await user.click(screen.getByRole('button', { name: 'Say hello' }))

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hello, Ada!'),
    )
    expect(screen.getByLabelText('Who should we greet?')).toHaveValue('')
  })

  it('shows the API error when the name is rejected', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Who should we greet?'), 'bad!')
    await user.click(screen.getByRole('button', { name: 'Say hello' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'name contains unsupported characters',
    )
  })

  it('disables the button until a name is typed', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Say hello' })).toBeDisabled()
  })
})
