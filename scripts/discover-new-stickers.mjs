import fs from "node:fs";
import path from "node:path";

const AUTHOR_ID = "6507349";
const DATA_FILE = path.resolve("src/data/stickers.json");
const IMAGE_DIR = path.resolve("public/images/stickers");
const MAX_SEED_PRODUCTS = 30;
const MAX_NEW_PRODUCTS = 50;

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  "Accept-Language": "ja-JP,ja;q=0.9",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
};
const imageHeaders = {
  ...headers,
  Referer: "https://store.line.me/",
  Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getHtml(url) {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  return await response.text();
}

function decodeHtml(text = "") {
  return text.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/gi, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;|&#160;/g, " ");
}

function normalizeHtml(html = "") {
  return decodeHtml(html)
    .replace(/\\\//g, "/")
    .replace(/\\u002F/gi, "/")
    .replace(/\\u003A/gi, ":")
    .replace(/\\u0026/gi, "&");
}

function cleanText(text = "") {
  return decodeHtml(text.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function extractProductLinks(html) {
  const found = new Map();
  const normalized = normalizeHtml(html);
  const pattern = /(?:https?:\/\/store\.line\.me)?\/stickershop\/product\/(\d+)(?:\/(?:ja|en|ko|th|zh-Hant|zh-Hans))?/gi;
  for (const match of normalized.matchAll(pattern)) {
    const id = match[1];
    found.set(id, `https://store.line.me/stickershop/product/${id}/ja`);
  }
  return [...found.entries()].map(([id, url]) => ({ id, url }));
}

function extractAuthorIds(html) {
  const normalized = normalizeHtml(html);
  const ids = new Set();
  const patterns = [
    /\/stickershop\/author\/(\d+)(?:\/(?:ja|en|ko|th|zh-Hant|zh-Hans))?/gi,
    /line\.me\/R\/shop\/sticker\/author\/(\d+)/gi,
    /["']authorId["']\s*:\s*["']?(\d+)["']?/gi,
    /["']author_id["']\s*:\s*["']?(\d+)["']?/gi,
    /["']creatorId["']\s*:\s*["']?(\d+)["']?/gi,
    /["']creator_id["']\s*:\s*["']?(\d+)["']?/gi,
  ];
  for (const pattern of patterns) {
    for (const match of normalized.matchAll(pattern)) ids.add(match[1]);
  }
  return [...ids];
}

function belongsToAuthor(html) {
  return extractAuthorIds(html).includes(AUTHOR_ID);
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

function parseProduct(id, url, html) {
  const title = pickMeta(html, "og:title") || cleanText(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "");
  const description = pickMeta(html, "description");
  const imageUrl = pickMeta(html, "og:image") || pickMeta(html, "twitter:image");
  const priceMatch = html.match(/(?:￥|¥)\s*([0-9,]+)\s*(?:円)?/i) || html.match(/([0-9,]+)\s*円/i);
  const price = priceMatch ? `￥${priceMatch[1]}` : "";
  return { id, title, description, price, url, purchaseUrl: url, giftUrl: url, imageUrl, image: "" };
}

function extensionFrom(contentType = "", imageUrl = "") {
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

async function downloadImage(product) {
  if (!product.imageUrl) return;
  const response = await fetch(product.imageUrl, { headers: imageHeaders });
  if (!response.ok) return;
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("image")) return;
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
  const ext = extensionFrom(contentType, product.imageUrl);
  const filename = `${product.id}${ext}`;
  fs.writeFileSync(path.join(IMAGE_DIR, filename), Buffer.from(await response.arrayBuffer()));
  product.image = `/images/stickers/${filename}`;
}

async function main() {
  const stickers = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  const existingIds = new Set(stickers.map((item) => String(item.id)));
  const seeds = [...stickers]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, MAX_SEED_PRODUCTS);

  console.log(`関連作品フォールバック探索: 種 ${seeds.length}作品`);
  const candidates = new Map();
  let ownSeedAuthorMatches = 0;

  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    try {
      const html = await getHtml(seed.url || seed.purchaseUrl);
      const authorIds = extractAuthorIds(html);
      const isOwn = authorIds.includes(AUTHOR_ID);
      if (isOwn) ownSeedAuthorMatches++;
      if (i < 5) console.log(`  種 ${seed.id} author IDs: ${authorIds.length ? authorIds.join(",") : "なし"} / 自作者判定=${isOwn}`);
      for (const candidate of extractProductLinks(html)) {
        if (!existingIds.has(candidate.id)) candidates.set(candidate.id, candidate.url);
      }
      console.log(`[${i + 1}/${seeds.length}] ${seed.id}: 未登録候補 累計${candidates.size}件`);
    } catch (error) {
      console.log(`[${i + 1}/${seeds.length}] ${seed.id}: 取得失敗 ${error.message}`);
    }
    await sleep(150);
  }

  console.log(`既知の自作品でauthor ID確認成功: ${ownSeedAuthorMatches}/${seeds.length}`);
  console.log(`未登録候補: ${candidates.size}件`);
  const additions = [];
  const rejectedAuthorIds = new Map();
  for (const [id, url] of candidates) {
    if (additions.length >= MAX_NEW_PRODUCTS) break;
    try {
      const html = await getHtml(url);
      const authorIds = extractAuthorIds(html);
      if (!authorIds.includes(AUTHOR_ID)) {
        const key = authorIds.join(",") || "なし";
        rejectedAuthorIds.set(key, (rejectedAuthorIds.get(key) || 0) + 1);
        continue;
      }
      const product = parseProduct(id, url, html);
      if (!product.title) continue;
      await downloadImage(product);
      additions.push(product);
      existingIds.add(id);
      console.log(`新作検出: ${id} ${product.title}`);
    } catch (error) {
      console.log(`候補 ${id} の確認失敗: ${error.message}`);
    }
    await sleep(200);
  }

  if (rejectedAuthorIds.size) {
    console.log(`除外候補のauthor ID分布: ${[...rejectedAuthorIds.entries()].map(([ids, count]) => `${ids}:${count}`).join(" / ")}`);
  }

  if (additions.length === 0) {
    console.log("関連作品経由の新作はありませんでした。");
    return;
  }

  const merged = [...additions, ...stickers]
    .filter((item, index, array) => array.findIndex((other) => String(other.id) === String(item.id)) === index)
    .sort((a, b) => Number(b.id) - Number(a.id))
    .map(({ imageUrl, ...item }) => item);

  fs.writeFileSync(DATA_FILE, JSON.stringify(merged, null, 2), "utf8");
  console.log(`追加: ${additions.length}作品 / 合計: ${merged.length}作品`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
