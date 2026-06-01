export type Candidate = {
  char: string
  codepoint: string
}

export const toCodepoint = (char: string): string => {
  const codepoints = Array.from(char, (part) => part.codePointAt(0))

  if (codepoints.some((codepoint) => codepoint === undefined)) {
    throw new Error('Cannot format an empty character as a codepoint')
  }

  return codepoints
    .map((codepoint) => `U+${codepoint!.toString(16).toUpperCase().padStart(4, '0')}`)
    .join(' ')
}

const isVariationSelector = (char: string): boolean => {
  const codepoint = char.codePointAt(0)

  return (
    codepoint !== undefined &&
    ((codepoint >= 0xfe00 && codepoint <= 0xfe0f) ||
      (codepoint >= 0xe0100 && codepoint <= 0xe01ef))
  )
}

export const toSingleCharacter = (value: string | undefined | null): string | null => {
  if (value === undefined || value === null) {
    return null
  }

  const normalized = value.normalize('NFC')
  const chars = Array.from(normalized)

  if (chars.length === 1) {
    return chars[0]
  }

  if (chars.length > 1 && !isVariationSelector(chars[0]) && chars.slice(1).every(isVariationSelector)) {
    return chars.join('')
  }

  if (chars.length !== 1) {
    return null
  }

  return chars[0]
}

export const candidateFor = (char: string): Candidate => ({
  char,
  codepoint: toCodepoint(char),
})
