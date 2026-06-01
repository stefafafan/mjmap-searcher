# Notices

## Project Code

The source code in this repository is licensed under the MIT License. See `LICENSE`.

## MJ縮退マップ

This project is designed to use 文字情報基盤 縮退マップ（MJ縮退マップ） as a source dataset.

MJ縮退マップ is a copyrighted work of IPA and is provided under CC BY-SA 2.1 JP, formally the Creative Commons Attribution-ShareAlike 2.1 Japan license.

Attribution:

```text
本サービスは、IPAの著作物である文字情報基盤 縮退マップ（MJ縮退マップ）を利用して生成した検索データを使用しています。
MJ縮退マップはクリエイティブ・コモンズ 表示 - 継承 2.1 日本 ライセンス（CC BY-SA 2.1 JP）で提供されています。
```

Source:

- https://moji.or.jp/mojikiban/map/

License:

- https://creativecommons.org/licenses/by-sa/2.1/jp/

Upstream disclaimer:

- IPA does not accept responsibility for results caused by applying, or being unable to apply, the dataset.

## MJ文字情報一覧表

This project can also use MJ文字情報一覧表 to resolve MJ文字図形名 entries into
Unicode/IVS strings during lookup generation.

Source:

- https://moji.or.jp/mojikiban/mjlist/

## Generated Data

The committed `data/shrink-lookup.json` file and any other generated lookup files derived from MJ縮退マップ or MJ文字情報一覧表 are not covered by this repository's MIT License.

If generated data is distributed, publish it under the applicable upstream data license terms, including CC BY-SA 2.1 JP for MJ縮退マップ-derived data, with the required attribution above.

See `data/README.md` for the data-specific notice.
