import fs from "node:fs";
import path from "node:path";
import { r2GetJson, r2Head, r2PutJson } from "../server/api/_r2.js";

const PREVIEW_CATALOG_KEY = "digital-products/preview/catalog.json";
const productId = String(process.env.DIGITAL_MATERIAL_TEST_PRODUCT_ID || "").replace(/[^0-9]/g, "");

// This script writes only the Preview catalog and is safe to run repeatedly.
if (process.env.PREVIEW_STORE_TEST_SEED !== "1") throw new Error("Preview test seed was not explicitly enabled");
if (process.env.GITHUB_REF !== "refs/heads/feature/digital-material-store") throw new Error("Preview test seed is restricted to the feature branch");
if (!/^[0-9]{6,20}$/.test(productId)) throw new Error("Invalid test product ID");

const queueFile = path.resolve("src/data/digital-material-queue.json");
const queue = JSON.parse(fs.readFileSync(queueFile, "utf8"));
const item = Array.isArray(queue.items) ? queue.items.find((entry) => String(entry.productId) === productId) : null;
if (!item || item.status !== "ready" || !item.zipKey || !Number.isInteger(item.assetCount) || item.assetCount < 1) {
  throw new Error("Requested test product is not a verified ready material");
}
if (!(await r2Head(item.zipKey))) throw new Error("Verified test ZIP is missing from private R2");

const catalog = await r2GetJson(PREVIEW_CATALOG_KEY, { products: {} });
const products = catalog && typeof catalog.products === "object" ? catalog.products : {};
const next = {
  ...catalog,
  products: {
    ...products,
    [productId]: {
      ...(products[productId] || {}),
      productId,
      zipKey: item.zipKey,
      assetCount: item.assetCount,
      published: true,
      preparedAt: item.preparedAt || new Date().toISOString(),
      source: "preview-stripe-test",
      testOnly: true,
    },
  },
  updatedAt: new Date().toISOString(),
};

await r2PutJson(PREVIEW_CATALOG_KEY, next);
console.log(JSON.stringify({ ok: true, productId, assetCount: item.assetCount, catalogKey: PREVIEW_CATALOG_KEY, zipKey: item.zipKey }));
