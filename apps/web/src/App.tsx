import { type FormEvent, useEffect, useState } from 'react'
import { type Greeting, createGreeting, fetchGreetings, fetchVersion } from './api'

export function App() {
  const [name, setName] = useState('')
  const [greetings, setGreetings] = useState<Greeting[]>([])
  const [version, setVersion] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetchVersion()
      .then(setVersion)
      .catch(() => setVersion(null))
    fetchGreetings()
      .then(setGreetings)
      .catch(() => setError('The API is not reachable.'))
  }, [])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const greeting = await createGreeting(name)
      setGreetings((current) => [greeting, ...current].slice(0, 20))
      setName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const latest = greetings[0]

  return (
    <main className="page">
      <header className="header">
        <span className="logo">hello-pipeline</span>
        <span className={version ? 'pill pill-ok' : 'pill'}>
          {version ? `api ${version}` : 'api offline'}
        </span>
      </header>

      <h1 className="hero">{latest ? latest.message : 'Hello, world!'}</h1>

      <form className="form" onSubmit={onSubmit}>
        <label htmlFor="name">Who should we greet?</label>
        <div className="row">
          <input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            maxLength={40}
            autoComplete="off"
          />
          <button type="submit" disabled={busy || name.trim() === ''}>
            Say hello
          </button>
        </div>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
      </form>

      <section>
        <h2>Recent greetings</h2>
        {greetings.length === 0 ? (
          <p className="muted">Nobody yet. Be the first.</p>
        ) : (
          <ul className="list">
            {greetings.map((greeting) => (
              <li key={greeting.id}>
                <span>{greeting.message}</span>
                <time dateTime={greeting.createdAt}>
                  {new Date(greeting.createdAt).toLocaleTimeString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
