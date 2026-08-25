import fs from "node:fs";
import path from "node:path";

const AUTHOR_URL =
  "https://store.line.me/stickershop/author/6507349/ja";

const outputDir = path.resolve("src/data");
const outputFile = path.join(outputDir, "stickers.json");

const imageDir = path.resolve("public/images/stickers");

const MAX_PAGES = 100;

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  "Accept-Language": "ja-JP,ja;q=0.9",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
};

const imageHeaders = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  Referer: "https://store.line.me/",
  Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getHtml(url) {
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`${response.status}: ${url}`);
  }

  const buffer = await response.arrayBuffer();
  return new TextDecoder("utf-8").decode(buffer);
}

function decodeHtml(text) {
  if (!text) return "";

  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => {
      try {
        return String.fromCodePoint(Number(code));
      } catch {
        return _;
      }
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => {
      try {
        return String.fromCodePoint(parseInt(code, 16));
      } catch {
        return _;
      }
    });
}

function cleanText(text) {
  return decodeHtml(
    text
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function toAbsoluteUrl(href) {
  try {
    return new URL(href, AUTHOR_URL).toString();
  } catch {
    return "";
  }
}

function extractPaginationUrls(html) {
  const urls = new Set();
  const pattern = /href=["']([^"']*(?:\?|&)page=\d+[^"']*)["']/gi;

  let match;

  while ((match = pattern.exec(html)) !== null) {
    const url = toAbsoluteUrl(decodeHtml(match[1]));

    if (url) urls.add(url);
  }

  return [...urls];
}

function extractProducts(html) {
  const products = [];

  const patterns = [
    /href=["'](\/stickershop\/product\/(\d+)\/ja)["'][^>]*>([\s\S]*?)<\/a>/g,
    /href=["'](https?:\/\/store\.line\.me\/stickershop\/product\/(\d+)\/ja)["'][^>]*>([\s\S]*?)<\/a>/g,
  ];

  for (const pattern of patterns) {
    let match;

    while ((match = pattern.exec(html)) !== null) {
      const url = match[1].startsWith("http")
        ? match[1]
        : `https://store.line.me${match[1]}`;

      const id = match[2];
      const title = cleanText(match[3]);

      if (!products.some((item) => item.id === id)) {
        products.push({
          id,
          title,
          url,
          description: "",
          price: "",
          purchaseUrl: url,
          giftUrl: url,
          imageUrl: "",
          image: "",
        });
      }
    }
  }

  return products;
}

async function getProductInfo(product) {
  try {
    const html = await getHtml(product.url);

    const titlePatterns = [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
      /<h1[^>]*>([\s\S]*?)<\/h1>/i,
    ];

    for (const pattern of titlePatterns) {
      const match = html.match(pattern);

      if (match) {
        const title = cleanText(match[1]);

        if (title) {
          product.title = title;
          break;
        }
      }
    }

    const descriptionPatterns = [
      /<p[^>]*class=["'][^"']*mdCMN38Item01Txt[^"']*["'][^>]*>([\s\S]*?)<\/p>/i,
      /class=["'][^"']*mdCMN38Item01Txt[^"']*["'][^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
    ];

    for (const pattern of descriptionPatterns) {
      const match = html.match(pattern);

      if (match) {
        const description = cleanText(match[1]);

        if (description) {
          product.description = description;
          break;
        }
      }
    }

    const pricePatterns = [
      /(?:￥|¥)\s*([0-9,]+)\s*(?:円)?/i,
      /([0-9,]+)\s*円/i,
    ];

    for (const pattern of pricePatterns) {
      const match = html.match(pattern);

      if (match) {
        product.price = `￥${match[1]}`;
        break;
      }
    }

    const imagePatterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    ];

    let imageUrl = "";

    for (const pattern of imagePatterns) {
      const match = html.match(pattern);

      if (match) {
        imageUrl = decodeHtml(match[1]);
        break;
      }
    }

    if (!imageUrl) {
      const imgPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;

      for (const match of html.matchAll(imgPattern)) {
        const src = decodeHtml(match[1]);

        if (src.includes("line-scdn.net") || src.includes("line.me")) {
          imageUrl = src;
          break;
        }
      }
    }

    if (imageUrl.startsWith("//")) imageUrl = `https:${imageUrl}`;
    if (imageUrl) product.imageUrl = imageUrl;

    return product;
  } catch (error) {
    console.log(`  商品情報取得失敗: ${product.url}`);
    console.log(`  ${error.message}`);
    return product;
  }
}

function getExtension(contentType, imageUrl) {
  const type = (contentType || "").toLowerCase();

  if (type.includes("png")) return ".png";
  if (type.includes("webp")) return ".webp";
  if (type.includes("gif")) return ".gif";
  if (type.includes("jpeg") || type.includes("jpg")) return ".jpg";

  const cleanUrl = imageUrl.split("?")[0].toLowerCase();

  if (cleanUrl.endsWith(".png")) return ".png";
  if (cleanUrl.endsWith(".webp")) return ".webp";
  if (cleanUrl.endsWith(".jpg") || cleanUrl.endsWith(".jpeg")) return ".jpg";

  return ".png";
}

async function downloadImage(product) {
  if (!product.imageUrl) return false;

  try {
    const response = await fetch(product.imageUrl, { headers: imageHeaders });

    if (!response.ok) {
      console.log(`  画像取得失敗: ${response.status}`);
      return false;
    }

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("image")) {
      console.log(`  画像ではありません: ${contentType}`);
      return false;
    }

    const extension = getExtension(contentType, product.imageUrl);
    const filename = `${product.id}${extension}`;
    const filepath = path.join(imageDir, filename);
    const arrayBuffer = await response.arrayBuffer();

    fs.writeFileSync(filepath, Buffer.from(arrayBuffer));
    product.image = `/images/stickers/${filename}`;

    return true;
  } catch (error) {
    console.log(`  画像保存失敗: ${error.message}`);
    return false;
  }
}

async function collectAllProducts() {
  const queue = [AUTHOR_URL];
  const visited = new Set();
  const allProducts = [];

  while (queue.length > 0 && visited.size < MAX_PAGES) {
    const url = queue.shift();

    if (visited.has(url)) continue;
    visited.add(url);

    console.log(`ページ ${visited.size} を取得中...`);
    console.log(`  ${url}`);

    let html;

    try {
      html = await getHtml(url);
    } catch (error) {
      console.log(`  → 取得失敗: ${error.message}`);
      continue;
    }

    const products = extractProducts(html);
    console.log(`  → ${products.length}作品`);

    for (const product of products) {
      if (!allProducts.some((item) => item.id === product.id)) {
        allProducts.push(product);
      }
    }

    for (const pageUrl of extractPaginationUrls(html)) {
      if (!visited.has(pageUrl) && !queue.includes(pageUrl)) {
        queue.push(pageUrl);
      }
    }

    await sleep(500);
  }

  return allProducts;
}

async function main() {
  console.log("");
  console.log("=================================");
  console.log(" STAMP MOKE 自動取得");
  console.log("=================================");
  console.log("");

  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(imageDir, { recursive: true });

  const allProducts = await collectAllProducts();

  console.log("");
  console.log(`合計 ${allProducts.length}作品`);
  console.log("");

  if (allProducts.length < 100) {
    throw new Error(
      `取得件数が少なすぎます: ${allProducts.length}件。100件未満なので既存データを上書きしません。`
    );
  }

  console.log("商品情報を取得しています...");
  console.log("");

  for (let i = 0; i < allProducts.length; i++) {
    const product = allProducts[i];

    console.log(`[${i + 1}/${allProducts.length}] ${product.title}`);
    await getProductInfo(product);
    await sleep(300);
  }

  console.log("");
  console.log("スタンプ画像を保存しています...");
  console.log("");

  let imageCount = 0;

  for (let i = 0; i < allProducts.length; i++) {
    const product = allProducts[i];

    if (!product.imageUrl) {
      console.log(`[${i + 1}/${allProducts.length}] 画像URLなし`);
      continue;
    }

    console.log(`[${i + 1}/${allProducts.length}] ${product.title}`);

    const success = await downloadImage(product);
    if (success) imageCount++;

    await sleep(300);
  }

  const outputProducts = allProducts.map((product) => ({
    id: product.id,
    title: product.title,
    description: product.description || "",
    price: product.price || "",
    url: product.url,
    purchaseUrl: product.purchaseUrl || product.url,
    giftUrl: product.giftUrl || product.url,
    image: product.image,
  }));

  fs.writeFileSync(
    outputFile,
    JSON.stringify(outputProducts, null, 2),
    "utf8"
  );

  console.log("");
  console.log("=================================");
  console.log(" 完了！");
  console.log("=================================");
  console.log("");
  console.log(`作品数: ${outputProducts.length}`);
  console.log(`画像保存: ${imageCount}/${outputProducts.length}`);
  console.log(`JSON: ${outputFile}`);
  console.log(`画像: ${imageDir}`);
  console.log("");
}

main().catch((error) => {
  console.error("");
  console.error("取得に失敗しました。");
  console.error(error);
  process.exit(1);
});
