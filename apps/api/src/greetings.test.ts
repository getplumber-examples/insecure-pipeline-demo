import { describe, expect, it } from 'vitest'
import { GreetingStore, InvalidNameError, greet, normalizeName } from './greetings.js'

describe('normalizeName', () => {
  it('trims whitespace', () => {
    expect(normalizeName('  Ada  ')).toBe('Ada')
  })

  it('accepts accents, digits and simple punctuation', () => {
    expect(normalizeName("Zoé O'Neil-2")).toBe("Zoé O'Neil-2")
  })

  it.each([[''], ['   '], ['a'.repeat(41)], ['<script>'], [42], [undefined]])(
    'rejects %j',
    (input) => {
      expect(() => normalizeName(input)).toThrow(InvalidNameError)
    },
  )
})

describe('greet', () => {
  it('says hello', () => {
    expect(greet('Ada')).toBe('Hello, Ada!')
  })
})

describe('GreetingStore', () => {
  it('returns the newest greeting first', () => {
    const store = new GreetingStore()
    store.add('Ada')
    store.add('Linus')
    expect(store.list().map((g) => g.name)).toEqual(['Linus', 'Ada'])
  })

  it('keeps only the 20 most recent greetings', () => {
    const store = new GreetingStore()
    for (let i = 0; i < 25; i++) store.add(`user ${i}`)
    expect(store.list()).toHaveLength(20)
    expect(store.list()[0]?.name).toBe('user 24')
  })
})
