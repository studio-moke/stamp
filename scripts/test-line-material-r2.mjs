import { prepareLineMaterialZip } from "../server/api/_line-materials.js";
import { r2Head } from "../server/api/_r2.js";

const productId = String(process.env.LINE_PRODUCT_ID || "36313683").replace(/[^0-9]/g, "");
if (!productId) throw new Error("LINE_PRODUCT_ID is invalid");

const required = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"];
for (const name of required) {
  if (!process.env[name]) throw new Error(`${name} is not configured`);
}

const product = {
  id: productId,
  title: process.env.LINE_PRODUCT_TITLE || `LINE sticker ${productId}`,
};

console.log(`Preparing one private R2 test object for product ${productId}...`);
const prepared = await prepareLineMaterialZip(product);
const exists = await r2Head(prepared.zipKey);
if (!exists) throw new Error(`R2 HEAD failed for ${prepared.zipKey}`);

console.log(JSON.stringify({
  ok: true,
  productId: prepared.productId,
  assetCount: prepared.assetCount,
  zipKey: prepared.zipKey,
  contentHash: prepared.contentHash,
  preparedAt: prepared.preparedAt,
  sourcePackage: prepared.sourcePackage,
  published: false,
  catalogWritten: false,
  stripeCalled: false,
}, null, 2));
