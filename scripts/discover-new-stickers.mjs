import fs from "node:fs";
import path from "node:path";

const AUTHOR_ID = "6507349";
const DATA_FILE = path.resolve("src/data/stickers.json");
const IMAGE_DIR = path.resolve("public/images/stickers");
const BOOTSTRAP_PRODUCT_IDS = ["36119361"];
const MAX_OWN_PAGES = 120;
const MAX_CANDIDATE_CHECKS = 800;

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
const productUrl = (id) => `https://store.line.me/stickershop/product/${id}/ja`;

async function getHtml(url) {
  const response = await fetch(url, { headers, redirect: "follow" });
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  return await response.text();
}
function decodeHtml(text = "") {
  return text.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/gi, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;|&#160;/g, " ");
}
function normalizeHtml(html = "") {
  return decodeHtml(html).replace(/\\\//g, "/").replace(/\\u002F/gi, "/").replace(/\\u003A/gi, ":").replace(/\\u0026/gi, "&");
}
function cleanText(text = "") {
  return decodeHtml(text.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}
function extractProductIds(html) {
  const ids = new Set();
  const normalized = normalizeHtml(html);
  for (const match of normalized.matchAll(/(?:https?:\/\/store\.line\.me)?\/stickershop\/product\/(\d+)(?:\/(?:ja|en|ko|th|zh-Hant|zh-Hans))?/gi)) ids.add(match[1]);
  return [...ids];
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
function parseProduct(id, html) {
  const url = productUrl(id);
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
  const filename = `${product.id}${extensionFrom(contentType, product.imageUrl)}`;
  fs.writeFileSync(path.join(IMAGE_DIR, filename), Buffer.from(await response.arrayBuffer()));
  product.image = `/images/stickers/${filename}`;
}

async function main() {
  const stickers = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  const existingIds = new Set(stickers.map((item) => String(item.id)));
  const checked = new Set();
  const queued = new Set();
  const queue = [];
  const additions = [];
  const ownPages = [];

  const enqueue = (id, priority = false) => {
    id = String(id);
    if (!/^\d+$/.test(id) || checked.has(id) || queued.has(id)) return;
    queued.add(id);
    priority ? queue.unshift(id) : queue.push(id);
  };

  for (const id of BOOTSTRAP_PRODUCT_IDS) enqueue(id, true);
  for (const item of [...stickers].sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 30)) enqueue(item.id);

  console.log("=================================");
  console.log(" STAMP MOKE 未登録作品バックフィル");
  console.log("=================================");
  console.log(`既存: ${stickers.length}作品 / 起点: ${BOOTSTRAP_PRODUCT_IDS.join(", ")}`);

  let candidateChecks = 0;
  while (queue.length && ownPages.length < MAX_OWN_PAGES && candidateChecks < MAX_CANDIDATE_CHECKS) {
    const id = queue.shift();
    queued.delete(id);
    if (checked.has(id)) continue;
    checked.add(id);
    candidateChecks++;

    try {
      const html = await getHtml(productUrl(id));
      const authorIds = extractAuthorIds(html);
      const isOwn = authorIds.includes(AUTHOR_ID);
      if (!isOwn) {
        if (candidateChecks <= 20 || candidateChecks % 100 === 0) console.log(`除外 ${id} author=${authorIds.join(",") || "なし"}`);
        await sleep(40);
        continue;
      }

      ownPages.push(id);
      const linkedIds = extractProductIds(html);
      console.log(`自作品 ${id} / 関連ID ${linkedIds.length}件 / 自作品到達 ${ownPages.length}`);
      for (const linkedId of linkedIds) enqueue(linkedId);

      if (!existingIds.has(id)) {
        const product = parseProduct(id, html);
        if (product.title) {
          await downloadImage(product);
          additions.push(product);
          existingIds.add(id);
          console.log(`★ 未登録作品を追加: ${id} ${product.title}`);
        }
      }
    } catch (error) {
      if (candidateChecks <= 20 || candidateChecks % 100 === 0) console.log(`取得失敗 ${id}: ${error.message}`);
    }
    await sleep(60);
  }

  console.log(`確認候補: ${candidateChecks}件 / 自作品ページ: ${ownPages.length}件 / 新規追加: ${additions.length}件`);
  if (!additions.length) {
    console.log("追加対象はありませんでした。");
    return;
  }

  const merged = [...additions, ...stickers]
    .filter((item, index, array) => array.findIndex((other) => String(other.id) === String(item.id)) === index)
    .sort((a, b) => Number(b.id) - Number(a.id))
    .map(({ imageUrl, ...item }) => item);
  fs.writeFileSync(DATA_FILE, JSON.stringify(merged, null, 2), "utf8");
  console.log(`バックフィル完了: +${additions.length} / 合計 ${merged.length}作品`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
