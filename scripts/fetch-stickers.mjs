import fs from "node:fs";
import path from "node:path";

const AUTHOR_URL = "https://store.line.me/stickershop/author/6507349/ja";
const outputDir = path.resolve("src/data");
const outputFile = path.join(outputDir, "stickers.json");
const imageDir = path.resolve("public/images/stickers");
const MAX_PAGES = 100;
const MINIMUM_SAFE_COUNT = 100;

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  "Accept-Language": "ja-JP,ja;q=0.9",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
};
const imageHeaders = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  Referer: "https://store.line.me/",
  Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
};

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function getHtml(url) {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  const buffer = await response.arrayBuffer();
  return new TextDecoder("utf-8").decode(buffer);
}

function decodeHtml(text) {
  if (!text) return "";
  return text.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&#160;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => { try { return String.fromCodePoint(Number(code)); } catch { return _; } })
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => { try { return String.fromCodePoint(parseInt(code, 16)); } catch { return _; } });
}

function cleanText(text) {
  return decodeHtml(text.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}
function toAbsoluteUrl(href) { try { return new URL(href, AUTHOR_URL).toString(); } catch { return ""; } }

function extractPaginationUrls(html) {
  const urls = new Set();
  const pattern = /href=["']([^"']*(?:\?|&)page=\d+[^"']*)["']/gi;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    const url = toAbsoluteUrl(decodeHtml(match[1]));
    if (url) urls.add(url);
  }
  return [...urls];
}

function extractProducts(html) {
  const products = [];
  const patterns = [
    /href=["'](\/stickershop\/product\/(\d+)\/ja)["'][^>]*>([\s\S]*?)<\/a>/g,
    /href=["'](https?:\/\/store\.line\.me\/stickershop\/product\/(\d+)\/ja)["'][^>]*>([\s\S]*?)<\/a>/g,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const url = match[1].startsWith("http") ? match[1] : `https://store.line.me${match[1]}`;
      const id = match[2];
      const title = cleanText(match[3]);
      if (!products.some((item) => item.id === id)) {
        products.push({ id, title, url, description: "", price: "", purchaseUrl: url, giftUrl: url, imageUrl: "", image: "" });
      }
    }
  }
  return products;
}

async function getProductInfo(product) {
  try {
    const html = await getHtml(product.url);
    const titlePatterns = [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
      /<h1[^>]*>([\s\S]*?)<\/h1>/i,
    ];
    for (const pattern of titlePatterns) {
      const match = html.match(pattern);
      if (match) { const title = cleanText(match[1]); if (title) { product.title = title; break; } }
    }
    const descriptionPatterns = [
      /<p[^>]*class=["'][^"']*mdCMN38Item01Txt[^"']*["'][^>]*>([\s\S]*?)<\/p>/i,
      /class=["'][^"']*mdCMN38Item01Txt[^"']*["'][^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
    ];
    for (const pattern of descriptionPatterns) {
      const match = html.match(pattern);
      if (match) { const description = cleanText(match[1]); if (description) { product.description = description; break; } }
    }
    const pricePatterns = [/(?:￥|¥)\s*([0-9,]+)\s*(?:円)?/i, /([0-9,]+)\s*円/i];
    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match) { product.price = `￥${match[1]}`; break; }
    }
    const imagePatterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    ];
    let imageUrl = "";
    for (const pattern of imagePatterns) { const match = html.match(pattern); if (match) { imageUrl = decodeHtml(match[1]); break; } }
    if (!imageUrl) {
      const imgPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
      for (const match of html.matchAll(imgPattern)) {
        const src = decodeHtml(match[1]);
        if (src.includes("line-scdn.net") || src.includes("line.me")) { imageUrl = src; break; }
      }
    }
    if (imageUrl.startsWith("//")) imageUrl = `https:${imageUrl}`;
    if (imageUrl) product.imageUrl = imageUrl;
    return product;
  } catch (error) {
    console.log(`  商品情報取得失敗: ${product.url}`);
    console.log(`  ${error.message}`);
    return product;
  }
}

function getExtension(contentType, imageUrl) {
  const type = (contentType || "").toLowerCase();
  if (type.includes("png")) return ".png";
  if (type.includes("webp")) return ".webp";
  if (type.includes("gif")) return ".gif";
  if (type.includes("jpeg") || type.includes("jpg")) return ".jpg";
  const cleanUrl = imageUrl.split("?")[0].toLowerCase();
  if (cleanUrl.endsWith(".png")) return ".png";
  if (cleanUrl.endsWith(".webp")) return ".webp";
  if (cleanUrl.endsWith(".jpg") || cleanUrl.endsWith(".jpeg")) return ".jpg";
  return ".png";
}

async function downloadImage(product) {
  if (!product.imageUrl) return false;
  try {
    const response = await fetch(product.imageUrl, { headers: imageHeaders });
    if (!response.ok) { console.log(`  画像取得失敗: ${response.status}`); return false; }
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("image")) { console.log(`  画像ではありません: ${contentType}`); return false; }
    const extension = getExtension(contentType, product.imageUrl);
    const filename = `${product.id}${extension}`;
    const filepath = path.join(imageDir, filename);
    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(arrayBuffer));
    product.image = `/images/stickers/${filename}`;
    return true;
  } catch (error) { console.log(`  画像保存失敗: ${error.message}`); return false; }
}

function getPageNumber(url) {
  try { const page = Number(new URL(url).searchParams.get("page")); return Number.isFinite(page) && page > 0 ? page : 1; }
  catch { return 1; }
}
function sortPaginationUrls(urls) { return [...urls].sort((a, b) => getPageNumber(a) - getPageNumber(b)); }

