import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import path from 'node:path'

const sourcePath = process.argv[2] ?? process.env.SHRINK_MAP_PATH
const outputPath = process.argv[3] ?? process.env.SHRINK_LOOKUP_PATH
const mjListPath = process.argv[4] ?? process.env.MJ_LIST_PATH

if (sourcePath === undefined || outputPath === undefined) {
  console.error(
    'Usage: SHRINK_MAP_PATH=<path> SHRINK_LOOKUP_PATH=<path> [MJ_LIST_PATH=<path>] pnpm build:lookup',
  )
  console.error(
    'Or: pnpm build:lookup <shrink-map-json> <output-lookup-json> [mj-list-xlsx]',
  )
  process.exit(1)
}

const codepointToChar = (codepoint) =>
  String.fromCodePoint(Number.parseInt(codepoint.replace(/^U\+/, ''), 16))

const sequenceToChar = (sequence) =>
  sequence
    .split('_')
    .map((codepoint) => String.fromCodePoint(Number.parseInt(codepoint.replace(/^U\+/, ''), 16)))
    .join('')

const formatCodepoint = (char) =>
  Array.from(char)
    .map((part) => `U+${part.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`)
    .join(' ')

const candidateForChar = (char, rank = {}) => ({
  char,
  codepoint: formatCodepoint(char),
  _rank: {
    relationPriority: Number.MAX_SAFE_INTEGER,
    hopCount: Number.MAX_SAFE_INTEGER,
    tableRank: Number.MAX_SAFE_INTEGER,
    variationSequence: Array.from(char).length > 1 ? 1 : 0,
    supplementaryPlane: Array.from(char).some((part) => part.codePointAt(0) > 0xffff) ? 1 : 0,
    mjOrder: Number.MAX_SAFE_INTEGER,
    ...rank,
  },
})

const compareRankedCandidates = (left, right) => {
  const leftRank = left._rank ?? {}
  const rightRank = right._rank ?? {}
  const rankFields = [
    'relationPriority',
    'hopCount',
    'tableRank',
    'variationSequence',
    'supplementaryPlane',
    'mjOrder',
  ]

  for (const field of rankFields) {
    const comparison =
      (leftRank[field] ?? Number.MAX_SAFE_INTEGER) - (rightRank[field] ?? Number.MAX_SAFE_INTEGER)

    if (comparison !== 0) {
      return comparison
    }
  }

  return left.codepoint.localeCompare(right.codepoint)
}

const candidateForCodepointRecord = (record, relationPriority, fallbackRank = {}) => {
  const candidate = candidateForCodepoint(record.UCS)

  return {
    ...candidate,
    _rank: {
      ...candidate._rank,
      relationPriority,
      hopCount: Number(record['ホップ数'] ?? Number.MAX_SAFE_INTEGER),
      tableRank: Number(String(record['順位'] ?? '').match(/\d+/)?.[0] ?? Number.MAX_SAFE_INTEGER),
      ...fallbackRank,
    },
  }
}

const candidateForMjChar = (char, mjId, order) =>
  candidateForChar(char, {
    mjOrder: order,
    mjId,
  })

const mergeRelationRank = (candidate, relationCandidate) => ({
  ...candidate,
  _rank: {
    ...candidate._rank,
    relationPriority: relationCandidate._rank.relationPriority,
    hopCount: relationCandidate._rank.hopCount,
    tableRank: relationCandidate._rank.tableRank,
  },
})

const candidateForCodepoint = (codepoint) => {
  const char = codepointToChar(codepoint)

  return {
    char,
    codepoint: formatCodepoint(char),
    _rank: {
      relationPriority: Number.MAX_SAFE_INTEGER,
      hopCount: Number.MAX_SAFE_INTEGER,
      tableRank: Number.MAX_SAFE_INTEGER,
      variationSequence: 0,
      supplementaryPlane: Number.parseInt(codepoint.replace(/^U\+/, ''), 16) > 0xffff ? 1 : 0,
      mjOrder: Number.MAX_SAFE_INTEGER,
    },
  }
}

const uniqueCandidates = (candidates) => {
  const bestByChar = new Map()

  for (const candidate of candidates) {
    const current = bestByChar.get(candidate.char)

    if (current === undefined || compareRankedCandidates(candidate, current) < 0) {
      bestByChar.set(candidate.char, candidate)
    }
  }

  return [...bestByChar.values()].sort(compareRankedCandidates)
}

const decodeXml = (value) =>
  value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")

const parseSharedStrings = (xml) =>
  [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) =>
    [...match[1].matchAll(/<t(?: [^>]*)?>([\s\S]*?)<\/t>/g)]
      .map((textMatch) => decodeXml(textMatch[1]))
      .join(''),
  )

const getCellValue = (cellXml, sharedStrings) => {
  const valueMatch = cellXml.match(/<v>([\s\S]*?)<\/v>/)

  if (valueMatch === null) {
    return ''
  }

  const value = decodeXml(valueMatch[1])

  return cellXml.includes(' t="s"') ? (sharedStrings[Number(value)] ?? '') : value
}

const readXlsxXml = (xlsxPath, xmlPath) =>
  execFileSync('unzip', ['-p', xlsxPath, xmlPath], {
    encoding: 'utf8',
    maxBuffer: 80 * 1024 * 1024,
  })

