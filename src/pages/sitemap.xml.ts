import stickers from "../data/stickers.json";
import designs from "../data/suzuri-designs.json";
import {
  CATEGORY_DEFINITIONS,
  getCategory,
  SITE_URL,
} from "../lib/stickers";
import { LOCALES, localeInfo, localizedPath } from "../lib/i18n";
import { getTagIdsForSticker, getTagPath, tagDefinitions } from "../lib/sticker-search-tags";

const PAGE_SIZE = 24;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function localizedUrl(locale: (typeof LOCALES)[number], path: string) {
  return `${SITE_URL}${localizedPath(locale, path)}`;
}

function multilingualEntry(path: string) {
  const alternates = LOCALES
    .map((locale) => `    <xhtml:link rel="alternate" hreflang="${localeInfo[locale].htmlLang}" href="${escapeXml(localizedUrl(locale, path))}" />`)
    .join("\n");
  return `  <url>\n    <loc>${escapeXml(localizedUrl("ja", path))}</loc>\n${alternates}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(localizedUrl("ja", path))}" />\n  </url>`;
}

function multilingualTagEntry(tag: (typeof tagDefinitions)[number]) {
  const urls = Object.fromEntries(LOCALES.map((locale) => [locale, `${SITE_URL}${getTagPath(locale, tag)}`])) as Record<(typeof LOCALES)[number], string>;
  const alternates = LOCALES
    .map((locale) => `    <xhtml:link rel="alternate" hreflang="${localeInfo[locale].htmlLang}" href="${escapeXml(urls[locale])}" />`)
    .join("\n");
  return `  <url>\n    <loc>${escapeXml(urls.ja)}</loc>\n${alternates}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(urls.ja)}" />\n  </url>`;
}

export function GET() {
  const entries: string[] = [];

  entries.push(multilingualEntry("/"));
  entries.push(multilingualEntry("/goods/"));
  entries.push(multilingualEntry("/tags/"));

  for (const sticker of stickers) {
    entries.push(multilingualEntry(`/stickers/${encodeURIComponent(sticker.id)}`));
  }

  for (const design of designs) {
    entries.push(multilingualEntry(`/goods/${encodeURIComponent(String(design.id))}`));
  }

  for (const tag of tagDefinitions) {
    const count = stickers.filter((sticker) => getTagIdsForSticker(sticker).includes(tag.id)).length;
    if (count >= 2) entries.push(multilingualTagEntry(tag));
  }

  entries.push(`  <url><loc>${escapeXml(`${SITE_URL}/categories/`)}</loc></url>`);
  for (const category of CATEGORY_DEFINITIONS) {
    const count = stickers.filter((sticker) => getCategory(sticker) === category.name).length;
    const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
    for (let page = 1; page <= totalPages; page += 1) {
      entries.push(`  <url><loc>${escapeXml(`${SITE_URL}/categories/${category.slug}/${page}`)}</loc></url>`);
    }
  }

  const body = entries.join("\n");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body}\n</urlset>`, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
