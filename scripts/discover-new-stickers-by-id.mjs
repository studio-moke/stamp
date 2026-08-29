import fs from "node:fs";
import path from "node:path";

const AUTHOR_ID = "6507349";
const DATA_FILE = path.resolve("src/data/stickers.json");
const IMAGE_DIR = path.resolve("public/images/stickers");
const STATE_FILE = path.resolve(process.env.STICKER_ID_SCAN_STATE || ".cache/sticker-id-scan/state.json");
const SCAN_LIMIT = Number(process.env.STICKER_ID_SCAN_LIMIT || 5000);
const CONCURRENCY = Number(process.env.STICKER_ID_SCAN_CONCURRENCY || 8);
const MAX_CONSECUTIVE_MISSING = Number(process.env.STICKER_ID_MAX_CONSECUTIVE_MISSING || 120);
const OVERLAP = Number(process.env.STICKER_ID_SCAN_OVERLAP || 200);
const RANGE_BYTES = Number(process.env.STICKER_ID_RANGE_BYTES || 131071);

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

const productUrl = (id) => `https://store.line.me/stickershop/product/${id}/ja`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  return decodeHtml(
    text
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function normalizeHtml(html = "") {
  return decodeHtml(html)
    .replace(/\\\//g, "/")
    .replace(/\\u002F/gi, "/")
    .replace(/\\u003A/gi, ":")
    .replace(/\\u0026/gi, "&");
}

function extractAuthorIds(html = "") {
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
  return { id: String(id), title, description, price, url, purchaseUrl: url, giftUrl: url, imageUrl, image: "" };
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
  try {
    const response = await fetch(product.imageUrl, { headers: imageHeaders, redirect: "follow" });
    if (!response.ok) return;
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("image")) return;
    fs.mkdirSync(IMAGE_DIR, { recursive: true });
    const filename = `${product.id}${extensionFrom(contentType, product.imageUrl)}`;
    fs.writeFileSync(path.join(IMAGE_DIR, filename), Buffer.from(await response.arrayBuffer()));
    product.image = `/images/stickers/${filename}`;
  } catch (error) {
    console.log(`画像取得失敗 ${product.id}: ${error.message}`);
  }
}

async function fetchProbe(id) {
  const response = await fetch(productUrl(id), {
    headers: { ...headers, Range: `bytes=0-${RANGE_BYTES}` },
    redirect: "follow",
  });
  if (response.status === 404) return { id, status: "missing" };
  if (!response.ok && response.status !== 206) return { id, status: "error", code: response.status };
  const html = await response.text();
  if (!html || /error\/load_script_failed/i.test(response.url)) return { id, status: "missing" };
  const authorIds = extractAuthorIds(html);
  return { id, status: "exists", isOwn: authorIds.includes(AUTHOR_ID), html };
}

async function fetchFullProduct(id, probeHtml = "") {
  let html = probeHtml;
  if (!html || !pickMeta(html, "og:title")) {
    const response = await fetch(productUrl(id), { headers, redirect: "follow" });
    if (!response.ok) throw new Error(`${response.status}: ${productUrl(id)}`);
    html = await response.text();
  }
  const authorIds = extractAuthorIds(html);
  if (!authorIds.includes(AUTHOR_ID)) return null;
  const product = parseProduct(id, html);
  if (!product.title) return null;
  await downloadImage(product);
  return product;
}

function loadStickers() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  if (!Array.isArray(data)) throw new Error("stickers.json is not an array");
  return data;
}

function loadState() {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    return Number.isFinite(Number(state?.nextId)) ? { nextId: Number(state.nextId) } : null;
  } catch {
    return null;
  }
}

function saveState(nextId) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify({ nextId, updatedAt: new Date().toISOString() }, null, 2), "utf8");
}

function mergeAndSave(stickers, additions) {
  if (!additions.length) return stickers;
  const byId = new Map(stickers.map((item) => [String(item.id), item]));
  for (const product of additions) {
    const { imageUrl, ...clean } = product;
    byId.set(String(clean.id), clean);
  }
  const merged = [...byId.values()].sort((a, b) => Number(b.id) - Number(a.id));
  fs.writeFileSync(DATA_FILE, JSON.stringify(merged, null, 2), "utf8");
  return merged;
}