const parseMjList = (xlsxPath) => {
  const sharedStrings = parseSharedStrings(readXlsxXml(xlsxPath, 'xl/sharedStrings.xml'))
  const sheet = readXlsxXml(xlsxPath, 'xl/worksheets/sheet1.xml')
  const result = new Map()

  for (const rowMatch of sheet.matchAll(/<row [^>]*>([\s\S]*?)<\/row>/g)) {
    const row = {}

    for (const cellMatch of rowMatch[1].matchAll(/<c r="([A-Z]+)\d+"[^>]*>([\s\S]*?)<\/c>/g)) {
      row[cellMatch[1]] = getCellValue(cellMatch[0], sharedStrings)
    }

    const mjId = row.C

    if (typeof mjId !== 'string' || !mjId.startsWith('MJ')) {
      continue
    }

    const chars = String(row.F ?? '')
      .split(';')
      .map((sequence) => sequence.trim())
      .filter((sequence) => /^[0-9A-Fa-f]+(?:_[0-9A-Fa-f]+)+$/.test(sequence))
      .map(sequenceToChar)

    if (typeof row.E === 'string' && row.E.startsWith('U+')) {
      chars.push(codepointToChar(row.E))
    }

    if (chars.length === 0 && typeof row.D === 'string' && row.D.startsWith('U+')) {
      chars.push(codepointToChar(row.D))
    }

    if (chars.length > 0) {
      result.set(
        mjId,
        uniqueCandidates(chars.map((char) => candidateForMjChar(char, mjId, Number(mjId.slice(2))))),
      )
    }
  }

  return result
}

const collectUcsRecords = (value, records = []) => {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectUcsRecords(item, records)
    }

    return records
  }

  if (value !== null && typeof value === 'object') {
    if (typeof value.UCS === 'string') {
      records.push(value)
    }

    for (const child of Object.values(value)) {
      collectUcsRecords(child, records)
    }
  }

  return records
}

const collectCodepoints = (value) => {
  const codepoints = new Set()

  for (const record of collectUcsRecords(value)) {
    codepoints.add(record.UCS)
  }

  return codepoints
}

const sourceFieldNames = [
  'JIS包摂規準・UCS統合規則',
  '法務省告示582号別表第四',
  '法務省戸籍法関連通達・通知',
]

const collectSourceCodepoints = (entry) => {
  for (const fieldName of sourceFieldNames) {
    const codepoints = collectCodepoints(entry[fieldName] ?? [])

    if (codepoints.size > 0) {
      return codepoints
    }
  }

  return collectCodepoints(entry)
}

const collectSourceCandidates = (entry, mjCharactersById) => {
  const mjId = entry['MJ文字図形名']
  const codepointCandidates = [...collectSourceCodepoints(entry)].map(candidateForCodepoint)

  if (typeof mjId === 'string' && mjCharactersById?.has(mjId)) {
    return mjCharactersById.get(mjId)
  }

  return codepointCandidates
}

const sortByPriority = (records) =>
  records.toSorted((left, right) => {
    const leftHop = Number(left['ホップ数'] ?? Number.MAX_SAFE_INTEGER)
    const rightHop = Number(right['ホップ数'] ?? Number.MAX_SAFE_INTEGER)

    if (leftHop !== rightHop) {
      return leftHop - rightHop
    }

    const leftRank = String(left['順位'] ?? '')
    const rightRank = String(right['順位'] ?? '')

    return leftRank.localeCompare(rightRank, 'ja')
  })

const targetFieldNames = [
  ['法務省戸籍法関連通達・通知', 0],
  ['法務省告示582号別表第四', 1],
  ['JIS包摂規準・UCS統合規則', 2],
  ['辞書類等による関連字', 3],
]

const selectTargetCandidates = (entry) => {
  for (const [fieldName, relationPriority] of targetFieldNames) {
    const records = sortByPriority(collectUcsRecords(entry[fieldName] ?? []))

    if (records.length > 0) {
      return uniqueCandidates(
        records.map((record) => candidateForCodepointRecord(record, relationPriority)),
      )
    }
  }

  return []
}

const addCandidate = (map, key, candidate) => {
  map[key] = uniqueCandidates([...(map[key] ?? []), candidate])
}

const buildLookup = (source, mjCharactersById) => {
  const shrink = {}
  const reverse = {}

  for (const entry of source.content ?? []) {
    const sources = collectSourceCandidates(entry, mjCharactersById)
    const targets = selectTargetCandidates(entry)

    for (const sourceCandidate of sources) {
      for (const targetCandidate of targets) {
        if (sourceCandidate.char === targetCandidate.char) {
          continue
        }

        addCandidate(shrink, sourceCandidate.char, targetCandidate)
        addCandidate(reverse, targetCandidate.char, mergeRelationRank(sourceCandidate, targetCandidate))
      }
    }
  }

  return {
    meta: {
      title: source.meta?.['dct:title'] ?? 'MJ縮退マップ',
      version: source.meta?.['owl:versionInfo'] ?? null,
      issued: source.meta?.['dct:issued'] ?? null,
      sourcePath,
      mjListPath: mjListPath ?? null,
    },
    shrink,
    reverse,
  }
}

const source = JSON.parse(await readFile(sourcePath, 'utf8'))
const mjCharactersById = mjListPath === undefined ? undefined : parseMjList(mjListPath)
const lookup = buildLookup(source, mjCharactersById)

await mkdir(path.dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(lookup)}\n`)

console.log(`Wrote ${Object.keys(lookup.shrink).length} shrink keys to ${outputPath}`)
