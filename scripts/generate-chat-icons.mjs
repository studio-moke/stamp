import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const DATA_FILE = path.resolve("src/data/stickers.json");
const OUTPUT_ROOT = path.resolve("public/images/chat-icons");
const VERSION = "1";
const VERSION_FILE = path.join(OUTPUT_ROOT, ".version");
const PRODUCT_CONCURRENCY = 2;
const IMAGE_BATCH_SIZE = 8;
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
  const found = new Map();
  const pattern = /(?:https?:)?\/\/stickershop\.line-scdn\.net\/stickershop\/v1\/sticker\/(\d+)\/android\/sticker\.png[^"'\\\s<)]*/gi;
  for (const match of normalized.matchAll(pattern)) {
    const raw = match[0].replace(/[;,]+$/, "");
    const url = raw.startsWith("//") ? `https:${raw}` : raw;
    if (!found.has(match[1])) found.set(match[1], { id: match[1], url });
  }
  return [...found.values()].slice(0, 40);
}

async function fetchBuffer(url, extraHeaders = {}) {
  const response = await fetch(url, { headers: { ...headers, ...extraHeaders }, redirect: "follow", cache: "no-store" });
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function getStickerItems(product) {
  const metadataUrls = [
    `https://stickershop.line-scdn.net/stickershop/v1/product/${product.id}/android/productInfo.meta`,
    `https://dl.stickershop.line.naver.jp/products/0/0/1/${product.id}/android/productInfo.meta`,
  ];
  for (const metadataUrl of metadataUrls) {
    try {
      const metadata = JSON.parse((await fetchBuffer(metadataUrl)).toString("utf8"));
      const ids = Array.isArray(metadata.stickers) ? metadata.stickers.map((item) => String(item.id || "")).filter(Boolean) : [];
      if (ids.length) return ids.slice(0, 40).map((id) => ({ id, url: `https://stickershop.line-scdn.net/stickershop/v1/sticker/${id}/android/sticker.png` }));
    } catch (error) {
      console.log(`メタデータ取得再試行 ${product.id}: ${error.message}`);
    }
  }

  for (let attempt = 1; attempt <= 4; attempt++) {
    const requestUrl = attempt % 2 === 0 ? `${product.url}?from=sticker` : product.url;
    const html = (await fetchBuffer(requestUrl, { Referer: "https://store.line.me/" })).toString("utf8");
    const items = extractStickerUrls(html);
    if (items.length >= 8) return items;
    await new Promise((resolve) => setTimeout(resolve, attempt * 900));
  }
  return [];
}

async function removeEdgeBars(source) {
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
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
    if (visible > height * 0.72 && dark / visible > 0.94) badColumns.add(x);
  }
  for (const x of badColumns) for (let y = 0; y < height; y++) data[(y * width + x) * channels + 3] = 0;
  return sharp(data, { raw: info }).png().toBuffer();
}

async function makeSquarePng(source) {
  const cleaned = await removeEdgeBars(source);
  const metadata = await sharp(cleaned).metadata();
  const width = metadata.width || 1;
  const height = metadata.height || 1;
  const side = Math.max(width, height);
  const left = Math.floor((side - width) / 2);
  const right = side - width - left;
  const top = Math.floor((side - height) / 2);
  const bottom = side - height - top;
  return sharp(cleaned)
    .ensureAlpha()
    .extend({ top, bottom, left, right, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function writeIcon(product, item, index, dir) {
  const source = await fetchBuffer(item.url, { Referer: product.url, Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8" });
  const square = await makeSquarePng(source);
  const filename = `${String(index + 1).padStart(2, "0")}-${item.id}.png`;
  fs.writeFileSync(path.join(dir, filename), square);
}

async function generateProduct(product, regenerateAll = false) {
  const dir = path.join(OUTPUT_ROOT, String(product.id));
  const existing = fs.existsSync(dir) ? fs.readdirSync(dir).filter((name) => name.endsWith(".png")) : [];
  if (!regenerateAll && existing.length >= 8) return { status: "exists", id: product.id, count: existing.length };

  const items = await getStickerItems(product);
  if (items.length < 8) throw new Error(`${product.id}: スタンプ画像を${items.length}件しか検出できませんでした`);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  for (let offset = 0; offset < items.length; offset += IMAGE_BATCH_SIZE) {
    const batch = items.slice(offset, offset + IMAGE_BATCH_SIZE);
    await Promise.all(batch.map((item, batchIndex) => writeIcon(product, item, offset + batchIndex, dir)));
    if (offset + IMAGE_BATCH_SIZE < items.length) await new Promise((resolve) => setTimeout(resolve, 120));
  }
  return { status: "created", id: product.id, count: items.length };
}

async function main() {
  fs.mkdirSync(OUTPUT_ROOT, { recursive: true });
  const products = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  const regenerateAll = !fs.existsSync(VERSION_FILE) || fs.readFileSync(VERSION_FILE, "utf8").trim() !== VERSION;
  let created = 0;
  let failed = 0;

  for (let offset = 0; offset < products.length; offset += PRODUCT_CONCURRENCY) {
    const batch = products.slice(offset, offset + PRODUCT_CONCURRENCY);
    const results = await Promise.allSettled(batch.map((product) => generateProduct(product, regenerateAll)));
    for (const result of results) {
      if (result.status === "fulfilled") {
        if (result.value.status === "created") created++;
        console.log(`${result.value.status === "created" ? "作成" : "既存"}: ${result.value.id} (${result.value.count}個)`);
      } else {
        failed++;
        console.error(`生成失敗: ${result.reason?.message || result.reason}`);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  if (failed > 0) throw new Error(`${failed}件のチャット用アイコンを生成できませんでした`);
  fs.writeFileSync(VERSION_FILE, `${VERSION}\n`);
  console.log(`Slack・Teams・Discord用アイコン: 新規${created} / 合計${products.length}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
