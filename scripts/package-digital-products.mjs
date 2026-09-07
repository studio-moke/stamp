import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { r2Put } from "../server/api/_r2.js";

const SOURCE_ROOT = path.resolve(process.env.DIGITAL_PRODUCT_SOURCE_DIR || "digital-products-source");
const OVERRIDES_FILE = path.resolve("src/data/digital-product-overrides.json");
const AUTO_PUBLISH = process.env.AUTO_PUBLISH_DIGITAL_PRODUCTS === "1";
const DEFAULT_EXPECTED_COUNT = Number(process.env.DIGITAL_PRODUCT_EXPECTED_COUNT || 40);

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { return fallback; }
}

function naturalSort(a, b) {
  return a.localeCompare(b, "ja", { numeric: true, sensitivity: "base" });
}

function isPng(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 8) return false;
  return buffer.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
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

  const centralStart = offset;
  const centralBuffer = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuffer.length, 12);
  end.writeUInt32LE(centralStart, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...locals, centralBuffer, end]);
}

function licenseText(productId) {
  return `stamp moke 商用素材 利用条件\n\n商品ID: ${productId}\n\n・購入者は、収録画像を商用・非商用の制作物に利用できます。\n・素材データそのもの、または素材集として再配布・再販売することは禁止します。\n・第三者の権利を侵害する用途、違法な用途には利用できません。\n・商品ページに個別条件がある場合は、商品ページの条件を優先します。\n\n最新の利用条件: https://stamp-moke.jp/materials/license/\n`;
}

function readSourceConfig(dir) {
  const manifestPath = path.join(dir, "product.json");
  return readJson(manifestPath, {});
}

async function packageProduct(productId, override, dir) {
  const sourceConfig = readSourceConfig(dir);
  const expectedCount = Number(sourceConfig.expectedCount || override.expectedCount || DEFAULT_EXPECTED_COUNT);
  const pngNames = fs.readdirSync(dir).filter((name) => /\.png$/i.test(name)).sort(naturalSort);
  if (!Number.isInteger(expectedCount) || expectedCount < 1) throw new Error(`${productId}: expectedCount が不正です`);
  if (pngNames.length !== expectedCount) throw new Error(`${productId}: PNG ${pngNames.length}枚 / 必要 ${expectedCount}枚。ZIP化を中止しました`);

  const imageEntries = [];
  for (let index = 0; index < pngNames.length; index++) {
    const sourcePath = path.join(dir, pngNames[index]);
    const data = fs.readFileSync(sourcePath);
    if (!isPng(data)) throw new Error(`${productId}: ${pngNames[index]} は有効なPNGではありません`);
    imageEntries.push({ name: `png/${String(index + 1).padStart(2, "0")}.png`, data });
  }

  const manifest = {
    productId: String(productId),
    assetCount: imageEntries.length,
    format: "PNG",
    commercialUse: true,
    packagedAt: new Date().toISOString(),
  };
  const readme = `stamp moke 商用素材\n商品ID: ${productId}\n収録点数: ${imageEntries.length}点\n形式: PNG\n商用利用: 可\n\nLICENSE.txt を確認してからご利用ください。\n`;
  const entries = [
    ...imageEntries,
    { name: "README.txt", data: Buffer.from(readme, "utf8") },
    { name: "LICENSE.txt", data: Buffer.from(licenseText(productId), "utf8") },
    { name: "manifest.json", data: Buffer.from(JSON.stringify(manifest, null, 2), "utf8") },
  ];
  const zip = buildZip(entries);
  const digest = crypto.createHash("sha256").update(zip).digest("hex").slice(0, 16);
  const zipKey = `digital-products/${productId}/${digest}.zip`;
  await r2Put(zipKey, zip, "application/zip");
  return {
    zipKey,
    assetCount: imageEntries.length,
    expectedCount,
    packagedAt: manifest.packagedAt,
    published: sourceConfig.publish === true || (AUTO_PUBLISH && override.published !== false),
  };
}

async function main() {
  if (!fs.existsSync(SOURCE_ROOT)) {
    console.log(`販売用PNGフォルダがありません: ${SOURCE_ROOT}`);
    console.log("digital-products-source/<LINE商品ID>/ に元PNGを配置してください。");
    return;
  }

  const data = readJson(OVERRIDES_FILE, { products: {} });
  if (!data.products || typeof data.products !== "object") data.products = {};
  const requestedId = process.argv[2] ? String(process.argv[2]) : "";
  const productDirs = fs.readdirSync(SOURCE_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name) && (!requestedId || entry.name === requestedId))
    .map((entry) => entry.name)
    .sort(naturalSort);

  if (!productDirs.length) {
    console.log(requestedId ? `${requestedId} の元PNGフォルダがありません。` : "対象の商品フォルダがありません。");
    return;
  }

  let success = 0;
  for (const productId of productDirs) {
    const dir = path.join(SOURCE_ROOT, productId);
    const current = data.products[productId] || {};
    try {
      const result = await packageProduct(productId, current, dir);
      data.products[productId] = { ...current, ...result };
      console.log(`✓ ${productId}: ${result.assetCount}点 → ${result.zipKey}${result.published ? " / 公開可" : " / 準備済み"}`);
      success++;
    } catch (error) {
      console.error(`✗ ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (success > 0) {
    fs.writeFileSync(OVERRIDES_FILE, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    console.log(`商品設定を更新しました: ${OVERRIDES_FILE}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
