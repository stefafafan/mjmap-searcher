import { Hono } from 'hono'
import lookupAssetPath from '../data/shrink-lookup.json?url'
import { toSingleCharacter } from './characters'
import { createInMemoryLookup, type CharacterLookup, type LookupJson } from './lookup'
import { renderIndexPage } from './page'

type AssetFetcher = {
  fetch(input: Request | URL | string): Promise<Response>
}

type Bindings = {
  ASSETS?: AssetFetcher
}

let runtimeLookupPromise: Promise<CharacterLookup> | null = null

const loadRuntimeLookup = async (
  assets: AssetFetcher | undefined,
  requestUrl: string,
): Promise<CharacterLookup> => {
  if (assets === undefined) {
    throw new Error('lookup assets binding is not configured')
  }

  const response = await assets.fetch(new URL(lookupAssetPath, requestUrl))

  if (!response.ok) {
    throw new Error(`lookup data could not be loaded: ${response.status}`)
  }

  return createInMemoryLookup((await response.json()) as LookupJson)
}

const getRuntimeLookup = (
  assets: AssetFetcher | undefined,
  requestUrl: string,
): Promise<CharacterLookup> => {
  runtimeLookupPromise ??= loadRuntimeLookup(assets, requestUrl)

  return runtimeLookupPromise
}

const invalidChar = () =>
  Response.json(
    {
      error: 'invalid_char',
      message: 'char must be exactly one Unicode character or ideographic variation sequence',
    },
    { status: 400 },
  )

const notFound = () => Response.json({ error: 'not_found' }, { status: 404 })

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'clipboard-write=(self)',
}

export const createApp = (characterLookup?: CharacterLookup) => {
  const app = new Hono<{ Bindings: Bindings }>()

  const getLookup = (assets: AssetFetcher | undefined, requestUrl: string) =>
    characterLookup === undefined
      ? getRuntimeLookup(assets, requestUrl)
      : Promise.resolve(characterLookup)

  app.use('*', async (c, next) => {
    await next()

    for (const [name, value] of Object.entries(securityHeaders)) {
      c.header(name, value)
    }
  })

  app.onError(() =>
    Response.json(
      {
        error: 'internal_error',
        message: 'internal server error',
      },
      { status: 500 },
    ),
  )

  app.get('/', (c) => c.html(renderIndexPage()))

  app.get('/fonts/*', (c) => {
    const assets = c.env?.ASSETS

    if (assets === undefined) {
      return notFound()
    }

    return assets.fetch(c.req.raw)
  })

  app.get('/api/health', (c) => c.json({ ok: true }))

  app.get('/api/shrink', async (c) => {
    const char = toSingleCharacter(c.req.query('char'))

    if (char === null) {
      return invalidChar()
    }

    const lookup = await getLookup(c.env?.ASSETS, c.req.url)

    return c.json(await lookup.findShrinkCandidates(char))
  })

  app.get('/api/reverse', async (c) => {
    const char = toSingleCharacter(c.req.query('char'))

    if (char === null) {
      return invalidChar()
    }

    const lookup = await getLookup(c.env?.ASSETS, c.req.url)

    return c.json(await lookup.findReverseCandidates(char))
  })

  return app
}

const app = createApp()

export default app
