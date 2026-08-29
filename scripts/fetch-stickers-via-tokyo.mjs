import fs from "node:fs";
import path from "node:path";

const DATA_FILE = path.resolve("src/data/stickers.json");
const IMAGE_DIR = path.resolve("public/images/stickers");
const FEED_URL = process.env.LINE_TOKYO_CATALOG_URL || "https://stamp-moke.jp/api/line-author";
const EXPECTED_REGION = process.env.LINE_TOKYO_EXPECTED_REGION || "hnd1";
const RETRIES = Number(process.env.LINE_TOKYO_RETRIES || 12);
const RETRY_DELAY_MS = Number(process.env.LINE_TOKYO_RETRY_DELAY_MS || 10000);
const MIN_CATALOG_COUNT = Number(process.env.LINE_TOKYO_MIN_CATALOG_COUNT || 37);

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  "Accept-Language": "ja-JP,ja;q=0.9,en;q=0.5",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};
const imageHeaders = {
  ...headers,
  Referer: "https://store.line.me/",
  Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const productUrl = (id) => `https://store.line.me/stickershop/product/${id}/ja`;

function decodeHtml(text = "") {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;|&#160;/g, " ");
}

function cleanText(text = "") {
  return decodeHtml(text.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function normalizeHtml(html = "") {
  return decodeHtml(html).replace(/\\\//g, "/").replace(/\\u002F/gi, "/").replace(/\\u003A/gi, ":").replace(/\\u0026/gi, "&");
}

function extractAuthorIds(html = "") {
  const normalized = normalizeHtml(html);
  const ids = new Set();
  const patterns = [
    /\/stickershop\/author\/(\d+)(?:\/(?:ja|en|ko|th|zh-Hant|zh-Hans|id))?/gi,
    /["']authorId["']\s*:\s*["']?(\d+)["']?/gi,
    /["']author_id["']\s*:\s*["']?(\d+)["']?/gi,
    /["']creatorId["']\s*:\s*["']?(\d+)["']?/gi,
    /["']creator_id["']\s*:\s*["']?(\d+)["']?/gi,
  ];
  for (const pattern of patterns) for (const match of normalized.matchAll(pattern)) ids.add(match[1]);
  return [...ids];
}

function pickMeta(html, property) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return cleanText(match[1]);
  }
  return "";
}

function getExtension(contentType = "", imageUrl = "") {
  const type = contentType.toLowerCase();
  if (type.includes("webp")) return ".webp";
  if (type.includes("jpeg") || type.includes("jpg")) return ".jpg";
  if (type.includes("gif")) return ".gif";
  if (type.includes("png")) return ".png";
  const clean = imageUrl.split("?")[0].toLowerCase();
  if (clean.endsWith(".webp")) return ".webp";
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return ".jpg";
  if (clean.endsWith(".gif")) return ".gif";
  return ".png";
}

async function fetchCatalog() {
  let lastError = null;
  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    try {
      const response = await fetch(`${FEED_URL}?t=${Date.now()}`, { headers: { Accept: "application/json" }, cache: "no-store", redirect: "follow" });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const data = await response.json();
      if (EXPECTED_REGION && data.region !== EXPECTED_REGION) throw new Error(`unexpected region: ${data.region || "unknown"}`);
      if (!Array.isArray(data.products)) throw new Error("products is not an array");
      if (data.products.length < MIN_CATALOG_COUNT) throw new Error(`catalog too small: ${data.products.length}`);
      return data;
    } catch (error) {
      lastError = error;
      console.log(`東京カタログ取得 ${attempt}/${RETRIES} 失敗: ${error.message}`);
      if (attempt < RETRIES) await sleep(RETRY_DELAY_MS);
    }
  }
  throw lastError || new Error("Tokyo catalog unavailable");
}

async function fetchProduct(id) {
  const url = productUrl(id);
  const response = await fetch(url, { headers, cache: "no-store", redirect: "follow" });
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  const html = await response.text();
  const authorIds = extractAuthorIds(html);
  if (!authorIds.includes("6507349")) throw new Error(`author mismatch: ${authorIds.join(",") || "none"}`);

  const title = pickMeta(html, "og:title") || cleanText(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "");
  const description = pickMeta(html, "description");
  const imageUrl = pickMeta(html, "og:image") || pickMeta(html, "twitter:image");
  const priceMatch = html.match(/(?:￥|¥)\s*([0-9,]+)\s*(?:円)?/i) || html.match(/([0-9,]+)\s*円/i);
  const product = {
    id: String(id),
    title,
    description,
    price: priceMatch ? `￥${priceMatch[1]}` : "",
    url,
    purchaseUrl: url,
    giftUrl: url,
    image: "",
  };

  if (imageUrl) {
    try {
      const imageResponse = await fetch(imageUrl, { headers: imageHeaders, redirect: "follow" });
      if (imageResponse.ok && (imageResponse.headers.get("content-type") || "").includes("image")) {
        fs.mkdirSync(IMAGE_DIR, { recursive: true });
        const filename = `${id}${getExtension(imageResponse.headers.get("content-type") || "", imageUrl)}`;
        fs.writeFileSync(path.join(IMAGE_DIR, filename), Buffer.from(await imageResponse.arrayBuffer()));
        product.image = `/images/stickers/${filename}`;
      }
    } catch (error) {
      console.log(`画像取得失敗 ${id}: ${error.message}`);
    }
  }

  return product;
}

async function main() {
  const existing = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  if (!Array.isArray(existing)) throw new Error("stickers.json is not an array");
  const byId = new Map(existing.map((item) => [String(item.id), item]));

  console.log("=================================");
  console.log(" STAMP MOKE 東京リージョン一覧取得");
  console.log("=================================");
  console.log(`既存: ${existing.length}作品`);
  console.log(`Feed: ${FEED_URL}`);

  const catalog = await fetchCatalog();
  console.log(`Vercel region: ${catalog.region}`);
  console.log(`LINE表示件数: ${catalog.visibleCount ?? "不明"}`);
  console.log(`取得商品ID: ${catalog.products.length}`);
  console.log(`ページ: ${JSON.stringify(catalog.pages)}`);

  const missing = catalog.products.filter((item) => item?.id && !byId.has(String(item.id)));
  console.log(`未登録候補: ${missing.length}作品`);

  let added = 0;
  for (const item of missing) {
    try {
      const product = await fetchProduct(item.id);
      byId.set(String(product.id), product);
      added += 1;
      console.log(`★ 東京一覧から追加: ${product.id} ${product.title}`);
      await sleep(200);
    } catch (error) {
      console.log(`追加失敗 ${item.id}: ${error.message}`);
    }
  }

  if (added) {
    const merged = [...byId.values()].sort((a, b) => Number(b.id) - Number(a.id));
    fs.writeFileSync(DATA_FILE, JSON.stringify(merged, null, 2), "utf8");
    console.log(`作品数: ${existing.length} → ${merged.length}`);
  } else {
    console.log(`作品数: ${existing.length}（変更なし）`);
  }

  if (catalog.visibleCount && catalog.products.length < catalog.visibleCount) {
    throw new Error(`東京一覧の取得件数がLINE表示件数に不足しています: ${catalog.products.length}/${catalog.visibleCount}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
