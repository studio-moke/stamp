import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const SITE = "https://stamp-moke.jp";
const FALLBACK = `${SITE}/ogp/stamp-moke-ogp.png`;
const GENERIC_IMAGES = new Set([
  "/ogp/stamp-moke-ogp.png",
  "/images/biglogo.png",
  "/images/stamp-moke-official-logo.png",
  "/images/stamp-moke-official-logo-header.webp",
  "/images/stamp-moke-official-logo-hero.webp",
  "/favicon.svg",
]);

const esc = (value = "") => String(value).replace(/[&<>\"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();

async function walk(dir) {
  const files = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile() && entry.name === "index.html") files.push(full);
  }
  return files;
}

function attr(html, regex) { return html.match(regex)?.[1] || ""; }
function absolute(value) {
  const raw = String(value || "").trim();
  if (!raw || raw.startsWith("data:") || raw.startsWith("blob:")) return "";
  try { return new URL(raw, SITE).toString(); } catch { return ""; }
}
function pathname(value) {
  try { return new URL(value, SITE).pathname; } catch { return ""; }
}
function metaTag(kind, key, value) { return `<meta ${kind}="${key}" content="${esc(value)}">`; }
function removeMeta(html, kind, key) {
  return html.replace(new RegExp(`<meta\\s+${kind}=["']${key.replace(":", "\\:")}["'][^>]*>\\s*`, "gi"), "");
}
function setMeta(html, kind, key, value) {
  const re = new RegExp(`<meta\\s+${kind}=["']${key.replace(":", "\\:")}["'][^>]*>`, "i");
  const tag = metaTag(kind, key, value);
  return re.test(html) ? html.replace(re, tag) : html.replace(/<\/head>/i, `${tag}</head>`);
}

function imageCandidates(html) {
  return [...html.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1])
    .filter((src) => {
      const p = pathname(src);
      return p && !GENERIC_IMAGES.has(p) && !p.startsWith("/api/qr") && !p.includes("/chat-icons/") && !p.endsWith(".svg");
    });
}

function chooseImage(html, canonical) {
  const page = new URL(canonical || SITE);
  if (page.pathname === "/" || /^\/(?:en|zh-tw|zh-cn|ko|th|id)\/?$/.test(page.pathname)) return FALLBACK;
  const sticker = page.pathname.match(/(?:^|\/)stickers\/(\d+)\/?$/);
  if (sticker) return absolute(`/images/stickers/${sticker[1]}.png`) || FALLBACK;

  const existing = attr(html, /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["'][^>]*>/i);
  const existingPath = pathname(existing);
  if (existing && existingPath !== "/images/biglogo.png" && existingPath !== "/ogp/stamp-moke-ogp.png") return absolute(existing);

  const first = imageCandidates(html).find((candidate) => candidate.startsWith("/api/free-preview") || candidate.startsWith("/") || candidate.startsWith("http"));
  return first ? absolute(first) : FALLBACK;
}

function routeFromFile(file) {
  const rel = path.relative(DIST, file).replaceAll(path.sep, "/");
  return `/${rel.replace(/index\.html$/, "")}`.replace(/\/{2,}/g, "/");
}

async function processFile(file) {
  let html = await fs.readFile(file, "utf8");
  const canonical = attr(html, /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["'][^>]*>/i) || `${SITE}${routeFromFile(file)}`;
  const title = clean(attr(html, /<title>([\s\S]*?)<\/title>/i)) || "stamp moke";
  const description = clean(attr(html, /<meta\s+name=["']description["']\s+content=["']([^"']*)["'][^>]*>/i)) || "毎日に、ちょっとしたかわいいを。LINEスタンプ、グッズ、無料フリー素材、便利ツールを展開するstamp moke。";
  const image = chooseImage(html, canonical);
  const pagePath = new URL(canonical).pathname;
  const type = /(?:^|\/)stickers\/\d+\/?$|(?:^|\/)goods\/\d+\/?$|(?:^|\/)news\/[^/]+\/?$/.test(pagePath) ? "article" : "website";

  for (const key of ["description", "twitter:card", "twitter:title", "twitter:description", "twitter:image", "twitter:image:alt"]) html = removeMeta(html, "name", key);
  for (const key of ["og:title", "og:description", "og:type", "og:url", "og:site_name", "og:image", "og:image:secure_url", "og:image:alt"]) html = removeMeta(html, "property", key);
  html = setMeta(html, "name", "description", description);
  html = setMeta(html, "property", "og:title", title);
  html = setMeta(html, "property", "og:description", description);
  html = setMeta(html, "property", "og:type", type);
  html = setMeta(html, "property", "og:url", canonical);
  html = setMeta(html, "property", "og:site_name", "stamp moke");
  html = setMeta(html, "property", "og:image", image);
  html = setMeta(html, "property", "og:image:secure_url", image);
  html = setMeta(html, "property", "og:image:alt", title);
  html = setMeta(html, "name", "twitter:card", "summary_large_image");
  html = setMeta(html, "name", "twitter:title", title);
  html = setMeta(html, "name", "twitter:description", description);
  html = setMeta(html, "name", "twitter:image", image);
  html = setMeta(html, "name", "twitter:image:alt", title);
  await fs.writeFile(file, html);
  return { route: pagePath, image };
}

const files = await walk(DIST);
const results = [];
for (const file of files) results.push(await processFile(file));
console.log(`[ogp] normalized ${results.length} generated HTML pages`);
console.log(`[ogp] fallback: ${FALLBACK}`);
