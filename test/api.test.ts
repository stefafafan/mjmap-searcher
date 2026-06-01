import { describe, expect, it } from 'vitest'
import { createApp } from '../src'
import { createInMemoryLookup } from '../src/lookup'

const app = createApp(
  createInMemoryLookup({
    shrink: {
      邊: [
        {
          char: '辺',
          codepoint: 'U+8FBA',
        },
      ],
    },
    reverse: {
      辺: [
        {
          char: '邊',
          codepoint: 'U+908A',
          _rank: {
            relationPriority: 0,
          },
        },
      ],
    },
  }),
)

describe('API', () => {
  it('serves the lookup frontend at root', async () => {
    const response = await app.request('/')
    const html = await response.text()

    expect(response.status).toBe(200)
    expect(html).toContain('id="lookup-form"')
    expect(html).toContain('縮退先候補')
    expect(html).toContain('縮退元候補')
  })

  it('returns shrink candidates for one character from the lookup store', async () => {
    const response = await app.request('/api/shrink?char=邊')

    await expect(response.json()).resolves.toEqual([
      {
        char: '辺',
        codepoint: 'U+8FBA',
      },
    ])
  })

  it('returns reverse candidates for one character from the lookup store', async () => {
    const response = await app.request('/api/reverse?char=辺')

    await expect(response.json()).resolves.toContainEqual({
      char: '邊',
      codepoint: 'U+908A',
    })
  })

  it('does not expose private lookup ranking metadata', async () => {
    const response = await app.request('/api/reverse?char=辺')

    await expect(response.json()).resolves.toEqual([
      {
        char: '邊',
        codepoint: 'U+908A',
      },
    ])
  })

  it('returns an empty array when no candidates are found', async () => {
    const response = await app.request('/api/shrink?char=橋')

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual([])
  })

  it('rejects missing input', async () => {
    const response = await app.request('/api/shrink')

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'invalid_char',
      message: 'char must be exactly one Unicode character or ideographic variation sequence',
    })
  })

  it('rejects multi-character input', async () => {
    const response = await app.request('/api/shrink?char=高橋')

    expect(response.status).toBe(400)
  })

  it('accepts supplementary-plane characters as one character', async () => {
    const response = await app.request('/api/shrink?char=𠮷')

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual([])
  })

  it('accepts an ideographic variation sequence as one lookup unit', async () => {
    const response = await app.request('/api/shrink?char=櫛󠄁')

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual([
      {
        char: '櫛',
        codepoint: 'U+6ADB',
      },
    ])
  })
})
