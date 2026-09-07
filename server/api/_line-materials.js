import crypto from "node:crypto";
import { r2Put } from "./_r2.js";

const STORE_PRICE_YEN = 100;
const ALLOWED_COUNTS = new Set([8, 16, 24, 32, 40]);
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

function isPng(buffer) {
  return Buffer.isBuffer(buffer) && buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosTime, dosDate };
}

function buildZip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  const { dosTime, dosDate } = dosDateTime();
  for (const entry of entries) {
    const name = Buffer.from(entry.name.replace(/\\/g, "/"), "utf8");
    const data = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data);
    const crc = crc32(data);
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    name.copy(local, 30);
    locals.push(local, data);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(dosTime, 12);
    central.writeUInt16LE(dosDate, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);
    centrals.push(central);
    offset += local.length + data.length;
  }
  const centralBuffer = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuffer.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...locals, centralBuffer, end]);
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
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(normalized)) !== null) ids.add(match[1]);
  }
  return [...ids];
}

async function fetchProductPage(productId) {
  const url = `https://store.line.me/stickershop/product/${productId}/ja`;
  const response = await fetch(url, { headers: PAGE_HEADERS, cache: "no-store", redirect: "follow" });
  if (!response.ok) throw new Error(`LINE商品ページ取得失敗: ${response.status}`);
  return response.text();
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
      if (isPng(data)) return data;
    } catch {}
  }
  throw new Error(`スタンプ画像取得失敗: ${stickerId}`);
}

async function downloadAll(stickerIds, concurrency = 8) {
  const results = new Array(stickerIds.length);
  let cursor = 0;
  async function worker() {
    while (cursor < stickerIds.length) {
      const index = cursor++;
      results[index] = await fetchStickerPng(stickerIds[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, stickerIds.length) }, () => worker()));
  return results;
}

function licenseText(productId) {
  return `stamp moke 商用素材 利用条件\n\n商品ID: ${productId}\n\n・購入者は、収録画像を商用・非商用の制作物に利用できます。\n・加工・編集して利用できます。\n・素材データそのもの、ZIP、または素材集としての再配布・再販売は禁止します。\n・第三者の権利を侵害する用途、違法な用途には利用できません。\n・商品ページに個別条件がある場合は、商品ページの条件を優先します。\n\n最新の利用条件: https://stamp-moke.jp/materials/license/\n`;
}

export async function prepareLineMaterialZip(product) {
  const productId = String(product?.id || "").replace(/[^0-9]/g, "");
  if (!productId) throw new Error("商品IDが不正です。");
  const html = await fetchProductPage(productId);
  const stickerIds = extractStickerIds(html);
  if (!ALLOWED_COUNTS.has(stickerIds.length)) {
    throw new Error(`LINE商品ページから取得した画像数が想定外です: ${stickerIds.length}点`);
  }
  const images = await downloadAll(stickerIds);
  const title = String(product?.title || productId).trim();
  const preparedAt = new Date().toISOString();
  const entries = images.map((data, index) => ({ name: `png/${String(index + 1).padStart(2, "0")}.png`, data }));
  const manifest = {
    productId,
    title,
    assetCount: images.length,
    format: "PNG",
    commercialUse: true,
    source: "LINE STORE",
    preparedAt,
    priceYen: STORE_PRICE_YEN,
  };
  const readme = `${title}\n商品ID: ${productId}\n収録PNG: ${images.length}点\n価格: ${STORE_PRICE_YEN}円（税込）\n商用利用: 可\n\nLICENSE.txt を確認してからご利用ください。\n`;
  const zip = buildZip([
    ...entries,
    { name: "README.txt", data: Buffer.from(readme, "utf8") },
    { name: "LICENSE.txt", data: Buffer.from(licenseText(productId), "utf8") },
    { name: "manifest.json", data: Buffer.from(JSON.stringify(manifest, null, 2), "utf8") },
  ]);
  const hash = crypto.createHash("sha256").update(zip).digest("hex");
  const zipKey = `digital-products/${productId}/${hash}.zip`;
  await r2Put(zipKey, zip, "application/zip");
  return { productId, zipKey, contentHash: hash, assetCount: images.length, preparedAt };
}
