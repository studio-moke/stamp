import stickers from "../data/stickers.json";
import {
  CATEGORY_DEFINITIONS,
  getCategory,
  SITE_URL,
} from "../lib/stickers";

const PAGE_SIZE = 24;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET() {
  const urls = new Set<string>();
  urls.add(`${SITE_URL}/`);
  urls.add(`${SITE_URL}/categories/`);

  for (const category of CATEGORY_DEFINITIONS) {
    const count = stickers.filter((sticker) => getCategory(sticker) === category.name).length;
    const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

    for (let page = 1; page <= totalPages; page += 1) {
      urls.add(`${SITE_URL}/categories/${category.slug}/${page}`);
    }
  }

  for (const sticker of stickers) {
    urls.add(`${SITE_URL}/stickers/${encodeURIComponent(sticker.id)}`);
  }

  const body = [...urls]
    .map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`)
    .join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`,
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
      },
    },
  );
}
