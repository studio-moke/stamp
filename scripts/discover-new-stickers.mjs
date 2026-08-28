import fs from "node:fs";
import path from "node:path";

const AUTHOR_ID = "6507349";
const DATA_FILE = path.resolve("src/data/stickers.json");
const IMAGE_DIR = path.resolve("public/images/stickers");
// Recent catalog entries are explicit seeds because LINE may return an empty
// second author page to automated runners. Their product pages still expose
// the creator's other works, allowing the complete catalog graph to be found.
const BOOTSTRAP_PRODUCT_IDS = [
  "36149581", "36143733", "36142235", "36137158", "36136531", "36136296",
  "36135034", "36130275", "36129011", "36125569", "36106671", "36119361",
];
const MAX_OWN_PAGES = 400;
const MAX_CANDIDATE_CHECKS = 4000;
const CONCURRENCY = 8;

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  "Accept-Language": "ja-JP,ja;q=0.9",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
};
const imageHeaders = { ...headers, Referer: "https://store.line.me/", Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8" };
const productUrl = (id) => `https://store.line.me/stickershop/product/${id}/ja`;

async function getHtml(url) {
  const response = await fetch(url, { headers, redirect: "follow" });
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  return await response.text();
}
function decodeHtml(text = "") { return text.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/gi, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;|&#160;/g, " "); }
function normalizeHtml(html = "") { return decodeHtml(html).replace(/\\\//g, "/").replace(/\\u002F/gi, "/").replace(/\\u003A/gi, ":").replace(/\\u0026/gi, "&"); }
function cleanText(text = "") { return decodeHtml(text.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()); }
function extractProductIds(html) {
  const ids = new Set();
  const normalized = normalizeHtml(html);
  for (const match of normalized.matchAll(/(?:https?:\/\/store\.line\.me)?\/stickershop\/product\/(\d+)(?:\/(?:ja|en|ko|th|zh-Hant|zh-Hans))?/gi)) ids.add(match[1]);
  for (const match of normalized.matchAll(/(?:productId|product_id|stickerId|sticker_id)["']?\s*[:=]\s*["']?(\d{6,})/gi)) ids.add(match[1]);
  return [...ids];
}
function extractAuthorIds(html) {
  const normalized = normalizeHtml(html); const ids = new Set();
  const patterns = [/\/stickershop\/author\/(\d+)(?:\/(?:ja|en|ko|th|zh-Hant|zh-Hans))?/gi,/line\.me\/R\/shop\/sticker\/author\/(\d+)/gi,/["']authorId["']\s*:\s*["']?(\d+)["']?/gi,/["']author_id["']\s*:\s*["']?(\d+)["']?/gi,/["']creatorId["']\s*:\s*["']?(\d+)["']?/gi,/["']creator_id["']\s*:\s*["']?(\d+)["']?/gi];
  for (const pattern of patterns) for (const match of normalized.matchAll(pattern)) ids.add(match[1]);
  return [...ids];
}
function pickMeta(html, property) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  for (const pattern of [new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, "i"),new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, "i")]) { const match = html.match(pattern); if (match) return cleanText(match[1]); }
  return "";
}
function parseProduct(id, html) {
  const url = productUrl(id); const title = pickMeta(html, "og:title") || cleanText(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || ""); const description = pickMeta(html, "description"); const imageUrl = pickMeta(html, "og:image") || pickMeta(html, "twitter:image"); const priceMatch = html.match(/(?:￥|¥)\s*([0-9,]+)\s*(?:円)?/i) || html.match(/([0-9,]+)\s*円/i); const price = priceMatch ? `￥${priceMatch[1]}` : "";
  return { id, title, description, price, url, purchaseUrl: url, giftUrl: url, imageUrl, image: "" };
}
function extensionFrom(contentType = "", imageUrl = "") { const type = contentType.toLowerCase(); if (type.includes("webp")) return ".webp"; if (type.includes("jpeg") || type.includes("jpg")) return ".jpg"; if (type.includes("gif")) return ".gif"; if (type.includes("png")) return ".png"; const clean = imageUrl.split("?")[0].toLowerCase(); if (clean.endsWith(".webp")) return ".webp"; if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return ".jpg"; if (clean.endsWith(".gif")) return ".gif"; return ".png"; }
async function downloadImage(product) { if (!product.imageUrl) return; const response = await fetch(product.imageUrl, { headers: imageHeaders }); if (!response.ok) return; const contentType = response.headers.get("content-type") || ""; if (!contentType.includes("image")) return; fs.mkdirSync(IMAGE_DIR, { recursive: true }); const filename = `${product.id}${extensionFrom(contentType, product.imageUrl)}`; fs.writeFileSync(path.join(IMAGE_DIR, filename), Buffer.from(await response.arrayBuffer())); product.image = `/images/stickers/${filename}`; }

async function main() {
  const stickers = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  const existingIds = new Set(stickers.map((item) => String(item.id)));
  const checked = new Set(), queued = new Set(), queue = [], additions = [], ownPages = new Set();
  const enqueue = (id, priority = false) => { id = String(id); if (!/^\d+$/.test(id) || checked.has(id) || queued.has(id)) return; queued.add(id); priority ? queue.unshift(id) : queue.push(id); };

  // Every known work is a trusted seed. Different product pages expose different recommendation sets,
  // so scanning only the newest 30 leaves large blind spots.
  for (const item of [...stickers].sort((a,b) => Number(b.id)-Number(a.id))) enqueue(item.id);
  for (const id of BOOTSTRAP_PRODUCT_IDS) enqueue(id, true);

  console.log("================================="); console.log(" STAMP MOKE 未登録作品・全作品グラフ探索"); console.log("=================================");
  console.log(`既存: ${stickers.length}作品 / 信頼済み起点: ${stickers.length + BOOTSTRAP_PRODUCT_IDS.length}`);

  let candidateChecks = 0;
  while (queue.length && ownPages.size < MAX_OWN_PAGES && candidateChecks < MAX_CANDIDATE_CHECKS) {
    const batch = [];
    while (queue.length && batch.length < CONCURRENCY && candidateChecks + batch.length < MAX_CANDIDATE_CHECKS) {
      const id = queue.shift(); queued.delete(id); if (checked.has(id)) continue; checked.add(id); batch.push(id);
    }
    candidateChecks += batch.length;
    const results = await Promise.all(batch.map(async id => { try { return { id, html: await getHtml(productUrl(id)) }; } catch (error) { return { id, error }; } }));

    for (const { id, html, error } of results) {
      if (error) { if (candidateChecks <= 40 || candidateChecks % 200 < CONCURRENCY) console.log(`取得失敗 ${id}: ${error.message}`); continue; }
      const authorIds = extractAuthorIds(html); const isOwn = authorIds.includes(AUTHOR_ID);
      if (!isOwn) continue;
      ownPages.add(id);
      const linkedIds = extractProductIds(html);
      for (const linkedId of linkedIds) enqueue(linkedId);
      if (!existingIds.has(id)) {
        const product = parseProduct(id, html);
        if (product.title) { await downloadImage(product); additions.push(product); existingIds.add(id); console.log(`★ 未登録作品を追加: ${id} ${product.title}`); }
      }
      if (ownPages.size % 20 === 0) console.log(`自作品到達 ${ownPages.size} / 候補確認 ${candidateChecks} / 待機 ${queue.length} / 新規 ${additions.length}`);
    }
  }

  console.log(`確認候補: ${candidateChecks}件 / 自作品ページ: ${ownPages.size}件 / 新規追加: ${additions.length}件 / 未確認待機: ${queue.length}件`);
  if (!additions.length) { console.log("追加対象はありませんでした。"); return; }
  const merged = [...additions, ...stickers].filter((item,index,array)=>array.findIndex(other=>String(other.id)===String(item.id))===index).sort((a,b)=>Number(b.id)-Number(a.id)).map(({imageUrl,...item})=>item);
  fs.writeFileSync(DATA_FILE, JSON.stringify(merged,null,2), "utf8");
  console.log(`バックフィル完了: +${additions.length} / 合計 ${merged.length}作品`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
