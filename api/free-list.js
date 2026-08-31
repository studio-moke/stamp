import { r2GetJson } from "./_r2.js";

const INDEX_KEY = "free-assets/index.json";
const LOCALES = ["ja", "en", "zh-tw", "th", "id"];

function cleanLocale(value) {
  return LOCALES.includes(String(value || "")) ? String(value) : "ja";
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const locale = cleanLocale(req.query.locale);
    const limit = Math.min(Math.max(Number(req.query.limit || 500), 1), 1000);
    const raw = await r2GetJson(INDEX_KEY, []);
    const rows = (Array.isArray(raw) ? raw : [])
      .filter((a) => a?.status === "published")
      .sort((a, b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")))
      .slice(0, limit)
      .map((a) => {
        const local = a.locales?.[locale] || a.locales?.ja || {};
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
              title: a.locales?.ja?.title || "",
              description: a.locales?.ja?.description || "",
              alt: a.locales?.ja?.alt || "",
              keywords: Array.isArray(a.locales?.ja?.keywords) ? a.locales.ja.keywords.slice(0, 20) : []
            }})
          }
        };
      });
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=1800");
    return res.status(200).json({ assets: rows });
  } catch (error) {
    console.error("free-list failed", error);
    return res.status(500).json({ error: "Failed to load free assets" });
  }
}
