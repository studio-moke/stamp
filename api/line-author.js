const AUTHOR_URL = "https://store.line.me/stickershop/author/6507349/ja";
const MAX_PAGES = 20;

const baseHeaders = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  "Accept-Language": "ja-JP,ja;q=0.9,en;q=0.5",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

function createSession() {
  const jar = new Map();

  function updateCookies(response) {
    let values = [];
    if (typeof response.headers.getSetCookie === "function") values = response.headers.getSetCookie();
    if (!values.length) {
      const combined = response.headers.get("set-cookie");
      if (combined) values = combined.split(/,(?=[^;,]+=)/g);
    }
    for (const value of values) {
      const pair = value.split(";", 1)[0];
      const index = pair.indexOf("=");
      if (index <= 0) continue;
      jar.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim());
    }
  }

  async function get(url, referer = "https://store.line.me/") {
    const headers = { ...baseHeaders, Referer: referer };
    if (jar.size) headers.Cookie = [...jar].map(([key, value]) => `${key}=${value}`).join("; ");
    const response = await fetch(url, { headers, redirect: "follow", cache: "no-store" });
    updateCookies(response);
    if (!response.ok) throw new Error(`${response.status}: ${url}`);
    return response.text();
  }

  return { get };
}

function decodeHtml(text = "") {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;|&#160;/g, " ");
}

function cleanText(text = "") {
  return decodeHtml(text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function extractProducts(html) {
  const products = new Map();
  const normalized = decodeHtml(html).replace(/\\\//g, "/").replace(/\\u002F/gi, "/");

  for (const match of normalized.matchAll(/href=["'](?:https?:\/\/store\.line\.me)?(\/stickershop\/product\/(\d+)\/ja)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const id = match[2];
    if (!products.has(id)) {
      products.set(id, {
        id,
        title: cleanText(match[3]),
        url: `https://store.line.me/stickershop/product/${id}/ja`,
      });
    }
  }

  for (const match of normalized.matchAll(/\/stickershop\/product\/(\d+)\/(?:ja|en|ko|th|zh-Hant|zh-Hans|id)/gi)) {
    const id = match[1];
    if (!products.has(id)) products.set(id, { id, title: "", url: `https://store.line.me/stickershop/product/${id}/ja` });
  }

  return [...products.values()];
}

function extractVisibleCount(html) {
  const normalized = html.replace(/\s+/g, " ");
  const match = normalized.match(/data-test=["']author-name["'][\s\S]{0,500}?<span>\s*([0-9,]+)\s*件\s*<\/span>/i)
    || normalized.match(/<span>\s*([0-9,]+)\s*件\s*<\/span>/i);
  return match ? Number(match[1].replace(/,/g, "")) : null;
}

function hasNextPage(html, nextPage) {
  const pattern = new RegExp(`href=["']\\?page=${nextPage}["']`, "i");
  return pattern.test(html);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const session = createSession();
    const all = new Map();
    const pages = [];
    let visibleCount = null;
    let referer = "https://store.line.me/";

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const url = page === 1 ? AUTHOR_URL : `${AUTHOR_URL}?page=${page}`;
      const html = await session.get(url, referer);
      const products = extractProducts(html);
      if (page === 1) visibleCount = extractVisibleCount(html);
      for (const product of products) all.set(product.id, product);
      pages.push({ page, products: products.length });

      const nextPage = page + 1;
      if (!hasNextPage(html, nextPage)) break;
      referer = url;
    }

    const products = [...all.values()];
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.status(200).json({
      region: process.env.VERCEL_REGION || null,
      authorId: "6507349",
      visibleCount,
      count: products.length,
      pages,
      products,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(502).json({
      region: process.env.VERCEL_REGION || null,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
