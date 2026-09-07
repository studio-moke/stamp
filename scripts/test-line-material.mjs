import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

const productId = String(process.argv[2] || process.env.LINE_PRODUCT_ID || "36313683").replace(/[^0-9]/g, "");
if (!productId) throw new Error("LINE product id is required");

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  Referer: "https://store.line.me/",
  Accept: "*/*",
};
const ALLOWED_COUNTS = new Set([8, 16, 24, 32, 40]);

function isPng(buffer) {
  return Buffer.isBuffer(buffer) && buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
}

const outDir = path.resolve("tmp/line-material-test", productId);
await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

const packageCandidates = [
  `https://stickershop.line-scdn.net/stickershop/v1/product/${productId}/android/stickers.zip`,
  `https://stickershop.line-scdn.net/stickershop/v1/product/${productId}/iphone/stickers@2x.zip`,
  `https://stickershop.line-scdn.net/stickershop/v1/product/${productId}/iPhone/stickers@2x.zip`,
];

let packageUrl = null;
let zipData = null;
const attempts = [];
for (const url of packageCandidates) {
  try {
    const response = await fetch(url, { headers: HEADERS, redirect: "follow" });
    const data = Buffer.from(await response.arrayBuffer());
    attempts.push({ url, status: response.status, contentType: response.headers.get("content-type"), bytes: data.length });
    if (response.ok && data.length >= 4 && data.subarray(0, 4).equals(Buffer.from([0x50,0x4b,0x03,0x04]))) {
      packageUrl = url;
      zipData = data;
      break;
    }
  } catch (error) {
    attempts.push({ url, error: String(error?.message || error) });
  }
}
await fs.writeFile(path.join(outDir, "package-attempts.json"), JSON.stringify(attempts, null, 2));
if (!zipData) throw new Error("LINE product package ZIP could not be fetched");

const sourceZip = path.join(outDir, "source.zip");
await fs.writeFile(sourceZip, zipData);
const rawDir = path.join(outDir, "raw");
await fs.mkdir(rawDir, { recursive: true });
execFileSync("unzip", ["-qq", "-o", sourceZip, "-d", rawDir], { stdio: "inherit" });

async function walk(dir) {
  const result = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await walk(full));
    else result.push(full);
  }
  return result;
}

const allFiles = await walk(rawDir);
const imageFiles = [];
for (const file of allFiles) {
  const name = path.basename(file);
  if (!/\.png$/i.test(name)) continue;
  if (/key|tab|main|preview|thumbnail|product/i.test(name)) continue;
  const data = await fs.readFile(file);
  if (isPng(data)) imageFiles.push({ file, data });
}

console.log(`Package URL: ${packageUrl}`);
console.log(`PNG candidates in package: ${imageFiles.length}`);
if (!ALLOWED_COUNTS.has(imageFiles.length)) {
  await fs.writeFile(path.join(outDir, "package-files.json"), JSON.stringify(allFiles.map((f) => path.relative(rawDir, f)), null, 2));
  throw new Error(`unexpected PNG count in package: ${imageFiles.length}`);
}

const pngDir = path.join(outDir, "png");
await fs.mkdir(pngDir, { recursive: true });
const files = [];
imageFiles.sort((a, b) => a.file.localeCompare(b.file, "en", { numeric: true }));
for (let i = 0; i < imageFiles.length; i++) {
  const { file, data } = imageFiles[i];
  const filename = `${String(i + 1).padStart(2, "0")}.png`;
  await fs.writeFile(path.join(pngDir, filename), data);
  files.push({
    index: i + 1,
    filename,
    sourceEntry: path.relative(rawDir, file),
    bytes: data.length,
    sha256: crypto.createHash("sha256").update(data).digest("hex"),
  });
}

const manifest = {
  productId,
  packageUrl,
  assetCount: files.length,
  testedAt: new Date().toISOString(),
  files,
};
await fs.writeFile(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`Dry-run passed: ${files.length} PNG files written to ${pngDir}`);
