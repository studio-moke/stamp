import crypto from "node:crypto";
import { r2GetJson, r2PutJson } from "./_r2.js";

const INDEX_KEY = "chat-stamps/index.json";
const MAX_ITEMS = 500;
const MAX_TEXT = 32;
const allowedStyles = new Set(["business", "pop", "stamp", "bold", "soft", "mono"]);
const allowedLayouts = new Set(["horizontal", "vertical"]);
const allowedLineModes = new Set(["auto", "1", "2", "3", "4"]);
const allowedEffects = new Set(["none", "shadow", "glow", "depth"]);
const allowedBackgrounds = new Set(["transparent", "white", "color"]);

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, MAX_TEXT);
}

function safeColor(value, fallback) {
  const v = String(value || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : fallback;
}

function safeSettings(raw = {}) {
  return {
    lineMode: allowedLineModes.has(String(raw.lineMode)) ? String(raw.lineMode) : "auto",
    textColor: safeColor(raw.textColor, "#111827"),
    strokeEnabled: raw.strokeEnabled !== false,
    strokeColor: safeColor(raw.strokeColor, "#ffffff"),
    strokeWidth: Math.min(28, Math.max(0, Number(raw.strokeWidth) || 14)),
    effect: allowedEffects.has(raw.effect) ? raw.effect : "none",
    background: allowedBackgrounds.has(raw.background) ? raw.background : "transparent",
    backgroundColor: safeColor(raw.backgroundColor, "#fff3f7"),
  };
}

function safetyCheck(raw) {
  const text = normalizeText(raw);
  if (!text) return { level: "red", reason: "文字を入力してください" };
  const flattened = text.replace(/\n/g, " ");
  const lower = flattened.toLowerCase();
  const redPatterns = [
    /(?:https?:\/\/|www\.)/i,
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
    /(?:\+?81[- ]?)?0\d{1,4}[- ]?\d{1,4}[- ]?\d{3,4}/,
    /\b(?:\d[ -]?){12,19}\b/,
    /\b(?:password|passwd|secret|token|api[_ -]?key|access[_ -]?key)\b/i,
    /(?:パスワード|暗証番号|社外秘|機密|極秘|顧客情報|個人情報|口座番号|カード番号|社員番号|契約番号|注文番号)/,
    /(?:〒?\d{3}[-ー]\d{4})/,
    /(?:東京都|北海道|大阪府|京都府|.{2,3}県).{0,12}(?:市|区|町|村).{0,12}(?:丁目|番地|番|号)/,
  ];
  if (redPatterns.some((p) => p.test(flattened))) return { level: "red", reason: "個人情報・機密情報の可能性があります" };
  const yellowPatterns = [
    /\d{4,}/,
    /[A-Za-z]{2,}\d{2,}|\d{2,}[A-Za-z]{2,}/,
    /(?:株式会社|有限会社|合同会社|部署|部長|課長|担当者|取引先|クライアント|案件|見積|請求)/,
    /(?:[一-龯々]{2,8})(?:さん|様|くん|君|ちゃん|氏)/,
    /(?:住所|電話|携帯|メール|E-mail|ID|ログイン|アカウント)/i,
  ];
  if (yellowPatterns.some((p) => p.test(flattened))) return { level: "yellow", reason: "固有情報を含む可能性があります" };
  if (/死ね|殺す|ころす|fuck|shit/i.test(lower)) return { level: "yellow", reason: "公開に適さない表現の可能性があります" };
  return { level: "green", reason: "公開可能な範囲と判定しました" };
}

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

function publicItem(item) {
  const { deleteTokenHash, ...safe } = item;
  return safe;
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const items = await r2GetJson(INDEX_KEY, []);
      return send(res, 200, { items: items.slice(0, 120).map(publicItem) });
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      const text = normalizeText(body.text);
      const check = safetyCheck(text);
      if (check.level !== "green") return send(res, 400, { error: "公開できません", safety: check });
      if (body.consent !== true) return send(res, 400, { error: "公開への同意が必要です" });

      const style = allowedStyles.has(body.style) ? body.style : "business";
      const layout = allowedLayouts.has(body.layout) ? body.layout : "horizontal";
      const settings = safeSettings(body.settings);
      const deleteToken = crypto.randomBytes(24).toString("base64url");
      const item = {
        id: `${Date.now().toString(36)}-${crypto.randomBytes(5).toString("hex")}`,
        text,
        style,
        layout,
        settings,
        createdAt: new Date().toISOString(),
        deleteTokenHash: crypto.createHash("sha256").update(deleteToken).digest("hex"),
      };
      const current = await r2GetJson(INDEX_KEY, []);
      const next = [item, ...current].slice(0, MAX_ITEMS);
      await r2PutJson(INDEX_KEY, next);
      return send(res, 201, { item: publicItem(item), deleteToken });
    }

    if (req.method === "DELETE") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      const id = String(body.id || "");
      const tokenHash = crypto.createHash("sha256").update(String(body.deleteToken || "")).digest("hex");
      const current = await r2GetJson(INDEX_KEY, []);
      const target = current.find((item) => item.id === id);
      if (!target) return send(res, 404, { error: "見つかりません" });
      if (!crypto.timingSafeEqual(Buffer.from(tokenHash), Buffer.from(target.deleteTokenHash))) return send(res, 403, { error: "削除キーが一致しません" });
      await r2PutJson(INDEX_KEY, current.filter((item) => item.id !== id));
      return send(res, 200, { ok: true });
    }

    res.setHeader("Allow", "GET, POST, DELETE");
    return send(res, 405, { error: "Method Not Allowed" });
  } catch (error) {
    console.error("chat-stamps", error);
    return send(res, 500, { error: "処理に失敗しました" });
  }
}
