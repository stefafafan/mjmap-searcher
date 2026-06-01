import { candidateFor, type Candidate } from './characters'

type LookupCandidate = Candidate & {
  _rank?: unknown
}

export type LookupJson = {
  shrink: Record<string, LookupCandidate[]>
  reverse: Record<string, LookupCandidate[]>
}

export type CharacterLookup = {
  findShrinkCandidates(char: string): Promise<Candidate[]>
  findReverseCandidates(char: string): Promise<Candidate[]>
}

const getVariationSequenceBase = (char: string): string | null => {
  const chars = Array.from(char)

  return chars.length > 1 ? chars[0] : null
}

const publicCandidates = (candidates: LookupCandidate[]): Candidate[] =>
  candidates.map(({ char, codepoint }) => ({ char, codepoint }))

export const createInMemoryLookup = (data: LookupJson): CharacterLookup => ({
  async findShrinkCandidates(char) {
    const exact = data.shrink[char] ?? []

    if (exact.length > 0) {
      return publicCandidates(exact)
    }

    const base = getVariationSequenceBase(char)

    return base === null ? [] : [candidateFor(base)]
  },

  async findReverseCandidates(char) {
    return publicCandidates(data.reverse[char] ?? [])
  },
})
