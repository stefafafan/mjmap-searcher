# mjmap-searcher

A simple web service for finding and selecting Japanese character shrink candidates.

## Goal

The service helps users handle characters such as name/address variants by using MJ縮退マップ as the primary data source.

Use cases:

- Find the common character a rare character can shrink to
- Find rare characters that shrink to a given common character

## Data Source

- MJ縮退マップ: https://moji.or.jp/mojikiban/map/
- MJ文字情報一覧表: https://moji.or.jp/mojikiban/mjlist/

This project treats MJ縮退マップ as a shrink/fallback mapping, not as a claim that all listed characters are legally or semantically identical.

## Source Attribution

MJ縮退マップ is provided under CC BY-SA 2.1 JP, formally the Creative Commons Attribution-ShareAlike 2.1 Japan license.

When using this data, explicitly state that MJ縮退マップ is a copyrighted work of IPA.

Suggested attribution:

```text
本サービスは、IPAの著作物である文字情報基盤 縮退マップ（MJ縮退マップ）を利用して生成した検索データを使用しています。
MJ縮退マップはクリエイティブ・コモンズ 表示 - 継承 2.1 日本 ライセンス（CC BY-SA 2.1 JP）で提供されています。
```

License:

- CC BY-SA 2.1 JP: https://creativecommons.org/licenses/by-sa/2.1/jp/

Upstream disclaimer:

- IPA does not accept responsibility for results caused by applying, or being unable to apply, the dataset.

## Repository License

Project source code is licensed under the MIT License. See `LICENSE`.

MJ縮退マップ source data, MJ文字情報一覧表 source data, and generated lookup data derived from those sources are not MIT-licensed project code. If distributed, MJ縮退マップ-derived data must be handled under the applicable upstream data terms, including CC BY-SA 2.1 JP and the required IPA attribution.

The committed `data/shrink-lookup.json` file is generated MJ-derived data. See `NOTICE.md` and `data/README.md` for details.

## Local Development

Install dependencies:

```sh
pnpm install
```

Generate the local lookup file from locally downloaded source files:

```sh
SHRINK_MAP_PATH=MJShrinkMap.1.2.0.json \
SHRINK_LOOKUP_PATH=data/shrink-lookup.json \
MJ_LIST_PATH=mji.00602.xlsx \
pnpm build:lookup
```

`SHRINK_MAP_PATH` contains the shrink relationships. `SHRINK_LOOKUP_PATH` controls where the generated lookup file is written.

Set `MJ_LIST_PATH` to use MJ文字情報一覧表 for resolving `MJ文字図形名` entries into actual Unicode/IVS strings.

You can also pass explicit paths:

```sh
pnpm build:lookup MJShrinkMap.1.2.0.json data/shrink-lookup.json mji.00602.xlsx
```

Start the local Vite/Hono server:

```sh
pnpm dev
```

Run tests:

```sh
pnpm test
```

Run type checking:

```sh
pnpm typecheck
```

The generated lookup is committed at `data/shrink-lookup.json` so the site can run without downloading source datasets at deployment time. The runtime imports this JSON file directly so it can be bundled for Cloudflare Workers.

## APIs

```http
GET /api/shrink?char=濵
```

Returns shrink candidates for one input character. An ideographic variation sequence, such as `櫛󠄁`, is treated as one lookup unit.

With `curl`, percent-encode non-ASCII query values:

```sh
curl 'http://127.0.0.1:5173/api/shrink?char=%E6%BF%B5'
```

```json
[
  {
    "char": "浜",
    "codepoint": "U+6D5C"
  }
]
```

```http
GET /api/reverse?char=浜
```

Returns characters that can shrink to the given character.

```json
[
  {
    "char": "濵",
    "codepoint": "U+6FF5"
  }
]
```

If there are no candidates, the API returns an empty array.

```json
[]
```

Candidates are ordered by administrative/source priority, not real-world usage frequency. The generated lookup uses signals such as relation source, `ホップ数`, `順位`, IVS usage, supplementary-plane usage, and MJ ID order.

Invalid input should return `400 Bad Request`.

```json
{
  "error": "invalid_char",
  "message": "char must be exactly one Unicode character or ideographic variation sequence"
}
```
