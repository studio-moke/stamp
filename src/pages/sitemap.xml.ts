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

type Locale = (typeof LOCALES)[number];

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function localizedUrl(locale: Locale, path: string) {
  return `${SITE_URL}${localizedPath(locale, path)}`;
}

function renderUrlEntry(currentUrl: string, alternatesByLocale: Record<Locale, string>, xDefaultUrl: string) {
  const alternates = LOCALES
    .map((locale) => `    <xhtml:link rel="alternate" hreflang="${localeInfo[locale].htmlLang}" href="${escapeXml(alternatesByLocale[locale])}" />`)
    .join("\n");

  return `  <url>\n    <loc>${escapeXml(currentUrl)}</loc>\n${alternates}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(xDefaultUrl)}" />\n  </url>`;
}

function multilingualEntries(path: string) {
  const urls = Object.fromEntries(
    LOCALES.map((locale) => [locale, localizedUrl(locale, path)]),
  ) as Record<Locale, string>;

  return LOCALES.map((locale) => renderUrlEntry(urls[locale], urls, urls.ja));
}

function multilingualTagEntries(tag: (typeof tagDefinitions)[number]) {
  const urls = Object.fromEntries(
    LOCALES.map((locale) => [locale, `${SITE_URL}${getTagPath(locale, tag)}`]),
  ) as Record<Locale, string>;

  return LOCALES.map((locale) => renderUrlEntry(urls[locale], urls, urls.ja));
}

export function GET() {
  const entries: string[] = [];

  entries.push(...multilingualEntries("/"));
  entries.push(...multilingualEntries("/goods/"));
  entries.push(...multilingualEntries("/tags/"));
  entries.push(...multilingualEntries("/qr-maker"));
  entries.push(...multilingualEntries("/chat-stamp-maker"));
  entries.push(`  <url><loc>${escapeXml(`${SITE_URL}/color-palette/`)}</loc></url>`);
  entries.push(`  <url><loc>${escapeXml(`${SITE_URL}/image-compressor/`)}</loc></url>`);

  for (const sticker of stickers) {
    entries.push(...multilingualEntries(`/stickers/${encodeURIComponent(sticker.id)}`));
  }

  for (const design of designs) {
    entries.push(...multilingualEntries(`/goods/${encodeURIComponent(String(design.id))}`));
  }

  for (const tag of tagDefinitions) {
    const count = stickers.filter((sticker) => getTagIdsForSticker(sticker).includes(tag.id)).length;
    if (count >= 2) entries.push(...multilingualTagEntries(tag));
  }

  // Category routes currently exist only in Japanese, so do not advertise
  // non-existent localized category URLs to search engines.
  entries.push(`  <url><loc>${escapeXml(`${SITE_URL}/categories/`)}</loc></url>`);
  for (const category of CATEGORY_DEFINITIONS) {
    const count = stickers.filter((sticker) => getCategory(sticker) === category.name).length;
    const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
    for (let page = 1; page <= totalPages; page += 1) {
      entries.push(`  <url><loc>${escapeXml(`${SITE_URL}/categories/${category.slug}/${page}`)}</loc></url>`);
    }
  }

  const body = entries.join("\n");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body}\n</urlset>`,
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=0, s-maxage=3600",
      },
    },
  );
}
