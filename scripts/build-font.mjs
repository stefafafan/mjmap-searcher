import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(execFile)

const requireEnv = (name) => {
  const value = process.env[name]

  if (value === undefined || value.length === 0) {
    throw new Error(`${name} is required`)
  }

  return value
}

const collectCodepoints = (lookup) => {
  const codepoints = new Set()
  const add = (text) => {
    for (const char of Array.from(text)) {
      codepoints.add(char.codePointAt(0))
    }
  }

  for (const [char, candidates] of Object.entries(lookup.shrink)) {
    add(char)

    for (const candidate of candidates) {
      add(candidate.char)
    }
  }

  for (const [char, candidates] of Object.entries(lookup.reverse)) {
    add(char)

    for (const candidate of candidates) {
      add(candidate.char)
    }
  }

  return [...codepoints]
    .sort((a, b) => a - b)
    .map((codepoint) => `U+${codepoint.toString(16).toUpperCase()}`)
    .join(',')
}

const renameFontScript = `
from fontTools.ttLib import TTFont
import sys

font = TTFont(sys.argv[1])
names = {
  1: "MJMap Glyphs",
  2: "Regular",
  3: "MJMap Glyphs Regular",
  4: "MJMap Glyphs Regular",
  6: "MJMapGlyphs-Regular",
  16: "MJMap Glyphs",
  17: "Regular",
}

for name in font["name"].names:
  if name.nameID in names:
    name.string = names[name.nameID].encode(name.getEncoding(), errors="replace")

font.save(sys.argv[2])
`

const ttfPath = requireEnv('IPAMJ_FONT_TTF_PATH')
const licensePath = requireEnv('IPAMJ_FONT_LICENSE_PATH')
const lookupPath = requireEnv('SHRINK_LOOKUP_PATH')
const outputPath = requireEnv('IPAMJ_FONT_OUTPUT_PATH')
const licenseOutputPath = requireEnv('IPAMJ_FONT_LICENSE_OUTPUT_PATH')
const tempDir = await mkdtemp(join(tmpdir(), 'mjmap-font-'))

try {
  const unicodePath = join(tempDir, 'unicodes.txt')
  const subsetPath = join(tempDir, 'subset.ttf')
  const renamedPath = join(tempDir, 'mjmap-glyphs.ttf')
  const lookup = JSON.parse(await readFile(lookupPath, 'utf8'))

  await mkdir(dirname(outputPath), { recursive: true })
  await mkdir(dirname(licenseOutputPath), { recursive: true })
  await writeFile(unicodePath, collectCodepoints(lookup))

  await run('python3', [
    '-m',
    'fontTools.subset',
    ttfPath,
    `--unicodes-file=${unicodePath}`,
    `--output-file=${subsetPath}`,
    '--layout-features=*',
    '--glyph-names',
    '--symbol-cmap',
    '--legacy-cmap',
    '--notdef-glyph',
    '--notdef-outline',
    '--recommended-glyphs',
    '--name-IDs=*',
    '--name-legacy',
    '--name-languages=*',
  ])

  await run('python3', ['-c', renameFontScript, subsetPath, renamedPath])
  await run('python3', [
    '-m',
    'fontTools.ttLib.woff2',
    'compress',
    renamedPath,
    '-o',
    outputPath,
  ])

  await copyFile(licensePath, licenseOutputPath)
  console.log(`Wrote ${outputPath}`)
  console.log(`Wrote ${licenseOutputPath}`)
} finally {
  await rm(tempDir, { force: true, recursive: true })
}
