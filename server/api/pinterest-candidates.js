import { r2GetJson, r2PutJson } from "./_r2.js";

const SITE_URL = "https://stamp-moke.jp";
const INDEX_KEY = "free-assets/index.json";
const STATUS_KEY = "pinterest/free-background-status.json";
const EXCLUDED_SOURCE_KINDS = new Set(["auto-generated", "external", "imported", "third-party"]);

function json(res, status, payload) { res.status(status).json(payload); }
function isAdmin(req) {
  const expected = process.env.FREE_ADMIN_TOKEN;
  return Boolean(expected && req.headers["x-admin-token"] === expected);
}
function slugify(value = "") {
  return String(value).normalize("NFKC").toLowerCase().trim()
    .replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "").slice(0, 90);
}
function cleanText(value = "", max = 500) {
  return String(value).normalize("NFKC").replace(/\s+/g, " ").trim().slice(0, max);
}
function eligible(asset) {
  if (!asset || asset.status !== "published") return false;
  if (!Array.isArray(asset.types) || !asset.types.includes("background")) return false;
  const kind = String(asset.source?.kind || "").toLowerCase();
  if (EXCLUDED_SOURCE_KINDS.has(kind)) return false;
  return true;
}
function candidateFor(asset, state = {}) {
  const slug = slugify(asset.slug || "");
  const ja = asset.locales?.ja || {};
  const baseTitle = cleanText(ja.title || "stamp moke オリジナル背景素材", 80);
  const title = /無料|フリー/.test(baseTitle) ? baseTitle : `${baseTitle}｜無料背景素材`;
  const fallback = "stamp mokeのオリジナル背景素材です。SNS、ブログ、資料、デザイン制作などにご利用いただけます。利用条件と高画質版は素材ページでご確認ください。";
  return {
    slug,
    title: title.slice(0, 100),
    description: cleanText(ja.description || fallback, 500),
    imageUrl: `${SITE_URL}/api/free?route=preview&slug=${encodeURIComponent(slug)}`,
    destinationUrl: asset.canonicalUrl || `${SITE_URL}/free/${encodeURIComponent(slug)}`,
    publishedAt: asset.publishedAt || "",
    sourceKind: asset.source?.kind || "admin-selected",
    status: state.status || "ready",
    postedAt: state.postedAt || null,
    excludedAt: state.excludedAt || null
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (!isAdmin(req)) return json(res, 401, { error: "管理トークンが一致しません。" });
  try {
    if (req.method === "GET") {
      const index = await r2GetJson(INDEX_KEY, []);
      const states = await r2GetJson(STATUS_KEY, {});
      const candidates = (Array.isArray(index) ? index : [])
        .filter(eligible)
        .map(asset => candidateFor(asset, states?.[asset.slug] || {}))
        .sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));
      return json(res, 200, {
        candidates,
        policy: {
          scope: "stamp-moke original background free materials only",
          autoPost: false,
          excludedSourceKinds: [...EXCLUDED_SOURCE_KINDS]
        }
      });
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const slug = slugify(body.slug || "");
      const action = String(body.action || "");
      if (!slug || !["posted", "exclude", "reset"].includes(action)) {
        return json(res, 400, { error: "slug and a valid action are required" });
      }
      const states = await r2GetJson(STATUS_KEY, {});
      const next = { ...(states || {}) };
      if (action === "reset") delete next[slug];
      else if (action === "posted") next[slug] = { status: "posted", postedAt: new Date().toISOString(), excludedAt: null };
      else next[slug] = { status: "excluded", excludedAt: new Date().toISOString(), postedAt: null };
      await r2PutJson(STATUS_KEY, next);
      return json(res, 200, { ok: true, slug, state: next[slug] || { status: "ready" } });
    }

    return json(res, 405, { error: "Method not allowed" });
  } catch (error) {
    console.error("pinterest-candidates error", error);
    return json(res, 500, { error: error instanceof Error ? error.message : String(error) });
  }
}
