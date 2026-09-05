import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("dist");
const SITE = "https://stamp-moke.jp";
const OUT = path.join(ROOT, "sitemap-pages.xml");
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

function excluded(file) {
  const relative = path.relative(ROOT, file).split(path.sep).filter(Boolean);
  return relative.some((segment) => EXCLUDED_SEGMENTS.has(segment));
}

function fallbackUrl(file) {
  const relative = path.relative(ROOT, file).replaceAll(path.sep, "/");
  if (relative === "index.html") return `${SITE}/`;
  if (relative.endsWith("/index.html")) return `${SITE}/${relative.slice(0, -"index.html".length)}`;
  return null;
}

function canonicalFromHtml(html, file) {
  const noindex = /<meta\s+name=["'](?:robots|googlebot)["'][^>]*content=["'][^"']*noindex/i.test(html);
  if (noindex) return null;
  const match = html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)
    || html.match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i);
  const value = match?.[1] || fallbackUrl(file);
  if (!value) return null;
  let url;
  try { url = new URL(value, SITE); } catch { return null; }
  if (url.hostname !== "stamp-moke.jp") return null;
  url.hash = "";
  url.search = "";
  if (!url.pathname.endsWith("/") && !/\/[^/]+\.[a-z0-9]+$/i.test(url.pathname)) url.pathname += "/";
  return url.toString();
}

try {
  const urls = new Set();
  for (const file of await listFiles(ROOT)) {
    if (!file.endsWith(".html") || excluded(file)) continue;
    const html = await fs.readFile(file, "utf8");
    const canonical = canonicalFromHtml(html, file);
    if (canonical) urls.add(canonical);
  }

  const ordered = [...urls].sort((a, b) => {
    if (a === `${SITE}/`) return -1;
    if (b === `${SITE}/`) return 1;
    return a.localeCompare(b, "en");
  });

  const body = ordered.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  await fs.writeFile(OUT, xml);
  console.log(`[sitemap] generated ${ordered.length} indexable public URLs`);
  if (!urls.has(`${SITE}/`)) throw new Error("Homepage missing from generated sitemap");
} catch (error) {
  if (error?.code === "ENOENT") console.log("[sitemap] dist not found; skipped");
  else throw error;
}
