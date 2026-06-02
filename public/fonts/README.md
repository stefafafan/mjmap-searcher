# 検索画面用 Web フォント

`mjmap-glyphs.woff2` は、IPAmj明朝フォント v006.01 から、このプロジェクトの検索データに現れる文字を対象に subset 化して生成した Web フォントです。ファイル名は `mjmap-glyphs.woff2` です。

この Web フォントは、IPAフォントライセンス v1.0 上は派生プログラムとして扱い、同ライセンスの条件で提供します。ライセンス本文は `IPA_Font_License_Agreement_v1.0.txt` を参照してください。

元になったオリジナル・プログラムは IPAmj明朝フォントです。配布元は https://moji.or.jp/mojikiban/font/ です。

この Web フォントをオリジナル・プログラムに置き換える場合は、上記配布元から IPAmj明朝フォントを取得し、Web フォントとして配信できる形式に変換したうえで、`src/page.ts` の `@font-face` を置き換えてください。

この Web フォントは `scripts/build-font.mjs` で生成しています。生成処理は一時ファイルを作成しますが、このリポジトリで再加工用の追加ファイルとして保持しているものはありません。再生成する場合は、IPAmj明朝フォント、IPAフォントライセンス本文、`data/shrink-lookup.json` を用意して `README.md` の手順を実行してください。

この Web フォント、IPAmj明朝フォント、および IPAフォントライセンス v1.0 の対象物は、このリポジトリの MIT License の対象ではありません。
