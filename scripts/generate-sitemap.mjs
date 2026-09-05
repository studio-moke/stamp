import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("dist");
const SITE = "https://stamp-moke.jp";
const PAGES_OUT = path.join(ROOT, "sitemap-pages.xml");
const FREE_OUT = path.join(ROOT, "free-sitemap.xml");
const PARENT_SITEMAP = path.join(ROOT, "sitemap.xml");
const STICKERS_SOURCE = path.resolve("src/data/stickers.json");
const PAGES_SOURCE = path.resolve("src/pages");
const EXCLUDED_SEGMENTS = new Set(["admin", "free-admin", "api"]);

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await listFiles(full));
    else out.push(full);
  }
  return out;
}

function relativeFile(file) {
  return path.relative(ROOT, file).replaceAll(path.sep, "/");
}

function excluded(file) {
  const segments = relativeFile(file).split("/").filter(Boolean);
  return segments.some((segment) => EXCLUDED_SEGMENTS.has(segment));
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, "i"));
  return match?.[2] ?? null;
}

function isNoindex(html) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const name = attr(tag, "name")?.toLowerCase();
    if (name !== "robots" && name !== "googlebot") continue;
    const content = attr(tag, "content")?.toLowerCase() || "";
    if (content.split(/[\s,]+/).includes("noindex")) return true;
  }
  return false;
}

function canonicalHref(html) {
  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    const rel = (attr(tag, "rel") || "").toLowerCase().split(/\s+/);
    if (rel.includes("canonical")) return attr(tag, "href");
  }
  return null;
}

function fallbackUrl(file) {
  const relative = relativeFile(file);
  if (relative === "index.html") return `${SITE}/`;
  if (relative.endsWith("/index.html")) {
    return `${SITE}/${relative.slice(0, -"index.html".length)}`;
  }
  return null;
}

function validateCanonical(value, file) {
  const source = relativeFile(file);
  let url;
  try {
    url = new URL(value, SITE);
  } catch {
    throw new Error(`[sitemap] invalid canonical URL in ${source}: ${value}`);
  }

  if (url.protocol !== "https:" || url.hostname !== "stamp-moke.jp" || url.port) {
    throw new Error(`[sitemap] canonical must use https://stamp-moke.jp in ${source}: ${url.toString()}`);
  }
  if (url.search || url.hash) {
    throw new Error(`[sitemap] canonical must not contain query/hash in ${source}: ${url.toString()}`);
  }
  if (url.pathname.includes("//")) {
    throw new Error(`[sitemap] canonical contains a double slash in ${source}: ${url.toString()}`);
  }
  if (!url.pathname.endsWith("/")) {
    throw new Error(`[sitemap] canonical route must end with / in ${source}: ${url.toString()}`);
  }

  return url.toString();
}

function isFreeUrl(value) {
  const { pathname } = new URL(value);
  return pathname.split("/").filter(Boolean).includes("free");
}

function sortUrls(urls) {
  return [...urls].sort((a, b) => {
    if (a === `${SITE}/`) return -1;
    if (b === `${SITE}/`) return 1;
    return a.localeCompare(b, "en");
  });
}

