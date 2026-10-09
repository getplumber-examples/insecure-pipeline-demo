export interface Greeting {
  id: number
  name: string
  message: string
  createdAt: string
}

export const MAX_NAME_LENGTH = 40
const MAX_STORED = 20

export class InvalidNameError extends Error {}

/** Trims the name and rejects anything empty, too long, or not printable. */
export function normalizeName(input: unknown): string {
  if (typeof input !== 'string') {
    throw new InvalidNameError('name must be a string')
  }
  const name = input.trim()
  if (name.length === 0) {
    throw new InvalidNameError('name must not be empty')
  }
  if (name.length > MAX_NAME_LENGTH) {
    throw new InvalidNameError(`name must be at most ${MAX_NAME_LENGTH} characters`)
  }
  if (!/^[\p{L}\p{N} .'_-]+$/u.test(name)) {
    throw new InvalidNameError('name contains unsupported characters')
  }
  return name
}

export function greet(name: string): string {
  return `Hello, ${name}!`
}

/** In-memory store. Good enough for a hello world, gone on restart. */
export class GreetingStore {
  private greetings: Greeting[] = []
  private nextId = 1

  add(name: string, now: Date = new Date()): Greeting {
    const greeting: Greeting = {
      id: this.nextId++,
      name,
      message: greet(name),
      createdAt: now.toISOString(),
    }
    this.greetings.unshift(greeting)
    this.greetings.length = Math.min(this.greetings.length, MAX_STORED)
    return greeting
  }

  list(): Greeting[] {
    return [...this.greetings]
  }
}
