import fs from "node:fs";
import path from "node:path";
import { buildLineMaterialZip } from "../server/api/_line-materials.js";
import { r2Head, r2Put } from "../server/api/_r2.js";

const stickersFile = path.resolve("src/data/stickers.json");
const queueFile = path.resolve("src/data/digital-material-queue.json");
const maxItems = Math.max(1, Math.min(10, Number(process.env.DIGITAL_MATERIAL_MAX_PER_RUN || 3)));

function readJson(file, fallback) { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; } }
function writeQueue(queue) {
  queue.generatedAt = new Date().toISOString();
  queue.r2WritesEnabled = true;
  queue.pendingCount = queue.items.filter((x) => x.status === "pending").length;
  queue.readyCount = queue.items.filter((x) => x.status === "ready").length;
  queue.failedCount = queue.items.filter((x) => x.status === "failed").length;
  fs.writeFileSync(queueFile, `${JSON.stringify(queue, null, 2)}\n`, "utf8");
}

const stickers = readJson(stickersFile, []);
const queue = readJson(queueFile, { version: 1, items: [] });
if (!Array.isArray(stickers) || !Array.isArray(queue.items)) throw new Error("Digital material queue data is invalid");
const stickerById = new Map(stickers.map((s) => [String(s.id), s]));
const candidates = queue.items.filter((x) => x.status === "pending").slice(0, maxItems);
let processed = 0;

for (const item of candidates) {
  const productId = String(item.productId);
  const product = stickerById.get(productId);
  item.lastAttemptAt = new Date().toISOString();
  item.attempts = Number(item.attempts || 0) + 1;
  try {
    if (!product) throw new Error("Sticker catalog entry not found");
    const built = await buildLineMaterialZip(product);
    const exists = await r2Head(built.zipKey);
    if (!exists) await r2Put(built.zipKey, built.zip, "application/zip");
    if (!(await r2Head(built.zipKey))) throw new Error("R2 verification failed after upload");
    item.status = "ready";
    item.assetCount = built.assetCount;
    item.zipKey = built.zipKey;
    item.contentHash = built.contentHash;
    item.preparedAt = built.preparedAt;
    item.sourcePackage = built.sourcePackage;
    item.r2UploadSkipped = Boolean(exists);
    item.note = exists ? "Existing immutable ZIP verified; upload skipped" : "Private R2 ZIP uploaded and verified";
    delete item.error;
  } catch (error) {
    item.status = "failed";
    item.error = error instanceof Error ? error.message : String(error);
    item.note = "Preparation failed; product remains unpublished";
  }
  processed++;
  writeQueue(queue);
}

writeQueue(queue);
console.log(`Digital material processing complete: ${processed}/${maxItems} attempted`);
console.log(`pending=${queue.pendingCount} ready=${queue.readyCount} failed=${queue.failedCount}`);
