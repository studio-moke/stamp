import fs from "node:fs";
import path from "node:path";

const stickersFile = path.resolve("src/data/stickers.json");
const queueFile = path.resolve("src/data/digital-material-queue.json");

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

const stickers = readJson(stickersFile, []);
if (!Array.isArray(stickers)) throw new Error("src/data/stickers.json is invalid");

const existing = readJson(queueFile, { version: 1, items: [] });
const existingItems = Array.isArray(existing?.items) ? existing.items : [];
const byId = new Map(existingItems.filter((item) => item?.productId).map((item) => [String(item.productId), item]));
const now = new Date().toISOString();
let added = 0;

for (const sticker of stickers) {
  const productId = String(sticker?.id || "").replace(/[^0-9]/g, "");
  if (!productId || byId.has(productId)) continue;
  byId.set(productId, {
    productId,
    title: String(sticker?.title || productId).trim(),
    status: "pending",
    discoveredAt: now,
    source: "sticker-catalog",
    note: "R2 write intentionally deferred",
  });
  added++;
}

const items = [...byId.values()].sort((a, b) => Number(b.productId) - Number(a.productId));
const output = {
  version: 1,
  generatedAt: now,
  r2WritesEnabled: false,
  pendingCount: items.filter((item) => item.status === "pending").length,
  items,
};

fs.mkdirSync(path.dirname(queueFile), { recursive: true });
fs.writeFileSync(queueFile, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Digital material queue updated: ${items.length} total, ${added} added`);
console.log("R2 writes: disabled");
