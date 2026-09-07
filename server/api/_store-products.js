import { getDigitalProduct, getDigitalProducts } from "./_store-catalog.js";
import { r2GetJson } from "./_r2.js";

function stateKey(productId) {
  return `digital-products/catalog/${String(productId).replace(/[^0-9]/g, "")}.json`;
}

function safeZipKey(productId, value = "") {
  const id = String(productId || "").replace(/[^0-9]/g, "");
  const key = String(value || "");
  return id && key.startsWith(`digital-products/${id}/`) && key.endsWith(".zip") ? key : "";
}

export async function getRuntimeDigitalProduct(productId) {
  const base = getDigitalProduct(productId);
  if (!base) return null;
  const runtime = await r2GetJson(stateKey(base.id), null).catch(() => null);
  const runtimeZipKey = safeZipKey(base.id, runtime?.zipKey);
  const staticZipKey = safeZipKey(base.id, base.zipKey);
  const zipKey = runtimeZipKey || staticZipKey;
  const assetCount = Number(runtime?.assetCount || 0) || Number(base.assetCount || 0) || 0;
  const runtimePublished = runtime?.published === true && Boolean(runtimeZipKey) && assetCount > 0;
  const staticPublished = base.published === true && Boolean(staticZipKey);
  return {
    ...base,
    zipKey,
    assetCount,
    published: runtimePublished || staticPublished,
    preparedAt: runtime?.preparedAt || "",
  };
}

export async function getRuntimeDigitalProducts() {
  const products = getDigitalProducts();
  return Promise.all(products.map((product) => getRuntimeDigitalProduct(product.id)));
}

export { stateKey, safeZipKey };
