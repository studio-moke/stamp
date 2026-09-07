import stickers from "../../src/data/stickers.json" with { type: "json" };
import overrides from "../../src/data/digital-product-overrides.json" with { type: "json" };

export const DIGITAL_PRODUCT_PRICE_YEN = 500;

function cleanTitle(value = "") {
  return String(value)
    .replace(/\s*-\s*LINE スタンプ\s*\|\s*LINE STORE\s*$/u, "")
    .replace(/\s*\d+種類\s*$/u, "")
    .trim();
}

export function getDigitalProducts() {
  const productOverrides = overrides?.products || {};
  return stickers.map((sticker) => {
    const override = productOverrides[String(sticker.id)] || {};
    const zipKey = typeof override.zipKey === "string" ? override.zipKey.trim() : "";
    const published = override.published === true && Boolean(zipKey);
    return {
      id: String(sticker.id),
      title: cleanTitle(sticker.title),
      description: sticker.description || "",
      image: sticker.image || "",
      lineUrl: sticker.url || sticker.purchaseUrl || "",
      priceYen: DIGITAL_PRODUCT_PRICE_YEN,
      published,
      zipKey,
    };
  });
}

export function getDigitalProduct(productId) {
  return getDigitalProducts().find((product) => product.id === String(productId || "")) || null;
}