async function collectAllProducts() {
  const allProducts = [];
  const knownIds = new Set();
  const visitedUrls = new Set();
  const queuedUrls = new Set([AUTHOR_URL]);
  const queue = [AUTHOR_URL];
  while (queue.length > 0 && visitedUrls.size < MAX_PAGES) {
    const url = queue.shift();
    if (visitedUrls.has(url)) continue;
    visitedUrls.add(url);
    const page = getPageNumber(url);
    console.log(`ページ ${page} を取得中...`);
    console.log(`  ${url}`);
    let html;
    try { html = await getHtml(url); }
    catch (error) { console.log(`  → 取得失敗: ${error.message}`); continue; }
    const products = extractProducts(html);
    const newProducts = products.filter((product) => !knownIds.has(product.id));
    console.log(`  → ${products.length}作品（新規 ${newProducts.length}作品）`);
    for (const product of newProducts) { knownIds.add(product.id); allProducts.push(product); }
    const paginationUrls = sortPaginationUrls(extractPaginationUrls(html));
    console.log(`  → ページ送りリンク ${paginationUrls.length}件`);
    for (const nextUrl of paginationUrls) {
      if (!visitedUrls.has(nextUrl) && !queuedUrls.has(nextUrl)) { queuedUrls.add(nextUrl); queue.push(nextUrl); }
    }
    if (page === 1 && paginationUrls.length === 0) {
      const fallbackUrl = `${AUTHOR_URL}?page=2`;
      if (!visitedUrls.has(fallbackUrl) && !queuedUrls.has(fallbackUrl)) { queuedUrls.add(fallbackUrl); queue.push(fallbackUrl); }
    }
    await sleep(500);
  }
  return allProducts;
}

function loadExistingProducts() {
  if (!fs.existsSync(outputFile)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(outputFile, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch (error) { console.log(`既存データの読み込みに失敗しました: ${error.message}`); return []; }
}

function mergeProducts(existingProducts, fetchedProducts) {
  const merged = new Map();
  for (const product of existingProducts) if (product?.id) merged.set(String(product.id), product);
  for (const product of fetchedProducts) {
    if (!product?.id) continue;
    const old = merged.get(String(product.id));
    merged.set(String(product.id), {
      ...(old || {}), ...product,
      description: product.description || old?.description || "",
      price: product.price || old?.price || "",
      image: product.image || old?.image || "",
      purchaseUrl: product.purchaseUrl || old?.purchaseUrl || product.url,
      giftUrl: product.giftUrl || old?.giftUrl || product.url,
    });
  }
  return [...merged.values()];
}

async function main() {
  console.log("");
  console.log("=================================");
  console.log(" STAMP MOKE 自動取得");
  console.log("=================================");
  console.log("");
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(imageDir, { recursive: true });

  const existingProducts = loadExistingProducts();
  console.log(`既存データ: ${existingProducts.length}作品`);
  const fetchedProducts = await collectAllProducts();
  console.log("");
  console.log(`今回取得: ${fetchedProducts.length}作品`);

  const mergedBeforeDetails = mergeProducts(existingProducts, fetchedProducts);
  console.log(`統合後: ${mergedBeforeDetails.length}作品`);
  console.log("");
  if (mergedBeforeDetails.length < MINIMUM_SAFE_COUNT) {
    throw new Error(`安全確認に失敗しました: 統合後 ${mergedBeforeDetails.length}件。${MINIMUM_SAFE_COUNT}件未満なので既存データを上書きしません。`);
  }

  console.log("商品情報を取得しています...");
  console.log("");
  for (let i = 0; i < fetchedProducts.length; i++) {
    const product = fetchedProducts[i];
    console.log(`[${i + 1}/${fetchedProducts.length}] ${product.title}`);
    await getProductInfo(product);
    await sleep(300);
  }

  console.log("");
  console.log("スタンプ画像を保存しています...");
  console.log("");
  let imageCount = 0;
  for (let i = 0; i < fetchedProducts.length; i++) {
    const product = fetchedProducts[i];
    if (!product.imageUrl) { console.log(`[${i + 1}/${fetchedProducts.length}] 画像URLなし`); continue; }
    console.log(`[${i + 1}/${fetchedProducts.length}] ${product.title}`);
    if (await downloadImage(product)) imageCount++;
    await sleep(300);
  }

  // 詳細情報・画像保存が終わった後に最終統合します。
  const finalProducts = mergeProducts(existingProducts, fetchedProducts);
  const outputProducts = finalProducts.map((product) => ({
    id: product.id,
    title: product.title,
    description: product.description || "",
    price: product.price || "",
    url: product.url,
    purchaseUrl: product.purchaseUrl || product.url,
    giftUrl: product.giftUrl || product.url,
    image: product.image,
  }));

  fs.writeFileSync(outputFile, JSON.stringify(outputProducts, null, 2), "utf8");
  console.log("");
  console.log("=================================");
  console.log(" 完了！");
  console.log("=================================");
  console.log("");
  console.log(`作品数: ${outputProducts.length}`);
  console.log(`今回画像保存: ${imageCount}/${fetchedProducts.length}`);
  console.log(`JSON: ${outputFile}`);
  console.log(`画像: ${imageDir}`);
  console.log("");
}

main().catch((error) => {
  console.error("");
  console.error("取得に失敗しました。");
  console.error(error);
  process.exitCode = 1;
});
