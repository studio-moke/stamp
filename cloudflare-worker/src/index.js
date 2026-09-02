const LOCALES = ["ja", "en", "zh-tw", "th", "id"];
const MASTER = {
  platforms: ["pokekara", "x", "instagram", "facebook", "line", "youtube", "other"],
  types: ["icon", "header", "background", "story", "wallpaper", "thumbnail", "frame", "decoration"],
  motifs: ["cat", "dog", "bird", "food", "human", "text", "other"],
  styles: ["cute", "simple", "handdrawn", "funny", "cool", "retro", "minimal"],
};
const USE_CATEGORY_KEY = "free-assets/use-categories.json";
const DEFAULT_USE_CATEGORIES = [
  "SNS投稿", "SNSプロフィール", "チラシ・フライヤー", "ポスター", "印刷物", "ライブ・イベント",
  "動画・サムネイル", "ブログ・Web", "配信", "学校・サークル", "プレゼン・資料", "壁紙", "アイコン・プロフィール", "その他"
];

const localeSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "description", "seoTitle", "metaDescription", "alt", "keywords"],
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    seoTitle: { type: "string" },
    metaDescription: { type: "string" },
    alt: { type: "string" },
    keywords: { type: "array", items: { type: "string" } },
  },
};

const metadataSchema = {
  type: "object",
  additionalProperties: false,
  required: ["slug", "platforms", "types", "motifs", "styles", "character", "transparent", "useCategories", "locales"],
  properties: {
    slug: { type: "string" },
    platforms: { type: "array", items: { type: "string", enum: MASTER.platforms } },
    types: { type: "array", items: { type: "string", enum: MASTER.types } },
    motifs: { type: "array", items: { type: "string", enum: MASTER.motifs } },
    styles: { type: "array", items: { type: "string", enum: MASTER.styles } },
    character: { type: "string" },
    transparent: { type: "boolean" },
    useCategories: { type: "array", items: { type: "string" } },
    locales: {
      type: "object",
      additionalProperties: false,
      required: LOCALES,
      properties: Object.fromEntries(LOCALES.map((locale) => [locale, localeSchema])),
    },
  },
};

function cors(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "https://stamp-moke.jp",
    "Access-Control-Allow-Headers": "content-type,x-admin-token",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    Vary: "Origin",
  };
}

function respond(env, status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...cors(env) },
  });
}

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

function extractOutputText(data) {
  if (typeof data.output_text === "string" && data.output_text) return data.output_text;
  for (const item of data.output || []) for (const content of item.content || []) if (content.type === "output_text" && content.text) return content.text;
  return "";
}

function cleanCategory(value) {
  return String(value || "").normalize("NFKC").trim().replace(/\s+/g, " ").slice(0, 32);
}

async function readUseCategories(env) {
  try {
    const object = await env.FREE_ASSETS.get(USE_CATEGORY_KEY);
    if (!object) return [...DEFAULT_USE_CATEGORIES];
    const parsed = JSON.parse(await object.text());
    if (!Array.isArray(parsed)) return [...DEFAULT_USE_CATEGORIES];
    return [...new Set([...DEFAULT_USE_CATEGORIES, ...parsed.map(cleanCategory).filter(Boolean)])].slice(0, 100);
  } catch {
    return [...DEFAULT_USE_CATEGORIES];
  }
}

async function normalizeAndStoreUseCategories(env, proposed, existing) {
  const known = new Set(existing);
  const cleaned = [...new Set((Array.isArray(proposed) ? proposed : []).map(cleanCategory).filter(Boolean))];
  const reused = cleaned.filter(value => known.has(value)).slice(0, 3);
  const newCategory = cleaned.find(value => !known.has(value) && value !== "その他");
  const selected = [...new Set([...reused, ...(newCategory ? [newCategory] : [])])].slice(0, 4);
  if (!selected.length) selected.push("その他");
  if (newCategory) {
    const next = [...new Set([...existing, newCategory])].slice(0, 100);
    await env.FREE_ASSETS.put(USE_CATEGORY_KEY, JSON.stringify(next), { httpMetadata: { contentType: "application/json; charset=utf-8" } });
  }
  return selected;
}

