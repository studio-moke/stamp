import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import sharp from "sharp";

const DATA_FILE = path.resolve("src/data/stickers.json");
const OUTPUT_DIR = path.resolve("public/images/sticker-sheets");
const COLS = 5;
const ROWS = 8;
const CELL_W = 128;
const CELL_H = 100;
const WIDTH = COLS * CELL_W;
const HEIGHT = ROWS * CELL_H;
const CONCURRENCY = 2;
const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  "Accept-Language": "ja-JP,ja;q=0.9",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
};

function decodeHtml(text = "") {
  return text.replace(/&amp;/g, "&").replace(/\\\//g, "/").replace(/\\u002F/gi, "/").replace(/\\u003A/gi, ":").replace(/\\u0026/gi, "&");
}

function extractStickerUrls(html) {
  const normalized = decodeHtml(html);
  const byStickerId = new Map();
  const pattern = /(?:https?:)?\/\/stickershop\.line-scdn\.net\/stickershop\/v1\/sticker\/(\d+)\/android\/sticker\.png[^"'\\\s<)]*/gi;
  for (const match of normalized.matchAll(pattern)) {
    const raw = match[0].replace(/[;,]+$/, "");
    const url = raw.startsWith("//") ? `https:${raw}` : raw;
    if (!byStickerId.has(match[1])) byStickerId.set(match[1], url);
  }
  return [...byStickerId.values()].slice(0, 40);
}

async function getStickerUrlsFromMetadata(productId) {
  const metadataUrls = [
    `https://stickershop.line-scdn.net/stickershop/v1/product/${productId}/android/productInfo.meta`,
    `https://dl.stickershop.line.naver.jp/products/0/0/1/${productId}/android/productInfo.meta`,
  ];
  for (const metadataUrl of metadataUrls) {
    try {
      const metadata = JSON.parse((await fetchBuffer(metadataUrl)).toString("utf8"));
      const ids = Array.isArray(metadata.stickers) ? metadata.stickers.map((item) => String(item.id || "")).filter(Boolean) : [];
      if (ids.length) {
        return ids.slice(0, 40).map((id) => `https://stickershop.line-scdn.net/stickershop/v1/sticker/${id}/android/sticker.png`);
      }
    } catch (error) {
      console.log(`メタデータ取得再試行 ${productId}: ${error.message}`);
    }
  }
  return [];
}

async function fetchBuffer(url, extraHeaders = {}) {
  const response = await fetch(url, { headers: { ...headers, ...extraHeaders }, redirect: "follow", cache: "no-store" });
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function makeSheet(product) {
  const output = path.join(OUTPUT_DIR, `${product.id}.webp`);
  if (fs.existsSync(output)) return { status: "exists", id: product.id };

  let urls = [];
  for (let attempt = 1; attempt <= 4 && urls.length < 8; attempt++) {
    const requestUrl = attempt % 2 === 0 ? `${product.url}?from=sticker` : product.url;
    const html = (await fetchBuffer(requestUrl, { Referer: "https://store.line.me/" })).toString("utf8");
    urls = extractStickerUrls(html);
    if (urls.length < 8) await new Promise((resolve) => setTimeout(resolve, attempt * 900));
  }
  if (urls.length < 8) urls = await getStickerUrlsFromMetadata(product.id);
  if (urls.length < 8) throw new Error(`${product.id}: スタンプ画像を${urls.length}件しか検出できませんでした`);

  const layers = await Promise.all(urls.map(async (url, index) => {
    const source = await fetchBuffer(url, { Referer: product.url, Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8" });
    const image = await sharp(source).resize({ width: 112, height: 88, fit: "contain", withoutEnlargement: true }).png().toBuffer();
    return {
      input: image,
      left: Math.floor(index % COLS) * CELL_W + 8,
      top: Math.floor(index / COLS) * CELL_H + 6,
    };
  }));

  const watermark = Buffer.from(`<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs><pattern id="wm" width="210" height="115" patternUnits="userSpaceOnUse" patternTransform="rotate(-24)">
      <text x="8" y="58" font-family="Arial,sans-serif" font-size="18" font-weight="700" fill="rgba(255,255,255,.24)">STAMP MOKE</text>
    </pattern></defs><rect width="100%" height="100%" fill="url(#wm)"/>
  </svg>`);

  await sharp({ create: { width: WIDTH, height: HEIGHT, channels: 4, background: "#7696c4" } })
    .composite([...layers, { input: watermark, left: 0, top: 0 }])
    .webp({ quality: 72, effort: 5 })
    .toFile(output);
  return { status: "created", id: product.id, count: urls.length };
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const products = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  let created = 0;
  for (let offset = 0; offset < products.length; offset += CONCURRENCY) {
    const batch = products.slice(offset, offset + CONCURRENCY);
    const results = await Promise.allSettled(batch.map(makeSheet));
    for (const result of results) {
      if (result.status === "fulfilled") {
        if (result.value.status === "created") created++;
        console.log(`${result.value.status === "created" ? "作成" : "既存"}: ${result.value.id}${result.value.count ? ` (${result.value.count}個)` : ""}`);
      } else {
        console.error(`生成失敗: ${result.reason?.message || result.reason}`);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  console.log(`スタンプ一覧画像: 新規${created} / 合計${products.length}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
