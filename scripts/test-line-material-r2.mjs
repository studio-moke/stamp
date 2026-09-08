import fs from "node:fs";
import path from "node:path";
import { buildLineMaterialZip } from "../server/api/_line-materials.js";
import { r2Head, r2Put } from "../server/api/_r2.js";

const productId = String(process.env.LINE_PRODUCT_ID || "36313683").replace(/[^0-9]/g, "");
if (!productId) throw new Error("LINE_PRODUCT_ID is invalid");
const preparedAt = String(process.env.LINE_MATERIAL_PREPARED_AT || "").trim();
if (Number.isNaN(new Date(preparedAt).getTime())) throw new Error("LINE_MATERIAL_PREPARED_AT must be a valid ISO timestamp");

const required = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"];
for (const name of required) {
  if (!process.env[name]) throw new Error(`${name} is not configured`);
}

const stickers = JSON.parse(fs.readFileSync(path.resolve("src/data/stickers.json"), "utf8"));
const catalogProduct = stickers.find((item) => String(item.id) === productId);
const product = { id: productId, title: process.env.LINE_PRODUCT_TITLE || catalogProduct?.title || `LINE sticker ${productId}` };

console.log(`Preparing one deterministic private R2 test object for product ${productId}...`);
const prepared = await buildLineMaterialZip(product, { preparedAt });
const exists = await r2Head(prepared.zipKey);
if (!exists) await r2Put(prepared.zipKey, prepared.zip, "application/zip");
if (!(await r2Head(prepared.zipKey))) throw new Error(`R2 HEAD failed for ${prepared.zipKey}`);

console.log(JSON.stringify({
  ok: true,
  productId: prepared.productId,
  assetCount: prepared.assetCount,
  zipKey: prepared.zipKey,
  contentHash: prepared.contentHash,
  preparedAt: prepared.preparedAt,
  sourcePackage: prepared.sourcePackage,
  r2UploadSkipped: Boolean(exists),
  published: false,
  catalogWritten: false,
  stripeCalled: false,
}, null, 2));
