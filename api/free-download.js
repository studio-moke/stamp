import crypto from "node:crypto";
import { r2GetBuffer, r2GetJson } from "./_r2.js";

const DOWNLOADS_PER_DAY = 30;
const DOWNLOADS_PER_HOUR_PER_RUNTIME = 60;
const runtimeRate = new Map();

function slugify(value = "") {
  return String(value).normalize("NFKC").toLowerCase().trim().replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);
}
function cookieSecret() { return process.env.FREE_DOWNLOAD_SECRET || process.env.FREE_ADMIN_TOKEN || ""; }
function sign(value) { return crypto.createHmac("sha256", cookieSecret()).update(value).digest("base64url"); }
function parseCookies(header = "") { return Object.fromEntries(header.split(";").map((part) => part.trim()).filter(Boolean).map((part) => { const i = part.indexOf("="); return [part.slice(0, i), decodeURIComponent(part.slice(i + 1))]; })); }
function getDownloadState(req) {
  const today = new Date().toISOString().slice(0, 10);
  const raw = parseCookies(req.headers.cookie || "").sm_free_dl;
  if (!raw || !cookieSecret()) return { day: today, count: 0 };
  const i = raw.lastIndexOf(".");
  if (i < 0) return { day: today, count: 0 };
  const payload = raw.slice(0, i), sig = raw.slice(i + 1);
  if (sign(payload) !== sig) return { day: today, count: 0 };
  try { const state = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")); return state.day === today ? state : { day: today, count: 0 }; }
  catch { return { day: today, count: 0 }; }
}
function setDownloadState(res, state) {
  if (!cookieSecret()) return;
  const payload = Buffer.from(JSON.stringify(state), "utf8").toString("base64url");
  res.setHeader("Set-Cookie", `sm_free_dl=${payload}.${sign(payload)}; Path=/; Max-Age=86400; Secure; HttpOnly; SameSite=Lax`);
}
function runtimeRateAllowed(req) {
  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
  const hour = new Date().toISOString().slice(0, 13);
  const key = `${ip}:${hour}`;
  const next = (runtimeRate.get(key) || 0) + 1;
  runtimeRate.set(key, next);
  if (runtimeRate.size > 2000) runtimeRate.clear();
  return next <= DOWNLOADS_PER_HOUR_PER_RUNTIME;
}
function extFrom(asset, file) {
  const type = String(asset?.contentType || file?.contentType || "").toLowerCase();
  if (type.includes("jpeg")) return ".jpg";
  if (type.includes("webp")) return ".webp";
  if (type.includes("gif")) return ".gif";
  return ".png";
}
function publicFileName(asset, file) {
  const source = String(asset?.id || asset?.slug || asset?.originalKey || "stamp-moke");
  const code = crypto.createHash("sha256").update(source).digest("hex").slice(0, 10);
  return `stamp-moke-${code}${extFrom(asset, file)}`;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return res.status(405).end("Method not allowed");
    if (String(req.query.agree || "") !== "1") return res.status(400).json({ error: "Terms agreement required" });
    if (!runtimeRateAllowed(req)) return res.status(429).json({ error: "Too many downloads. Please try again later." });
    const state = getDownloadState(req);
    if (state.count >= DOWNLOADS_PER_DAY) return res.status(429).json({ error: `Daily download limit (${DOWNLOADS_PER_DAY}) reached.` });

    const slug = slugify(req.query.slug || "");
    const asset = await r2GetJson(`free-assets/meta/${slug}.json`, null);
    if (!asset || asset.status !== "published") return res.status(404).json({ error: "Not found" });
    const file = await r2GetBuffer(asset.originalKey);
    if (!file) return res.status(404).json({ error: "Original file not found" });

    setDownloadState(res, { day: state.day, count: state.count + 1 });
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Content-Type", asset.contentType || file.contentType || "application/octet-stream");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Disposition", `attachment; filename="${publicFileName(asset, file)}"`);
    res.status(200).end(file.buffer);
  } catch (error) {
    console.error("free-download error", error);
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
}
