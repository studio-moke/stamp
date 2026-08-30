import crypto from "node:crypto";
import { get, list, put } from "@vercel/blob";

const SITE_URL = "https://stamp-moke.jp";
const DOWNLOADS_PER_DAY = 30;
const DOWNLOADS_PER_HOUR_PER_RUNTIME = 60;
const runtimeRate = new Map();

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

async function readBlobJson(url) { const result = await get(url, { access: "private" }); if (!result) return null; return result.json(); }
async function findBySlug(slug) { const prefix = `free-assets/meta/${slug}.json`; const found = await list({ prefix, limit: 10 }); const exact = found.blobs.find((b) => b.pathname === prefix); return exact ? readBlobJson(exact.url) : null; }
async function listAssets(limit = 100) { const found = await list({ prefix: "free-assets/meta/", limit: Math.min(Math.max(limit, 1), 250) }); const records = await Promise.all(found.blobs.map((blob) => readBlobJson(blob.url).catch(() => null))); return records.filter(Boolean).filter((item) => item.status === "published").sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt))); }
function stripJsonFence(value = "") { return value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, ""); }

async function privateBlobToDataUrl(url, fallbackType = "image/png") {
  const result = await get(url, { access: "private" });
  if (!result) throw new Error("AI解析用プレビューが見つかりません");
  const chunks = [];
  const reader = result.stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(Buffer.from(value));
  }
  const buffer = Buffer.concat(chunks);
  const contentType = result.contentType || fallbackType;
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

async function analyzeWithOpenAI(input) {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
  if (!input.previewUrl) throw new Error("previewUrl is required");

  const instruction = `You create SEO metadata for stamp-moke.jp free illustration assets.\nUse only these controlled vocabularies:\nplatforms=${MASTER.platforms.join(",")}\ntypes=${MASTER.types.join(",")}\nmotifs=${MASTER.motifs.join(",")}\nstyles=${MASTER.styles.join(",")}\n\nUsage policy: personal/non-commercial use only. Good uses include Pokekara and social media profiles/posts, personal flyers, school/circle/non-commercial print. Commercial use, resale, redistribution and claiming authorship are prohibited. Copyright belongs to stamp-moke.jp.\n\nReturn JSON only with this shape:\n{\n  \"slug\": \"ascii-or-japanese-safe-slug\",\n  \"platforms\": [],\n  \"types\": [],\n  \"motifs\": [],\n  \"styles\": [],\n  \"character\": \"short-name-or-empty\",\n  \"transparent\": true,\n  \"locales\": {\n    \"ja\": {\"title\":\"\",\"description\":\"\",\"seoTitle\":\"\",\"metaDescription\":\"\",\"alt\":\"\",\"keywords\":[]},\n    \"en\": {\"title\":\"\",\"description\":\"\",\"seoTitle\":\"\",\"metaDescription\":\"\",\"alt\":\"\",\"keywords\":[]},\n    \"zh-tw\": {\"title\":\"\",\"description\":\"\",\"seoTitle\":\"\",\"metaDescription\":\"\",\"alt\":\"\",\"keywords\":[]},\n    \"th\": {\"title\":\"\",\"description\":\"\",\"seoTitle\":\"\",\"metaDescription\":\"\",\"alt\":\"\",\"keywords\":[]},\n    \"id\": {\"title\":\"\",\"description\":\"\",\"seoTitle\":\"\",\"metaDescription\":\"\",\"alt\":\"\",\"keywords\":[]}\n  }\n}\nDescriptions should accurately describe only what is visible. Do not invent a character name. SEO copy must be natural, not keyword stuffing.`;

  const imageDataUrl = await privateBlobToDataUrl(input.previewUrl);
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.FREE_ASSET_AI_MODEL || "gpt-5.6-luna",
      input: [{ role: "user", content: [
        { type: "input_text", text: `${instruction}\n\nFilename: ${input.filename || "unknown"}\nSize: ${input.width || "?"}x${input.height || "?"}\nCommon platform hint: ${input.platformHint || "none"}\nCommon character hint: ${input.characterHint || "none"}` },
        { type: "input_image", image_url: imageDataUrl },
      ] }],
    }),
  });
  if (!response.ok) throw new Error(`OpenAI ${response.status}: ${await response.text()}`);
  const data = await response.json();
  const text = data.output_text || data.output?.flatMap((o) => o.content || []).find((c) => c.type === "output_text")?.text;
  if (!text) throw new Error("AI returned no metadata");
  return JSON.parse(stripJsonFence(text));
}

function normalizeMetadata(raw, fallback = {}) {
  const jaTitle = raw?.locales?.ja?.title || fallback.filename?.replace(/\.[^.]+$/, "") || "無料素材";
  return {
    slug: slugify(raw?.slug || jaTitle),
    platforms: safeArray(raw?.platforms, MASTER.platforms),
    types: safeArray(raw?.types, MASTER.types),
    motifs: safeArray(raw?.motifs, MASTER.motifs),
    styles: safeArray(raw?.styles, MASTER.styles),
    character: String(raw?.character || fallback.characterHint || "").slice(0, 60),
    transparent: Boolean(raw?.transparent ?? fallback.transparent),
    locales: raw?.locales || {},
  };
}

