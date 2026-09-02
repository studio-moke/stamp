import crypto from "node:crypto";
import { presignR2Put, r2Configured, r2Delete, r2GetBuffer, r2GetJson, r2Key, r2ListKeys, r2PutJson } from "./_r2.js";

const SITE_URL = "https://stamp-moke.jp";
const INDEX_KEY = "free-assets/index.json";
const DOWNLOADS_PER_DAY = 30;
const DOWNLOADS_PER_HOUR_PER_RUNTIME = 60;
const runtimeRate = new Map();
const LOCALES = ["ja", "en", "zh-tw", "th", "id"];
const MASTER = {
  platforms: ["pokekara", "x", "instagram", "facebook", "line", "youtube", "other"],
  types: ["icon", "header", "background", "story", "wallpaper", "thumbnail", "frame", "decoration"],
  motifs: ["cat", "dog", "bird", "food", "human", "text", "other"],
  styles: ["cute", "simple", "handdrawn", "funny", "cool", "retro", "minimal"],
};

function json(res, status, payload) { res.status(status).json(payload); }
function isAdmin(req) { const expected = process.env.FREE_ADMIN_TOKEN; return Boolean(expected && req.headers["x-admin-token"] === expected); }
function slugify(value = "") { return String(value).normalize("NFKC").toLowerCase().trim().replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90) || `asset-${Date.now()}`; }
function safeArray(values, allowed) { return [...new Set((Array.isArray(values) ? values : []).filter((v) => allowed.includes(v)))]; }
function cleanStringArray(values, maxItems = 8, maxLength = 40) { return [...new Set((Array.isArray(values) ? values : []).map(v => String(v || "").normalize("NFKC").trim().replace(/\s+/g, " ").slice(0, maxLength)).filter(Boolean))].slice(0, maxItems); }
function cleanHash(value = "") { const v = String(value).toLowerCase().replace(/[^a-f0-9]/g, ""); return v.length === 64 ? v : ""; }
function extFor(contentType = "") { if (/webp/i.test(contentType)) return ".webp"; if (/jpe?g/i.test(contentType)) return ".jpg"; return ".png"; }
function publicCode() { return crypto.randomBytes(6).toString("hex"); }
function hashKey(hash) { return `free-assets/hashes/${hash}.json`; }
function metaKey(slug) { return `free-assets/meta/${slug}.json`; }

async function readIndex() { const value = await r2GetJson(INDEX_KEY, []); return Array.isArray(value) ? value : []; }
async function writeIndex(list) { return r2PutJson(INDEX_KEY, list.slice(0, 5000)); }
async function listAssets(limit = 250) { const index = await readIndex(); return index.filter(x => x?.status === "published").sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt))).slice(0, Math.min(Math.max(limit, 1), 5000)); }
async function findBySlug(slug) { return r2GetJson(metaKey(slug), null); }
async function persistRecord(record) {
  await r2PutJson(metaKey(record.slug), record);
  const index = await readIndex();
  const next = record.status === "published" ? [record, ...index.filter(x => x?.slug !== record.slug)] : index.filter(x => x?.slug !== record.slug);
  await writeIndex(next);
}

async function listAdminAssets(limit = 5000) {
  const keys = await r2ListKeys("free-assets/meta/", Math.min(Math.max(limit, 1), 5000));
  const records = [];
  for (let i = 0; i < keys.length; i += 25) {
    const batch = await Promise.all(keys.slice(i, i + 25).map(key => r2GetJson(key, null).catch(() => null)));
    records.push(...batch.filter(Boolean));
  }
  return records.sort((a, b) => String(b.updatedAt || b.publishedAt || "").localeCompare(String(a.updatedAt || a.publishedAt || "")));
}

