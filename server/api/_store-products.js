import { getDigitalProduct, getDigitalProducts } from "./_store-catalog.js";
import { r2GetJson, r2PutJson } from "./_r2.js";

export const RUNTIME_CATALOG_KEY = "digital-products/catalog.json";

export function safeZipKey(productId, value = "") {
  const id = String(productId || "").replace(/[^0-9]/g, "");
  const key = String(value || "");
  return id && key.startsWith(`digital-products/${id}/`) && key.endsWith(".zip") ? key : "";
}

export async function readRuntimeCatalog() {
  const value = await r2GetJson(RUNTIME_CATALOG_KEY, { products: {} }).catch(() => ({ products: {} }));
  return value && typeof value === "object" && value.products && typeof value.products === "object" ? value : { products: {} };
}

function mergeProduct(base, runtime = {}) {
  if (!base) return null;
  const runtimeZipKey = safeZipKey(base.id, runtime?.zipKey);
  const staticZipKey = safeZipKey(base.id, base.zipKey);
  const zipKey = runtimeZipKey || staticZipKey;
  const assetCount = Number(runtime?.assetCount || 0) || Number(base.assetCount || 0) || 0;
  const runtimePublished = runtime?.published === true && Boolean(runtimeZipKey) && assetCount > 0;
  const staticPublished = base.published === true && Boolean(staticZipKey);
  return { ...base, zipKey, assetCount, published: runtimePublished || staticPublished, preparedAt: runtime?.preparedAt || "" };
}

export async function getRuntimeDigitalProduct(productId) {
  const base = getDigitalProduct(productId);
  if (!base) return null;
  const catalog = await readRuntimeCatalog();
  return mergeProduct(base, catalog.products?.[String(base.id)] || {});
}

export async function getRuntimeDigitalProducts() {
  const catalog = await readRuntimeCatalog();
  return getDigitalProducts().map((base) => mergeProduct(base, catalog.products?.[String(base.id)] || {}));
}

export async function writeRuntimeProductState(productId, patch) {
  const id = String(productId || "").replace(/[^0-9]/g, "");
  if (!id) throw new Error("Invalid product id");
  const catalog = await readRuntimeCatalog();
  const current = catalog.products?.[id] || {};
  const next = {
    ...catalog,
    products: { ...(catalog.products || {}), [id]: { ...current, ...patch, productId: id } },
    updatedAt: new Date().toISOString(),
  };
  await r2PutJson(RUNTIME_CATALOG_KEY, next);
  return next.products[id];
}