async function main() {
  const stickers = loadStickers();
  const existingIds = new Set(stickers.map((item) => String(item.id)));
  const numericIds = stickers.map((item) => Number(item.id)).filter(Number.isFinite);
  const highestKnown = Math.max(...numericIds);
  const state = loadState();
  const resumeFrom = state?.nextId || highestKnown + 1;
  const start = Math.max(highestKnown + 1, resumeFrom - OVERLAP);
  const hardEnd = start + SCAN_LIMIT - 1;

  console.log("=================================");
  console.log(" STAMP MOKE 商品IDベース新作探索");
  console.log("=================================");
  console.log(`既存: ${stickers.length}作品`);
  console.log(`最大登録ID: ${highestKnown}`);
  console.log(`前回カーソル: ${state?.nextId || "なし"}`);
  console.log(`探索範囲: ${start} - ${hardEnd} (最大 ${SCAN_LIMIT} ID)`);
  console.log(`並列数: ${CONCURRENCY} / 重複確認: ${OVERLAP} / 未来ID連続 ${MAX_CONSECUTIVE_MISSING} で停止`);

  let cursor = start;
  let checked = 0;
  let exists = 0;
  let errors = 0;
  let consecutiveMissing = 0;
  let lastExistingId = start - 1;
  const additions = [];

  while (cursor <= hardEnd) {
    const ids = [];
    for (let i = 0; i < CONCURRENCY && cursor <= hardEnd; i += 1, cursor += 1) ids.push(cursor);
    const results = await Promise.all(ids.map(async (id) => {
      try { return await fetchProbe(id); }
      catch (error) { return { id, status: "error", error }; }
    }));
    checked += results.length;

    let shouldStopAtFutureBoundary = false;
    for (const result of results.sort((a, b) => a.id - b.id)) {
      if (result.status === "error") {
        errors += 1;
        consecutiveMissing = 0;
        if (errors <= 10) console.log(`取得エラー ${result.id}: ${result.code || result.error?.message || "unknown"}`);
        continue;
      }
      if (result.status === "missing") {
        consecutiveMissing += 1;
        if (consecutiveMissing >= MAX_CONSECUTIVE_MISSING) {
          shouldStopAtFutureBoundary = true;
          break;
        }
        continue;
      }

      consecutiveMissing = 0;
      exists += 1;
      lastExistingId = result.id;
      if (!result.isOwn || existingIds.has(String(result.id))) continue;

      try {
        const product = await fetchFullProduct(result.id, result.html);
        if (!product) continue;
        additions.push(product);
        existingIds.add(String(result.id));
        console.log(`★ 新作発見: ${result.id} ${product.title}`);
      } catch (error) {
        errors += 1;
        console.log(`自作品の詳細取得失敗 ${result.id}: ${error.message}`);
      }
    }

    if (checked % Math.max(CONCURRENCY * 25, 100) === 0) {
      console.log(`探索中: ${checked} ID / 実在 ${exists} / 新作 ${additions.length} / エラー ${errors}`);
    }
    if (errors > Math.max(50, checked * 0.2)) {
      throw new Error(`ID探索のエラー率が高すぎます: ${errors}/${checked}`);
    }
    if (shouldStopAtFutureBoundary) {
      console.log(`停止: 未発行と思われるIDが ${MAX_CONSECUTIVE_MISSING} 件連続しました。`);
      break;
    }
    if (checked % 500 === 0) await sleep(300);
  }

  if (checked < Math.min(100, SCAN_LIMIT) && consecutiveMissing < MAX_CONSECUTIVE_MISSING) {
    throw new Error(`ID探索が十分に実行されていません: checked=${checked}`);
  }

  const nextId = consecutiveMissing >= MAX_CONSECUTIVE_MISSING ? Math.max(highestKnown + 1, lastExistingId + 1) : cursor;
  saveState(nextId);
  const merged = mergeAndSave(stickers, additions);

  console.log("");
  console.log(`探索完了: ${checked} ID / 実在 ${exists} / 新規 ${additions.length} / エラー ${errors}`);
  console.log(`次回開始候補: ${nextId}`);
  console.log(`作品数: ${merged.length}`);
  if (!additions.length) console.log("新作なし。次回は保存済みカーソル付近から継続します。");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