function cookieSecret() { return process.env.FREE_DOWNLOAD_SECRET || process.env.FREE_ADMIN_TOKEN || ""; }
function sign(value) { return crypto.createHmac("sha256", cookieSecret()).update(value).digest("base64url"); }
function parseCookies(header = "") { return Object.fromEntries(header.split(";").map((part) => part.trim()).filter(Boolean).map((part) => { const i = part.indexOf("="); return [part.slice(0, i), decodeURIComponent(part.slice(i + 1))]; })); }
function getDownloadState(req) { const today = new Date().toISOString().slice(0, 10); const raw = parseCookies(req.headers.cookie || "").sm_free_dl; if (!raw || !cookieSecret()) return { day: today, count: 0 }; const i = raw.lastIndexOf("."); if (i < 0) return { day: today, count: 0 }; const payload = raw.slice(0, i); const sig = raw.slice(i + 1); if (sign(payload) !== sig) return { day: today, count: 0 }; try { const state = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")); return state.day === today ? state : { day: today, count: 0 }; } catch { return { day: today, count: 0 }; } }
function setDownloadState(res, state) { if (!cookieSecret()) return; const payload = Buffer.from(JSON.stringify(state), "utf8").toString("base64url"); res.setHeader("Set-Cookie", `sm_free_dl=${payload}.${sign(payload)}; Path=/; Max-Age=86400; Secure; HttpOnly; SameSite=Lax`); }
function runtimeRateAllowed(req) { const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim(); const hour = new Date().toISOString().slice(0, 13); const key = `${ip}:${hour}`; const next = (runtimeRate.get(key) || 0) + 1; runtimeRate.set(key, next); if (runtimeRate.size > 2000) runtimeRate.clear(); return next <= DOWNLOADS_PER_HOUR_PER_RUNTIME; }

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const action = String(req.query.action || "list");
      if (action === "list") { const assets = await listAssets(Number(req.query.limit || 100)); res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600"); return json(res, 200, { assets }); }
      if (action === "detail") { const asset = await findBySlug(slugify(req.query.slug || "")); if (!asset || asset.status !== "published") return json(res, 404, { error: "Not found" }); res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=900"); return json(res, 200, { asset }); }
      if (action === "download") {
        if (String(req.query.agree || "") !== "1") return json(res, 400, { error: "Terms agreement required" });
        if (!runtimeRateAllowed(req)) return json(res, 429, { error: "Too many downloads. Please try again later." });
        const state = getDownloadState(req); if (state.count >= DOWNLOADS_PER_DAY) return json(res, 429, { error: `Daily download limit (${DOWNLOADS_PER_DAY}) reached.` });
        const asset = await findBySlug(slugify(req.query.slug || "")); if (!asset || asset.status !== "published") return json(res, 404, { error: "Not found" });
        const file = await get(asset.originalUrl, { access: "private" }); if (!file) return json(res, 404, { error: "Original file not found" });
        setDownloadState(res, { day: state.day, count: state.count + 1 });
        res.setHeader("Cache-Control", "private, no-store"); res.setHeader("Content-Type", asset.contentType || "application/octet-stream"); res.setHeader("X-Content-Type-Options", "nosniff"); res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(asset.downloadName || `${asset.slug}.png`)}`);
        const reader = file.stream.getReader(); while (true) { const { done, value } = await reader.read(); if (done) break; res.write(Buffer.from(value)); } res.end(); return;
      }
      return json(res, 400, { error: "Unknown action" });
    }

    if (req.method === "POST") {
      if (!isAdmin(req)) return json(res, 401, { error: "Unauthorized" });
      const action = String(req.query.action || req.body?.action || "");
      if (action === "analyze") { const ai = await analyzeWithOpenAI(req.body || {}); return json(res, 200, { metadata: normalizeMetadata(ai, req.body || {}) }); }
      if (action === "publish") {
        const body = req.body || {}; const meta = normalizeMetadata(body.metadata || {}, body); if (!body.originalUrl || !body.previewUrl) return json(res, 400, { error: "originalUrl and previewUrl are required" });
        const now = new Date().toISOString();
        const record = { ...meta, id: body.id || crypto.randomUUID(), originalUrl: body.originalUrl, previewUrl: body.previewUrl, width: Number(body.width || 0), height: Number(body.height || 0), contentType: body.contentType || "image/png", downloadName: body.downloadName || `${meta.slug}.png`, license: "personal-noncommercial", copyright: "© stamp-moke.jp", status: "published", publishedAt: body.publishedAt || now, updatedAt: now, canonicalUrl: `${SITE_URL}/free/${encodeURIComponent(meta.slug)}` };
        await put(`free-assets/meta/${meta.slug}.json`, JSON.stringify(record), { access: "private", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true });
        return json(res, 200, { asset: record });
      }
      return json(res, 400, { error: "Unknown action" });
    }
    return json(res, 405, { error: "Method not allowed" });
  } catch (error) { console.error("free-assets error", error); return json(res, 500, { error: error instanceof Error ? error.message : String(error) }); }
}
