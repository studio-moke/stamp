import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import sharp from "sharp";

const DATA_FILE = path.resolve("src/data/stickers.json");
const OUTPUT_DIR = path.resolve(process.env.STICKER_SHEET_OUTPUT || "public/images/sticker-sheets");
const SHEET_VERSION = "3";
const VERSION_FILE = path.join(OUTPUT_DIR, ".version");
const COLS = 4;
const ROWS = 10;
const CELL_W = 160;
const CELL_H = 128;
const WIDTH = COLS * CELL_W;
const HEIGHT = ROWS * CELL_H;
const CONCURRENCY = 2;
const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  "Accept-Language": "ja-JP,ja;q=0.9",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
};

function removeEdgeBars(source) {
  return sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(({ data, info }) => {
      const { width, height, channels } = info;
      const badColumns = new Set();
      for (let x = 0; x < width; x++) {
        let dark = 0;
        let visible = 0;
        for (let y = 0; y < height; y++) {
          const offset = (y * width + x) * channels;
          const alpha = data[offset + 3];
          if (alpha < 24) continue;
          visible++;
          if (data[offset] < 24 && data[offset + 1] < 24 && data[offset + 2] < 24 && alpha > 220) dark++;
        }
        // LINE画像の左右端に混入する縦長の黒帯だけを透明化する。
        if (visible > height * 0.72 && dark / visible > 0.94) badColumns.add(x);
      }
      for (const x of badColumns) {
        for (let y = 0; y < height; y++) data[(y * width + x) * channels + 3] = 0;
      }
      return sharp(data, { raw: info }).png().toBuffer();
    });
}

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

async function makeSheet(product, regenerateAll = false) {
  const output = path.join(OUTPUT_DIR, `${product.id}.webp`);
  if (!regenerateAll && fs.existsSync(output)) return { status: "exists", id: product.id };

  let urls = await getStickerUrlsFromMetadata(product.id);
  for (let attempt = 1; attempt <= 4 && urls.length < 8; attempt++) {
    const requestUrl = attempt % 2 === 0 ? `${product.url}?from=sticker` : product.url;
    const html = (await fetchBuffer(requestUrl, { Referer: "https://store.line.me/" })).toString("utf8");
    urls = extractStickerUrls(html);
    if (urls.length < 8) await new Promise((resolve) => setTimeout(resolve, attempt * 900));
  }
  if (urls.length < 8) throw new Error(`${product.id}: スタンプ画像を${urls.length}件しか検出できませんでした`);

  const layers = await Promise.all(urls.map(async (url, index) => {
    const source = await fetchBuffer(url, { Referer: product.url, Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8" });
    const cleaned = await removeEdgeBars(source);
    const image = await sharp(cleaned)
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 4 })
      .resize({
        width: 132,
        height: 102,
        fit: "contain",
        withoutEnlargement: true,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
    const metadata = await sharp(image).metadata();
    return {
      input: image,
      left: Math.floor(index % COLS) * CELL_W + Math.floor((CELL_W - metadata.width) / 2),
      top: Math.floor(index / COLS) * CELL_H + Math.floor((CELL_H - metadata.height) / 2),
    };
  }));

  const watermark = Buffer.from(`<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs><pattern id="wm" width="300" height="210" patternUnits="userSpaceOnUse" patternTransform="rotate(-22)">
      <text x="18" y="105" font-family="Arial,sans-serif" font-size="15" font-weight="700" letter-spacing="2" fill="rgba(255,255,255,.12)">STAMP MOKE</text>
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
  const allProducts = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  const limit = Number.parseInt(process.env.STICKER_SHEET_LIMIT || "0", 10);
  const products = limit > 0 ? allProducts.slice(0, limit) : allProducts;
  const regenerateAll = !fs.existsSync(VERSION_FILE) || fs.readFileSync(VERSION_FILE, "utf8").trim() !== SHEET_VERSION;
  if (regenerateAll) console.log(`一覧デザインをバージョン${SHEET_VERSION}へ更新します`);
  let created = 0;
  let failed = 0;
  for (let offset = 0; offset < products.length; offset += CONCURRENCY) {
    const batch = products.slice(offset, offset + CONCURRENCY);
    const results = await Promise.allSettled(batch.map((product) => makeSheet(product, regenerateAll)));
    for (const result of results) {
      if (result.status === "fulfilled") {
        if (result.value.status === "created") created++;
        console.log(`${result.value.status === "created" ? "作成" : "既存"}: ${result.value.id}${result.value.count ? ` (${result.value.count}個)` : ""}`);
      } else {
        failed++;
        console.error(`生成失敗: ${result.reason?.message || result.reason}`);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (failed > 0) throw new Error(`${failed}件の一覧画像を生成できませんでした`);
  fs.writeFileSync(VERSION_FILE, `${SHEET_VERSION}\n`);
  console.log(`スタンプ一覧画像: 新規${created} / 合計${products.length}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
