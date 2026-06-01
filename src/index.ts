import { Hono } from 'hono'
import lookupJson from '../data/shrink-lookup.json'
import { toSingleCharacter } from './characters'
import { createInMemoryLookup, type CharacterLookup, type LookupJson } from './lookup'
import { renderIndexPage } from './page'

const lookup = createInMemoryLookup(lookupJson as LookupJson)

const invalidChar = () =>
  Response.json(
    {
      error: 'invalid_char',
      message: 'char must be exactly one Unicode character or ideographic variation sequence',
    },
    { status: 400 },
  )

export const createApp = (characterLookup: CharacterLookup) => {
  const app = new Hono()

  app.get('/', (c) => c.html(renderIndexPage()))

  app.get('/api/health', (c) => c.json({ ok: true }))

  app.get('/api/shrink', async (c) => {
    const char = toSingleCharacter(c.req.query('char'))

    if (char === null) {
      return invalidChar()
    }

    return c.json(await characterLookup.findShrinkCandidates(char))
  })

  app.get('/api/reverse', async (c) => {
    const char = toSingleCharacter(c.req.query('char'))

    if (char === null) {
      return invalidChar()
    }

    return c.json(await characterLookup.findReverseCandidates(char))
  })

  return app
}

const app = createApp(lookup)

export default app
