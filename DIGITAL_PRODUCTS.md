# stamp moke デジタル素材販売

## 基本方針

- 商品マスターは `src/data/stickers.json` を起点に自動生成する。
- 価格はサーバー側で一律 500円（税込）に固定する。
- Stripe は決済だけを担当し、商品・ZIP・購入記録は stamp moke 側で管理する。
- 販売ZIPは Cloudflare R2 の `digital-products/` 配下に保存する。
- ZIPのない商品は決済できない。

## 元PNGからZIPを作る

元PNGはGitHubにコミットしない。ローカルに次の形で配置する。

```text
digital-products-source/
└ 36361558/
   ├ 01.png
   ├ 02.png
   ├ ...
   └ 40.png
```

40点以外の商品だけ、同じフォルダに `product.json` を置く。

```json
{
  "expectedCount": 24,
  "publish": false
}
```

R2環境変数を読み込んだ状態で実行する。

```bash
npm run materials:package
```

1商品だけ処理する場合:

```bash
npm run materials:package -- 36361558
```

処理内容:

1. PNG枚数を確認する（既定40点）。
2. 各ファイルのPNGシグネチャを検証する。
3. `png/01.png ...`、`README.txt`、`LICENSE.txt`、`manifest.json` をZIP化する。
4. ZIPのSHA-256から固有キーを作り、R2へ1回だけ保存する。
5. `src/data/digital-product-overrides.json` に `zipKey`、`assetCount`、`packagedAt` を記録する。
6. `product.json` の `publish: true`、または明示的な自動公開設定がない限り販売は開始しない。

## 公開条件

API側では次のすべてを満たす商品のみ購入可能にする。

- `published: true`
- `assetCount > 0`
- `zipKey` が `digital-products/<商品ID>/...zip` の形式

これにより、LINE STOREの代表画像やプレビューシートだけでは販売できない。

## 本番販売に必要な環境変数

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STORE_ORIGIN`
- `R2_ACCOUNT_ID`
- `R2_BUCKET_NAME`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`

`AUTO_PUBLISH_DIGITAL_PRODUCTS=1` は、元PNGの確認工程が安定するまで本番では設定しない。
