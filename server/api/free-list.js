import { r2GetJson } from "./_r2.js";

const INDEX_KEY = "free-assets/index.json";
const LOCALES = ["ja", "en", "zh-tw", "th", "id"];
const GROUPS = ["platforms", "types", "motifs", "styles"];

function cleanLocale(value) {
  return LOCALES.includes(String(value || "")) ? String(value) : "ja";
}
function cleanText(value = "") {
  return String(value).normalize("NFKC").toLowerCase().trim();
}
function compactAsset(a, locale) {
  const local = a.locales?.[locale] || a.locales?.ja || {};
  const ja = a.locales?.ja || {};
  return {
    slug: a.slug,
    platforms: a.platforms || [],
    types: a.types || [],
    motifs: a.motifs || [],
    styles: a.styles || [],
    downloads: Number(a.downloads || 0),
    publishedAt: a.publishedAt || "",
    locales: {
      [locale]: {
        title: local.title || "",
        description: local.description || "",
        alt: local.alt || "",
        keywords: Array.isArray(local.keywords) ? local.keywords.slice(0, 20) : []
      },
      ...(locale === "ja" ? {} : { ja: {
        title: ja.title || "",
        description: ja.description || "",
        alt: ja.alt || "",
        keywords: Array.isArray(ja.keywords) ? ja.keywords.slice(0, 20) : []
      }})
    }
  };
}
function matches(a, locale, q, platform, category, style) {
  if (platform && !(a.platforms || []).includes(platform)) return false;
  if (category && !(a.types || []).includes(category) && !(a.motifs || []).includes(category)) return false;
  if (style && !(a.styles || []).includes(style)) return false;
  if (!q) return true;
  const l = a.locales?.[locale] || a.locales?.ja || {};
  const hay = cleanText([
    l.title, l.description, l.alt, ...(l.keywords || []),
    ...(a.platforms || []), ...(a.types || []), ...(a.motifs || []), ...(a.styles || [])
  ].join(" "));
  return hay.includes(q);
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const locale = cleanLocale(req.query.locale);
    const limit = Math.min(Math.max(Number(req.query.limit || 24), 1), 60);
    const offset = Math.max(Number(req.query.offset || 0), 0);
    const q = cleanText(req.query.q || "");
    const platform = cleanText(req.query.platform || "");
    const category = cleanText(req.query.category || "");
    const style = cleanText(req.query.style || "");
    const sort = String(req.query.sort || "new") === "popular" ? "popular" : "new";
    const raw = await r2GetJson(INDEX_KEY, []);
    const published = (Array.isArray(raw) ? raw : []).filter((a) => a?.status === "published");
    const facets = Object.fromEntries(GROUPS.map((group) => [group, [...new Set(published.flatMap((a) => a[group] || []))].sort()]));
    const filtered = published.filter((a) => matches(a, locale, q, platform, category, style));
    filtered.sort(sort === "popular"
      ? (a, b) => Number(b.downloads || 0) - Number(a.downloads || 0) || String(b.publishedAt || "").localeCompare(String(a.publishedAt || ""))
      : (a, b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")));
    const rows = filtered.slice(offset, offset + limit).map((a) => compactAsset(a, locale));
    const nextOffset = offset + rows.length;
    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=900");
    return res.status(200).json({
      assets: rows,
      total: filtered.length,
      nextOffset,
      hasMore: nextOffset < filtered.length,
      facets
    });
  } catch (error) {
    console.error("free-list failed", error);
    return res.status(500).json({ error: "Failed to load free assets" });
  }
}