function normalizeLocales(locales = {}) {
  return Object.fromEntries(LOCALES.map(locale => {
    const v = locales?.[locale] || {};
    return [locale, {
      title: String(v.title || "").slice(0, 120), description: String(v.description || "").slice(0, 700), seoTitle: String(v.seoTitle || "").slice(0, 160),
      metaDescription: String(v.metaDescription || "").slice(0, 320), alt: String(v.alt || "").slice(0, 180),
      keywords: [...new Set((Array.isArray(v.keywords) ? v.keywords : []).map(String).map(x => x.trim()).filter(Boolean))].slice(0, 30),
    }];
  }));
}
function normalizeMetadata(raw, fallback = {}) {
  const locales = normalizeLocales(raw?.locales || fallback.locales || {});
  const jaTitle = locales.ja.title || fallback.filename?.replace(/\.[^.]+$/, "") || "無料素材";
  return {
    slug: slugify(raw?.slug || fallback.slug || jaTitle), platforms: safeArray(raw?.platforms ?? fallback.platforms, MASTER.platforms),
    types: safeArray(raw?.types ?? fallback.types, MASTER.types), motifs: safeArray(raw?.motifs ?? fallback.motifs, MASTER.motifs),
    styles: safeArray(raw?.styles ?? fallback.styles, MASTER.styles), character: String(raw?.character ?? fallback.characterHint ?? fallback.character ?? "").slice(0, 60),
    useCategories: cleanStringArray(raw?.useCategories ?? fallback.useCategories, 4, 32),
    usageIntent: String(raw?.usageIntent ?? fallback.usageHint ?? fallback.usageIntent ?? "").normalize("NFKC").trim().slice(0, 400),
    transparent: Boolean(raw?.transparent ?? fallback.transparent), locales,
  };
}

