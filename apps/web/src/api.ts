export interface Greeting {
  id: number
  name: string
  message: string
  createdAt: string
}

async function parse<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) {
    throw new Error(body.error ?? `request failed (${res.status})`)
  }
  return body as T
}

export async function fetchVersion(): Promise<string> {
  const { version } = await parse<{ version: string }>(await fetch('/api/version'))
  return version
}

export async function fetchGreetings(): Promise<Greeting[]> {
  const { greetings } = await parse<{ greetings: Greeting[] }>(await fetch('/api/greetings'))
  return greetings
}

export async function createGreeting(name: string): Promise<Greeting> {
  return parse<Greeting>(
    await fetch('/api/greetings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name }),
    }),
  )
}
