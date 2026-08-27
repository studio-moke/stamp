import fs from "node:fs";
import path from "node:path";

const AUTHOR_URL = "https://store.line.me/stickershop/author/6507349/ja";
const DATA_FILE = path.resolve("src/data/stickers.json");
const IMAGE_DIR = path.resolve("public/images/stickers");
const MAX_PAGES = 20;

const baseHeaders = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "ja-JP,ja;q=0.9",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Cache-Control": "no-cache",
};
const cookieJar = new Map();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function updateCookies(response) {
  let values = [];
  if (typeof response.headers.getSetCookie === "function") values = response.headers.getSetCookie();
  if (!values.length) {
    const combined = response.headers.get("set-cookie");
    if (combined) values = combined.split(/,(?=[^;,]+=)/g);
  }
  for (const value of values) {
    const pair = value.split(";", 1)[0];
    const index = pair.indexOf("=");
    if (index <= 0) continue;
    cookieJar.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim());
  }
}

function cookieHeader() {
  return [...cookieJar.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
}

async function getHtml(url, referer = AUTHOR_URL) {
  const headers = { ...baseHeaders, Referer: referer };
  const cookies = cookieHeader();
  if (cookies) headers.Cookie = cookies;
  const response = await fetch(url, { headers, redirect: "follow" });
  updateCookies(response);
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  return await response.text();
}

function decodeHtml(text = "") {
  return text.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/gi, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;|&#160;/g, " ");
}
function cleanText(text = "") {
  return decodeHtml(text.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
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

function extractProducts(html) {
  const products = new Map();
  const pattern = /<a[^>]+href=["'](?:https?:\/\/store\.line\.me)?(\/stickershop\/product\/(\d+)\/(?:ja|en))[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(pattern)) {
    const id = match[2];
    const body = match[3];
    const titleMatch = body.match(/<p[^>]+data-test=["']item-name["'][^>]*>([\s\S]*?)<\/p>/i);
    const title = cleanText(titleMatch?.[1] || body);
    products.set(id, {
      id,
      title,
      url: `https://store.line.me/stickershop/product/${id}/ja`,
      purchaseUrl: `https://store.line.me/stickershop/product/${id}/ja`,
      giftUrl: `https://store.line.me/stickershop/product/${id}/ja`,
      description: "",
      price: "",
      image: "",
      imageUrl: "",
    });
  }
  return [...products.values()];
}

async function enrich(product) {
  const html = await getHtml(product.url, AUTHOR_URL);
  product.title = pickMeta(html, "og:title") || product.title;
  product.description = pickMeta(html, "description");
  product.imageUrl = pickMeta(html, "og:image") || pickMeta(html, "twitter:image");
  const price = html.match(/(?:￥|¥)\s*([0-9,]+)\s*(?:円)?/i) || html.match(/([0-9,]+)\s*円/i);
  if (price) product.price = `￥${price[1]}`;
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
  const headers = { ...baseHeaders, Referer: "https://store.line.me/", Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8" };
  const cookies = cookieHeader();
  if (cookies) headers.Cookie = cookies;
  const response = await fetch(product.imageUrl, { headers });
  if (!response.ok) return;
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("image")) return;
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
  const filename = `${product.id}${extensionFrom(contentType, product.imageUrl)}`;
  fs.writeFileSync(path.join(IMAGE_DIR, filename), Buffer.from(await response.arrayBuffer()));
  product.image = `/images/stickers/${filename}`;
}

async function main() {
  const existing = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  const existingIds = new Set(existing.map((item) => String(item.id)));
  const discovered = new Map();

  console.log("=================================");
  console.log(" LINE作者ページ セッション巡回");
  console.log("=================================");

  let firstHtml = await getHtml(AUTHOR_URL, "https://store.line.me/");
  console.log(`セッションCookie: ${cookieJar.size}個${cookieJar.size ? ` (${[...cookieJar.keys()].join(", ")})` : ""}`);

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = page === 1 ? AUTHOR_URL : `${AUTHOR_URL}?page=${page}`;
    const html = page === 1 ? firstHtml : await getHtml(url, page === 2 ? AUTHOR_URL : `${AUTHOR_URL}?page=${page - 1}`);
    const products = extractProducts(html);
    let pageNew = 0;
    for (const product of products) {
      if (!discovered.has(product.id)) {
        discovered.set(product.id, product);
        pageNew++;
      }
    }
    console.log(`ページ ${page}: ${products.length}作品 / 巡回内新規 ${pageNew} / 累計 ${discovered.size}`);
    if (page > 1 && (products.length === 0 || pageNew === 0)) break;
    await sleep(400);
  }

  const additions = [...discovered.values()].filter((item) => !existingIds.has(item.id));
  console.log(`作者ページからの新作候補: ${additions.length}作品`);
  if (additions.length) console.log(`新作候補ID: ${additions.map((item) => item.id).join(", ")}`);

  for (let i = 0; i < additions.length; i++) {
    const product = additions[i];
    console.log(`[${i + 1}/${additions.length}] 詳細取得 ${product.id}`);
    try {
      await enrich(product);
      await downloadImage(product);
    } catch (error) {
      console.log(`  詳細取得失敗: ${error.message}`);
    }
    await sleep(250);
  }

  if (!additions.length) {
    console.log("セッション巡回で追加対象はありませんでした。");
    return;
  }

  const merged = [...additions, ...existing]
    .filter((item, index, array) => array.findIndex((other) => String(other.id) === String(item.id)) === index)
    .sort((a, b) => Number(b.id) - Number(a.id))
    .map(({ imageUrl, ...item }) => item);

  fs.writeFileSync(DATA_FILE, JSON.stringify(merged, null, 2), "utf8");
  console.log(`追加: ${additions.length}作品 / 合計: ${merged.length}作品`);
}

main().catch((error) => {
  console.error("セッション巡回に失敗しました。");
  console.error(error);
  process.exitCode = 1;
});
