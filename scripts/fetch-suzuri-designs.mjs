import fs from "node:fs/promises";

const token = process.env.SUZURI_API_TOKEN;
const userName = "bayasihimokei";
const outputPath = new URL("../src/data/suzuri-designs.json", import.meta.url);

if (!token) {
  throw new Error("SUZURI_API_TOKEN is not configured.");
}

const products = [];
let offset = 0;

while (true) {
  const url = new URL("https://suzuri.jp/api/v1/products");
  url.searchParams.set("userName", userName);
  url.searchParams.set("limit", "50");
  url.searchParams.set("offset", String(offset));

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`SUZURI API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const page = Array.isArray(data.products) ? data.products : [];
  products.push(...page);

  if (!data.meta?.hasNext || page.length === 0) break;
  offset += page.length;
}

const itemPriority = new Map([
  ["sticker", 0],
  ["acrylic-stand", 1],
  ["acrylic-key-chain", 2],
  ["t-shirt", 3],
]);

function priorityFor(product) {
  return itemPriority.get(product.item?.name) ?? 99;
}

function designImageUrl(sampleImageUrl) {
  const url = new URL(sampleImageUrl);
  url.searchParams.set("printed", "false");
  return url.toString();
}

const grouped = new Map();
for (const product of products) {
  if (!product.published || !product.material?.published || product.material?.violation) continue;
  if (!product.material?.id || !product.sampleImageUrl || !product.sampleUrl) continue;

  const materialId = String(product.material.id);
  let design = grouped.get(materialId);
  if (!design) {
    design = {
      id: materialId,
      title: product.material.title || product.title,
      description: product.material.description || "",
      image: designImageUrl(product.sampleImageUrl),
      publishedAt: product.material.publishedAt || product.publishedAt || "",
      representativePriority: priorityFor(product),
      products: [],
    };
    grouped.set(materialId, design);
  }

  const priority = priorityFor(product);
  if (priority < design.representativePriority) {
    design.image = designImageUrl(product.sampleImageUrl);
    design.representativePriority = priority;
  }

  design.products.push({
    id: String(product.id),
    title: product.title,
    image: product.sampleImageUrl,
    url: product.sampleUrl,
    itemName: product.item?.humanizeName || "SUZURIグッズ",
    price: product.discountedPriceWithTax || product.priceWithTax || null,
    regularPrice: product.priceWithTax || null,
    priority,
  });
}

const designs = [...grouped.values()]
  .sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)))
  .map(({ representativePriority, products, ...design }) => ({
    ...design,
    products: products
      .sort((a, b) => a.priority - b.priority || a.itemName.localeCompare(b.itemName, "ja"))
      .map(({ priority, ...product }) => product),
  }));

await fs.writeFile(outputPath, `${JSON.stringify(designs, null, 2)}\n`, "utf8");
console.log(`Saved ${designs.length} SUZURI character designs and ${products.length} products.`);