async function analyze(request, env) {
  if (!env.FREE_ADMIN_TOKEN || request.headers.get("x-admin-token") !== env.FREE_ADMIN_TOKEN) return respond(env, 401, { error: "管理トークンが一致しません。" });
  if (!env.OPENAI_API_KEY) return respond(env, 500, { error: "OPENAI_API_KEY is not configured" });
  if (!env.FREE_ASSETS) return respond(env, 500, { error: "R2 binding FREE_ASSETS is not configured" });

  const input = await request.json().catch(() => ({}));
  const previewKey = String(input.previewKey || "");
  if (!previewKey.startsWith("free-assets/previews/")) return respond(env, 400, { error: "Invalid previewKey" });

  const object = await env.FREE_ASSETS.get(previewKey);
  if (!object) return respond(env, 404, { error: "AI解析用プレビューが見つかりません" });
  const buffer = await object.arrayBuffer();
  const contentType = object.httpMetadata?.contentType || "image/png";
  const imageDataUrl = `data:${contentType};base64,${toBase64(buffer)}`;
  const usageHint = String(input.usageHint || "").trim().slice(0, 400);
  const existingUseCategories = await readUseCategories(env);

  const instruction = `You create accurate SEO metadata for stamp-moke.jp free illustration/photo assets.
Use only the controlled vocabularies allowed by the schema for platforms, types, motifs and styles.
The admin may provide a free-form intended-use note. Treat it as the creator's intended usage, and naturally reflect it in descriptions, SEO copy and keywords when useful. Do not pretend that the intended use is visually present in the image.
For useCategories, prefer the existing broad categories below. Reuse a close existing category instead of creating synonyms or near-duplicates. Select 1-3 categories normally. Only when none fit, you may add at most ONE new broad Japanese category. Avoid overly specific categories such as one event name, one artist, one product, one platform feature or one-off phrase.
Existing use categories: ${existingUseCategories.join(" / ")}
Usage policy: personal/non-commercial use only. Good uses include social posts, profiles, posters, flyers, print materials, school/circle materials, presentations, blogs/web, streaming, video thumbnails and wallpapers. Commercial use, resale, redistribution and claiming authorship are prohibited. Copyright belongs to stamp-moke.jp.
Descriptions must accurately describe what is visible, then may add a natural sentence about suitable uses based on the admin's intended-use note. Do not invent a character name. SEO copy must be natural and useful.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || "gpt-5.6-luna",
        input: [{
          role: "user",
          content: [
            { type: "input_text", text: `${instruction}\n\nFilename: ${input.filename || "unknown"}\nSize: ${input.width || "?"}x${input.height || "?"}\nIntended use from admin: ${usageHint || "none"}` },
            { type: "input_image", image_url: imageDataUrl, detail: "low" },
          ],
        }],
        text: { format: { type: "json_schema", name: "free_asset_metadata", strict: true, schema: metadataSchema } },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return respond(env, 502, { error: `OpenAI ${response.status}: ${detail.slice(0, 800)}` });
    }
    const data = await response.json();
    const text = extractOutputText(data);
    if (!text) return respond(env, 502, { error: "AI returned no metadata" });
    const metadata = JSON.parse(text);
    metadata.useCategories = await normalizeAndStoreUseCategories(env, metadata.useCategories, existingUseCategories);
    metadata.usageIntent = usageHint;
    return respond(env, 200, { metadata, useCategories: existingUseCategories });
  } catch (error) {
    if (controller.signal.aborted) return respond(env, 504, { error: "AI analysis timed out" });
    return respond(env, 500, { error: error?.message || String(error) });
  } finally {
    clearTimeout(timeout);
  }
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(env) });
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return respond(env, 200, { ok: true, r2: Boolean(env.FREE_ASSETS), openai: Boolean(env.OPENAI_API_KEY), adminToken: Boolean(env.FREE_ADMIN_TOKEN) });
    }
    if (request.method === "POST" && url.pathname === "/analyze") return analyze(request, env);
    return respond(env, 404, { error: "Not found" });
  },
};
