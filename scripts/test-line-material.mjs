import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const productId = String(process.argv[2] || process.env.LINE_PRODUCT_ID || "36313683").replace(/[^0-9]/g, "");
if (!productId) throw new Error("LINE product id is required");

const PAGE_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  "Accept-Language": "ja-JP,ja;q=0.9",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
};
const IMAGE_HEADERS = {
  "User-Agent": PAGE_HEADERS["User-Agent"],
  Referer: "https://store.line.me/",
  Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
};
const ALLOWED_COUNTS = new Set([8, 16, 24, 32, 40]);

function isPng(buffer) {
  return Buffer.isBuffer(buffer) && buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
}

function extractStickerIds(html) {
  const normalized = String(html || "")
    .replace(/\\\//g, "/")
    .replace(/\\u002F/gi, "/")
    .replace(/&amp;/g, "&");
  const ids = new Set();
  const patterns = [
    /stickershop\/v1\/sticker\/(\d+)\/(?:android|iphone|iPhone)\//gi,
    /sticker\/(\d+)\/android\/sticker\.png/gi,
    /data-preview-sticker-id=["'](\d+)["']/gi,
    /data-sticker-id=["'](\d+)["']/gi,
    /["']stickerId["']\s*:\s*["']?(\d+)/gi,
    /["']sticker_id["']\s*:\s*["']?(\d+)/gi,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(normalized)) !== null) ids.add(match[1]);
  }
  return [...ids];
}

async function fetchStickerPng(stickerId) {
  const candidates = [
    `https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/android/sticker.png`,
    `https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/iPhone/sticker@2x.png`,
    `https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/iPhone/sticker_key@2x.png`,
  ];
  for (const url of candidates) {
    try {
      const response = await fetch(url, { headers: IMAGE_HEADERS, redirect: "follow" });
      if (!response.ok) continue;
      const data = Buffer.from(await response.arrayBuffer());
      if (isPng(data)) return { data, url };
    } catch {}
  }
  throw new Error(`failed to fetch sticker png: ${stickerId}`);
}

const pageUrl = `https://store.line.me/stickershop/product/${productId}/ja`;
const outDir = path.resolve("tmp/line-material-test", productId);
await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

console.log(`Fetching LINE product page: ${pageUrl}`);
const page = await fetch(pageUrl, { headers: PAGE_HEADERS, cache: "no-store", redirect: "follow" });
const html = await page.text();
await fs.writeFile(path.join(outDir, "page.html"), html, "utf8");
await fs.writeFile(path.join(outDir, "page-meta.json"), JSON.stringify({
  requestedUrl: pageUrl,
  finalUrl: page.url,
  status: page.status,
  contentType: page.headers.get("content-type"),
  bytes: Buffer.byteLength(html),
  title: html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || null,
  hasLineScdn: /line-scdn\.net/i.test(html),
  hasStickershopV1Sticker: /stickershop\/v1\/sticker\//i.test(html),
  hasPreviewStickerId: /preview-sticker-id/i.test(html),
  hasStickerIdText: /sticker.?id/i.test(html),
}, null, 2));
if (!page.ok) throw new Error(`LINE product page failed: ${page.status}`);

const stickerIds = extractStickerIds(html);
await fs.writeFile(path.join(outDir, "extracted-ids.json"), JSON.stringify(stickerIds, null, 2));
console.log(`Found sticker ids: ${stickerIds.length}`);
if (!ALLOWED_COUNTS.has(stickerIds.length)) throw new Error(`unexpected sticker count: ${stickerIds.length}`);

await fs.mkdir(path.join(outDir, "png"), { recursive: true });
const hashes = [];
for (let i = 0; i < stickerIds.length; i++) {
  const stickerId = stickerIds[i];
  const { data, url } = await fetchStickerPng(stickerId);
  const filename = `${String(i + 1).padStart(2, "0")}.png`;
  await fs.writeFile(path.join(outDir, "png", filename), data);
  const sha256 = crypto.createHash("sha256").update(data).digest("hex");
  hashes.push({ index: i + 1, stickerId, filename, bytes: data.length, sha256, sourceUrl: url });
  console.log(`${filename}: ${stickerId} ${data.length} bytes`);
}

const manifest = { productId, pageUrl, assetCount: hashes.length, testedAt: new Date().toISOString(), files: hashes };
await fs.writeFile(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`Dry-run passed: ${hashes.length} PNG files written to ${outDir}`);
