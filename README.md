# mjmap-searcher

日本の人名・住所で使われる異体字について、MJ縮退マップをもとに縮退先候補と縮退元候補を検索するシンプルな Web サービスです。

## 目的

このサービスは、本人確認（eKYC）などで人名・住所に含まれる異体字を扱うための補助ツールです。

主な用途:

- 珍しい字体から、縮退先となる候補文字を探す
- 一般的な文字から、その文字へ縮退される候補文字を探す

## データソース

- MJ縮退マップ: https://moji.or.jp/mojikiban/map/
- MJ文字情報一覧表: https://moji.or.jp/mojikiban/mjlist/

このプロジェクトでは、MJ縮退マップを縮退・代替候補の対応表として利用します。掲載されている文字同士が、法的・意味的に常に同一であると主張するものではありません。

## 出典・ライセンス表示

このプロジェクトは、IPAの著作物である文字情報基盤 縮退マップ（MJ縮退マップ）を利用して生成した検索データを使用しています。

MJ縮退マップの出典は https://moji.or.jp/mojikiban/map/ です。著作権者は IPA です。MJ縮退マップは、クリエイティブ・コモンズ 表示-継承 2.1 日本 ライセンス（CC BY-SA 2.1 JP）で提供されています。ライセンスの内容は https://creativecommons.org/licenses/by-sa/2.1/jp/ を参照してください。

上流データの免責事項:

IPAは、利用者がMJ縮退マップを用いて行う一切の行為について何ら責任を負いません。また、MJ縮退マップの利用または利用不能によって生じた損害について何ら責任を負いません。

## リポジトリのライセンス

このリポジトリのソースコードは MIT License です。詳細は `LICENSE` を参照してください。

MJ縮退マップ、MJ文字情報一覧表、およびそれらから生成した検索データは、このリポジトリの MIT License の対象ではありません。配布する場合は、上流データのライセンス条件に従ってください。

コミット済みの `data/shrink-lookup.json` は、MJ関連データから生成した検索データです。詳細は `data/README.md` を参照してください。

## ローカル開発

依存関係をインストールします。

```sh
pnpm install
```

ローカルにダウンロードした元データから検索用ファイルを生成します。

```sh
SHRINK_MAP_PATH=MJShrinkMap.1.2.0.json \
SHRINK_LOOKUP_PATH=data/shrink-lookup.json \
MJ_LIST_PATH=mji.00602.xlsx \
pnpm build:lookup
```

`SHRINK_MAP_PATH` には縮退関係を含むファイルを指定します。`SHRINK_LOOKUP_PATH` には生成される検索用ファイルの出力先を指定します。

`MJ_LIST_PATH` を指定すると、MJ文字情報一覧表を使って `MJ文字図形名` を実際の Unicode 文字列または IVS 付き文字列に解決します。

引数で明示的に指定することもできます。

```sh
pnpm build:lookup MJShrinkMap.1.2.0.json data/shrink-lookup.json mji.00602.xlsx
```

ローカルの Vite/Hono サーバーを起動します。

```sh
pnpm dev
```

テストを実行します。

```sh
pnpm test
```

型チェックを実行します。

```sh
pnpm typecheck
```

デプロイ時に元データをダウンロードしなくても動作するように、生成済みの検索用ファイルを `data/shrink-lookup.json` としてコミットしています。

## Cloudflare Workers

このプロジェクトは Cloudflare Workers と Workers Static Assets で動作します。`data/shrink-lookup.json` は Worker script に直接 bundle せず、Static Assets binding の `ASSETS` から初回リクエスト時に読み込みます。これにより Worker 本体のサイズを小さく保ちます。

Cloudflare Workers の Git 連携では、以下の設定にしてください。

Build command:

```sh
pnpm build
```

Deploy command:

```sh
pnpm exec wrangler deploy
```

Worker 名は `wrangler.jsonc` の `name` と同じ `moji` にしてください。Hono の自動検出に任せず、リポジトリ内の `wrangler.jsonc` と `vite.config.ts` を使ってデプロイします。

手元から Wrangler でデプロイする場合は、Cloudflare にログインした状態で以下を実行します。

```sh
pnpm run deploy
```

`pnpm deploy` は pnpm の組み込みコマンドとして解釈されるため、このプロジェクトの deploy script は実行されません。

## API

```http
GET /api/shrink?char=濵
```

入力された 1 文字に対する縮退先候補を返します。`櫛󠄁` のような IVS 付き文字は、1 つの検索単位として扱います。

`curl` で確認する場合は、非 ASCII のクエリ値をパーセントエンコードしてください。

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

入力された文字に縮退される候補文字を返します。

```json
[
  {
    "char": "濵",
    "codepoint": "U+6FF5"
  }
]
```

候補がない場合は空配列を返します。

```json
[]
```

候補の順序は実社会での利用頻度ではなく、データ上の優先度にもとづきます。生成処理では、関係の種類、`ホップ数`、`順位`、IVS の有無、補助平面文字の有無、MJ ID の順序などを使って並び替えています。

不正な入力の場合は `400 Bad Request` を返します。

```json
{
  "error": "invalid_char",
  "message": "char must be exactly one Unicode character or ideographic variation sequence"
}
```