function renderUrlset(urls) {
  const body = urls.map((url) => `  <url>\n    <loc>${escapeXml(url)}</loc>\n  </url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

async function discoverStickerPrefixes() {
  const prefixes = [];
  try {
    await fs.access(path.join(PAGES_SOURCE, "stickers", "[id].astro"));
    prefixes.push("");
  } catch {}

  for (const entry of await fs.readdir(PAGES_SOURCE, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === "stickers") continue;
    try {
      await fs.access(path.join(PAGES_SOURCE, entry.name, "stickers", "[id].astro"));
      prefixes.push(entry.name);
    } catch {}
  }
  return prefixes.sort();
}

async function validateStickerCoverage(allUrls) {
  const stickers = JSON.parse(await fs.readFile(STICKERS_SOURCE, "utf8"));
  const prefixes = await discoverStickerPrefixes();
  if (!Array.isArray(stickers) || stickers.length === 0) {
    throw new Error("[sitemap] src/data/stickers.json is empty or invalid");
  }
  if (prefixes.length === 0) {
    throw new Error("[sitemap] no sticker route templates were found");
  }

  const missing = [];
  for (const sticker of stickers) {
    if (!sticker?.id) throw new Error("[sitemap] sticker without id found in stickers.json");
    for (const prefix of prefixes) {
      const localePart = prefix ? `${prefix}/` : "";
      const expected = `${SITE}/${localePart}stickers/${sticker.id}/`;
      if (!allUrls.has(expected)) missing.push(expected);
    }
  }

  if (missing.length) {
    const sample = missing.slice(0, 20).join("\n  ");
    throw new Error(`[sitemap] ${missing.length} sticker URLs are missing from sitemap coverage:\n  ${sample}${missing.length > 20 ? "\n  ..." : ""}`);
  }

  console.log(`[sitemap] sticker coverage OK: ${stickers.length} stickers x ${prefixes.length} route locales`);
}

async function validateParentSitemap() {
  const xml = await fs.readFile(PARENT_SITEMAP, "utf8");
  const required = [
    `${SITE}/sitemap-pages.xml`,
    `${SITE}/free-sitemap.xml`,
  ];
  if (!/<sitemapindex\b/i.test(xml)) {
    throw new Error("[sitemap] sitemap.xml must be a sitemapindex");
  }
  for (const url of required) {
    if (!xml.includes(`<loc>${url}</loc>`)) {
      throw new Error(`[sitemap] sitemap.xml is missing child sitemap: ${url}`);
    }
  }
}

const files = await listFiles(ROOT);
const canonicalSources = new Map();
const allUrls = new Set();
let skippedNoindex = 0;
let skippedExcluded = 0;

for (const file of files) {
  if (!file.endsWith(".html")) continue;
  if (excluded(file)) {
    skippedExcluded += 1;
    continue;
  }

  const html = await fs.readFile(file, "utf8");
  if (isNoindex(html)) {
    skippedNoindex += 1;
    continue;
  }

  const explicitCanonical = canonicalHref(html);
  const value = explicitCanonical || fallbackUrl(file);
  if (!value) {
    throw new Error(`[sitemap] indexable HTML has no canonical/fallback URL: ${relativeFile(file)}`);
  }

  const canonical = validateCanonical(value, file);
  const previous = canonicalSources.get(canonical);
  if (previous && previous !== relativeFile(file)) {
    throw new Error(`[sitemap] duplicate canonical ${canonical}\n  ${previous}\n  ${relativeFile(file)}`);
  }
  canonicalSources.set(canonical, relativeFile(file));
  allUrls.add(canonical);
}

if (!allUrls.has(`${SITE}/`)) {
  throw new Error("[sitemap] homepage missing from generated sitemap");
}

await validateStickerCoverage(allUrls);

const freeUrls = new Set([...allUrls].filter(isFreeUrl));
const pageUrls = new Set([...allUrls].filter((url) => !isFreeUrl(url)));

if (!freeUrls.has(`${SITE}/free/`)) {
  throw new Error("[sitemap] /free/ is missing from free-sitemap.xml coverage");
}
if ([...freeUrls].some((url) => pageUrls.has(url))) {
  throw new Error("[sitemap] URL overlap detected between child sitemaps");
}

const orderedPages = sortUrls(pageUrls);
const orderedFree = sortUrls(freeUrls);
await fs.writeFile(PAGES_OUT, renderUrlset(orderedPages));
await fs.writeFile(FREE_OUT, renderUrlset(orderedFree));
await validateParentSitemap();

console.log(`[sitemap] sitemap-pages.xml: ${orderedPages.length} URLs`);
console.log(`[sitemap] free-sitemap.xml: ${orderedFree.length} URLs`);
console.log(`[sitemap] total indexable public URLs: ${allUrls.size}`);
console.log(`[sitemap] excluded private/admin HTML: ${skippedExcluded}`);
console.log(`[sitemap] excluded noindex HTML: ${skippedNoindex}`);
console.log("[sitemap] validation OK: canonical host/protocol, trailing slash, query/hash, double slash, duplicates, sticker coverage, parent index");