function cookieSecret() { return process.env.FREE_DOWNLOAD_SECRET || process.env.FREE_ADMIN_TOKEN || ""; }
function sign(value) { return crypto.createHmac("sha256", cookieSecret()).update(value).digest("base64url"); }
function parseCookies(header = "") { return Object.fromEntries(header.split(";").map(part => part.trim()).filter(Boolean).map(part => { const i = part.indexOf("="); return [part.slice(0, i), decodeURIComponent(part.slice(i + 1))]; })); }
function getDownloadState(req) {
  const today = new Date().toISOString().slice(0, 10); const raw = parseCookies(req.headers.cookie || "").sm_free_dl;
  if (!raw || !cookieSecret()) return { day: today, count: 0 }; const i = raw.lastIndexOf("."); if (i < 0) return { day: today, count: 0 };
  const payload = raw.slice(0, i), sig = raw.slice(i + 1); if (sign(payload) !== sig) return { day: today, count: 0 };
  try { const state = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")); return state.day === today ? state : { day: today, count: 0 }; } catch { return { day: today, count: 0 }; }
}
function setDownloadState(res, state) { if (!cookieSecret()) return; const payload = Buffer.from(JSON.stringify(state), "utf8").toString("base64url"); res.setHeader("Set-Cookie", `sm_free_dl=${payload}.${sign(payload)}; Path=/; Max-Age=86400; Secure; HttpOnly; SameSite=Lax`); }
function runtimeRateAllowed(req) { const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim(); const hour = new Date().toISOString().slice(0, 13); const key = `${ip}:${hour}`; const next = (runtimeRate.get(key) || 0) + 1; runtimeRate.set(key, next); if (runtimeRate.size > 2000) runtimeRate.clear(); return next <= DOWNLOADS_PER_HOUR_PER_RUNTIME; }

function safeAssetObjectKey(key, folder) {
  const value = String(key || "");
  return value.startsWith(`free-assets/${folder}/`) ? value : "";
}
function keyUsedByAnother(records, currentSlug, key) {
  return records.some(record => record?.slug !== currentSlug && [record?.originalKey, record?.previewKey, record?.thumbKey].includes(key));
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const action = String(req.query.action || "list");
      if (action === "list") { const assets = await listAssets(Number(req.query.limit || 500)); res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600"); return json(res, 200, { assets }); }
      if (action === "detail") { const asset = await findBySlug(slugify(req.query.slug || "")); if (!asset || asset.status !== "published") return json(res, 404, { error: "Not found" }); return json(res, 200, { asset }); }
      if (action === "download") {
        if (String(req.query.agree || "") !== "1") return json(res, 400, { error: "Terms agreement required" });
        if (!runtimeRateAllowed(req)) return json(res, 429, { error: "Too many downloads. Please try again later." });
        const state = getDownloadState(req); if (state.count >= DOWNLOADS_PER_DAY) return json(res, 429, { error: `Daily download limit (${DOWNLOADS_PER_DAY}) reached.` });
        const asset = await findBySlug(slugify(req.query.slug || "")); if (!asset || asset.status !== "published") return json(res, 404, { error: "Not found" });
        const file = await r2GetBuffer(asset.originalKey); if (!file) return json(res, 404, { error: "Original file not found" });
        setDownloadState(res, { day: state.day, count: state.count + 1 }); const updated = { ...asset, downloads: Number(asset.downloads || 0) + 1, updatedAt: new Date().toISOString() }; await persistRecord(updated).catch(error => console.error("download count update failed", error));
        const filename = `stamp-moke-${asset.publicCode || String(asset.id || "").replace(/-/g, "").slice(0, 12) || publicCode()}${extFor(asset.contentType || file.contentType)}`;
        res.setHeader("Cache-Control", "private, no-store"); res.setHeader("Content-Type", asset.contentType || file.contentType); res.setHeader("X-Content-Type-Options", "nosniff"); res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`); res.end(file.buffer); return;
      }
      return json(res, 400, { error: "Unknown action" });
    }

    if (req.method === "POST") {
      if (!isAdmin(req)) return json(res, 401, { error: "管理トークンが一致しません。FREE_ADMIN_TOKEN を確認してください。" });
      const action = String(req.query.action || req.body?.action || "");
      if (action === "health") { const checks = { adminToken: true, ...r2Configured() }; const missing = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name); if (missing.length) return json(res, 500, { error: `環境設定不足: ${missing.join(", ")}`, checks }); return json(res, 200, { ok: true, checks, storage: "cloudflare-r2" }); }
      if (action === "duplicate") { const hash = cleanHash(req.body?.contentHash || ""); if (!hash) return json(res, 400, { error: "Invalid content hash" }); const existing = await r2GetJson(hashKey(hash), null); return json(res, 200, { duplicate: Boolean(existing), asset: existing || null }); }
      if (action === "upload-url") { const role = String(req.body?.role || ""); if (!["preview", "thumb", "original"].includes(role)) return json(res, 400, { error: "Invalid role" }); const ext = extFor(req.body?.contentType || ""); const anonymous = `asset-${crypto.randomUUID()}${role === "thumb" ? ".webp" : ext}`; const folder = role === "preview" ? "previews" : role === "thumb" ? "thumbs" : "originals"; const key = r2Key(`free-assets/${folder}`, anonymous); return json(res, 200, { key, uploadUrl: presignR2Put(key, 900) }); }
      if (action === "analyze") return json(res, 410, { error: "フリー素材のAI解析はCloudflare Workerへ移行しました。管理画面を再読み込みしてください。" });
      if (action === "admin-list") return json(res, 200, { assets: await listAdminAssets(5000) });
      if (action === "admin-preview") {
        const asset = await findBySlug(slugify(req.body?.slug || "")); if (!asset) return json(res, 404, { error: "Not found" });
        const variant = String(req.body?.variant || "thumb"); const key = variant === "thumb" && asset.thumbKey ? asset.thumbKey : asset.previewKey;
        if (!key) return json(res, 404, { error: "Preview not found" }); const image = await r2GetBuffer(key); if (!image) return json(res, 404, { error: "Preview not found" });
        res.setHeader("Content-Type", image.contentType || "image/png"); res.setHeader("Cache-Control", "private, no-store"); res.setHeader("X-Content-Type-Options", "nosniff"); res.status(200).end(image.buffer); return;
      }
      if (action === "publish") {
        const body = req.body || {}; const meta = normalizeMetadata(body.metadata || {}, body); if (!body.originalKey || !body.previewKey) return json(res, 400, { error: "originalKey and previewKey are required" });
        const now = new Date().toISOString(), id = body.id || crypto.randomUUID(), code = body.publicCode || publicCode(), hash = cleanHash(body.contentHash || "");
        if (hash) {
          const existingHash = await r2GetJson(hashKey(hash), null);
          if (existingHash && existingHash.slug !== meta.slug && existingHash.id !== id) return json(res, 409, { error: "同じ元画像はすでに登録されています。", duplicate: true, asset: existingHash });
        }
        const record = { ...meta, id, publicCode: code, originalKey: body.originalKey, previewKey: body.previewKey, thumbKey: body.thumbKey || "", contentHash: hash, width: Number(body.width || 0), height: Number(body.height || 0), contentType: body.contentType || "image/png", license: "personal-noncommercial", copyright: "© stamp-moke.jp", downloads: Number(body.downloads || 0), status: "published", publishedAt: body.publishedAt || now, updatedAt: now, canonicalUrl: `${SITE_URL}/free/${encodeURIComponent(meta.slug)}` };
        await persistRecord(record); if (hash) await r2PutJson(hashKey(hash), { slug: record.slug, id: record.id, title: record.locales?.ja?.title || "" }); return json(res, 200, { asset: record });
      }
      if (action === "attach-thumb") { const slug = slugify(req.body?.slug || ""); const thumbKey = String(req.body?.thumbKey || ""); if (!thumbKey.startsWith("free-assets/thumbs/")) return json(res, 400, { error: "Invalid thumbKey" }); const current = await findBySlug(slug); if (!current) return json(res, 404, { error: "Not found" }); const updated = { ...current, thumbKey, updatedAt: new Date().toISOString() }; await persistRecord(updated); return json(res, 200, { asset: updated }); }
      if (action === "update") {
        const slug = slugify(req.body?.slug || ""); const current = await findBySlug(slug); if (!current) return json(res, 404, { error: "Not found" });
        const patch = req.body?.patch || {}, locales = normalizeLocales({ ...current.locales, ...(patch.locales || {}) });
        const status = patch.status === "published" ? "published" : patch.status === "unpublished" ? "unpublished" : current.status;
        const updated = { ...current, platforms: safeArray(patch.platforms ?? current.platforms, MASTER.platforms), types: safeArray(patch.types ?? current.types, MASTER.types), motifs: safeArray(patch.motifs ?? current.motifs, MASTER.motifs), styles: safeArray(patch.styles ?? current.styles, MASTER.styles), character: String(patch.character ?? current.character ?? "").slice(0, 60), useCategories: cleanStringArray(patch.useCategories ?? current.useCategories, 4, 32), usageIntent: String(patch.usageIntent ?? current.usageIntent ?? "").normalize("NFKC").trim().slice(0, 400), locales, status, updatedAt: new Date().toISOString() };
        await persistRecord(updated); return json(res, 200, { asset: updated });
      }
      if (action === "delete" || action === "unpublish") { const slug = slugify(req.body?.slug || ""); const current = await findBySlug(slug); if (!current) return json(res, 404, { error: "Not found" }); const updated = { ...current, status: "unpublished", updatedAt: new Date().toISOString() }; await persistRecord(updated); return json(res, 200, { ok: true, asset: updated }); }
      if (action === "hard-delete") {
        const slug = slugify(req.body?.slug || ""); const current = await findBySlug(slug); if (!current) return json(res, 404, { error: "Not found" });
        await persistRecord({ ...current, status: "unpublished", updatedAt: new Date().toISOString() });
        const all = await listAdminAssets(5000); const deleted = [], skippedShared = [];
        for (const [field, folder] of [["originalKey", "originals"], ["previewKey", "previews"], ["thumbKey", "thumbs"]]) {
          const key = safeAssetObjectKey(current[field], folder); if (!key) continue;
          if (keyUsedByAnother(all, slug, key)) { skippedShared.push(key); continue; }
          await r2Delete(key); deleted.push(key);
        }
        const hash = cleanHash(current.contentHash || "");
        if (hash) {
          const hKey = hashKey(hash); const hashRecord = await r2GetJson(hKey, null);
          if (!hashRecord || hashRecord.slug === slug || hashRecord.id === current.id) { await r2Delete(hKey); deleted.push(hKey); }
        }
        const mKey = metaKey(slug); await r2Delete(mKey); deleted.push(mKey);
        const index = await readIndex(); await writeIndex(index.filter(item => item?.slug !== slug));
        return json(res, 200, { ok: true, deleted, skippedShared });
      }
      return json(res, 400, { error: "Unknown action" });
    }
    return json(res, 405, { error: "Method not allowed" });
  } catch (error) {
    console.error("free-assets error", error);
    return json(res, 500, { error: error instanceof Error ? error.message : String(error) });
  }
}
