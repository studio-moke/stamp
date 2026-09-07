import stickers from "../../src/data/stickers.json" with { type: "json" };
import overrides from "../../src/data/digital-product-overrides.json" with { type: "json" };

export const DIGITAL_PRODUCT_PRICE_YEN = 500;

function cleanTitle(value = "") {
  return String(value)
    .replace(/\s*-\s*LINE スタンプ\s*\|\s*LINE STORE\s*$/u, "")
    .replace(/\s*\d+種類\s*$/u, "")
    .trim();
}

function safeZipKey(productId, value) {
  const key = typeof value === "string" ? value.trim() : "";
  return key.startsWith(`digital-products/${productId}/`) && key.endsWith(".zip") ? key : "";
}

export function getDigitalProducts() {
  const productOverrides = overrides?.products || {};
  return stickers.map((sticker) => {
    const id = String(sticker.id);
    const override = productOverrides[id] || {};
    const zipKey = safeZipKey(id, override.zipKey);
    const assetCount = Number.isInteger(override.assetCount) && override.assetCount > 0 ? override.assetCount : null;
    const published = override.published === true && Boolean(zipKey) && Boolean(assetCount);
    return {
      id,
      title: cleanTitle(sticker.title),
      description: sticker.description || "",
      image: sticker.image || "",
      lineUrl: sticker.url || sticker.purchaseUrl || "",
      priceYen: DIGITAL_PRODUCT_PRICE_YEN,
      published,
      zipKey,
      assetCount,
      packagedAt: typeof override.packagedAt === "string" ? override.packagedAt : "",
    };
  });
}

export function getDigitalProduct(productId) {
  return getDigitalProducts().find((product) => product.id === String(productId || "")) || null;
}
