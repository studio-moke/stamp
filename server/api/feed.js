import { r2GetJson } from "./_r2.js";

const SITE = "https://stamp-moke.jp";
const INDEX_KEY = "news/index.json";

const esc = (value = "") => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&apos;");

function absolute(path = "") {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE}${path.startsWith("/") ? path : `/${path}`}`;
}

function pubDate(item) {
  const raw = item.generatedAt || (item.date ? `${item.date}T00:00:00+09:00` : "");
  const date = raw ? new Date(raw) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toUTCString() : date.toUTCString();
}

async function loadItems() {
  try {
    const response = await fetch(`${SITE}/api/news?limit=80`, {
      headers: { "user-agent": "stamp-moke-rss/1.0" },
      cache: "no-store",
    });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data?.items)) return data.items;
    }
  } catch {}

  try {
    const items = await r2GetJson(INDEX_KEY, []);
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).send("Method not allowed");
  }

  const items = await loadItems();
  const lastBuildDate = items.length ? pubDate(items[0]) : new Date().toUTCString();
  const xmlItems = items.map((item) => {
    const newsUrl = `${SITE}/news/?slug=${encodeURIComponent(item.slug || item.id || "")}`;
    const sourceUrl = absolute(item.url || "/");
    const description = [item.lead, item.body].filter(Boolean).join("\n\n");
    const image = item.image ? `\n      <media:content url="${esc(absolute(item.image))}" medium="image" />` : "";
    return `    <item>\n      <title>${esc(item.title || item.sourceTitle || "stamp moke NEWS")}</title>\n      <link>${esc(newsUrl)}</link>\n      <guid isPermaLink="false">${esc(item.id || item.slug || newsUrl)}</guid>\n      <pubDate>${esc(pubDate(item))}</pubDate>\n      <category>${esc(item.label || item.type || "NEWS")}</category>\n      <description>${esc(description)}</description>\n      <source url="${esc(sourceUrl)}">stamp moke</source>${image}\n    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">\n  <channel>\n    <title>stamp moke NEWS</title>\n    <link>${SITE}/news/</link>\n    <description>stamp mokeの新作LINEスタンプ、フリー素材、無料ツール、SUZURIグッズなどの更新情報です。</description>\n    <language>ja</language>\n    <lastBuildDate>${esc(lastBuildDate)}</lastBuildDate>\n    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml" />\n${xmlItems}\n  </channel>\n</rss>\n`;

  res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=1800");
  return res.status(200).send(xml);
}
