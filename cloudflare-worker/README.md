# stamp-moke free asset AI Worker

フリー素材管理のAI画像解析をVercel FunctionからCloudflare Workerへ分離するためのWorkerです。

## Cloudflare側で必要な設定

- R2 binding: `FREE_ASSETS` -> `stamp-moke-free-assets`（wrangler.tomlで設定済み）
- Secret: `OPENAI_API_KEY`
- Secret: `FREE_ADMIN_TOKEN`（Vercel側と同じ値）
- Optional var: `OPENAI_MODEL`

## 初回デプロイ

```bash
cd cloudflare-worker
npm install
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put FREE_ADMIN_TOKEN
npx wrangler deploy
```

デプロイ後に発行されたWorker URLの `/health` で状態確認できます。

## API

`POST /analyze`

Headers:

- `Content-Type: application/json`
- `x-admin-token: <FREE_ADMIN_TOKEN>`

Body例:

```json
{
  "filename": "sample.png",
  "width": 1200,
  "height": 1200,
  "previewKey": "free-assets/previews/...png",
  "characterHint": "",
  "platformHint": ""
}
```

WorkerはR2からプレビューを直接読み、OpenAI Responses APIへ送ります。原本画像はWorkerへ送信しません。

## 切替方針

最初は既存Vercelの `action=analyze` を残したまま、管理画面のAI解析呼び出しだけWorkerへ切り替えます。Workerが安定稼働することを確認してからVercel側のAI解析コードを削除します。
