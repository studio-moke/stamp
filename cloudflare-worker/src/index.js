const LOCALES = ["ja", "en", "zh-tw", "th", "id"];
const MASTER = {
  platforms: ["pokekara", "x", "instagram", "facebook", "line", "youtube", "other"],
  types: ["icon", "header", "background", "story", "wallpaper", "thumbnail", "frame", "decoration"],
  motifs: ["cat", "dog", "bird", "food", "human", "text", "other"],
  styles: ["cute", "simple", "handdrawn", "funny", "cool", "retro", "minimal"],
};

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
  required: ["slug", "platforms", "types", "motifs", "styles", "character", "transparent", "locales"],
  properties: {
    slug: { type: "string" },
    platforms: { type: "array", items: { type: "string", enum: MASTER.platforms } },
    types: { type: "array", items: { type: "string", enum: MASTER.types } },
    motifs: { type: "array", items: { type: "string", enum: MASTER.motifs } },
    styles: { type: "array", items: { type: "string", enum: MASTER.styles } },
    character: { type: "string" },
    transparent: { type: "boolean" },
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
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function extractOutputText(data) {
  if (typeof data.output_text === "string" && data.output_text) return data.output_text;
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) return content.text;
    }
  }
  return "";
}

async function analyze(request, env) {
  if (!env.FREE_ADMIN_TOKEN || request.headers.get("x-admin-token") !== env.FREE_ADMIN_TOKEN) {
    return respond(env, 401, { error: "管理トークンが一致しません。" });
  }
  if (!env.OPENAI_API_KEY) return respond(env, 500, { error: "OPENAI_API_KEY is not configured" });
  if (!env.FREE_ASSETS) return respond(env, 500, { error: "R2 binding FREE_ASSETS is not configured" });

  const input = await request.json().catch(() => ({}));
  const previewKey = String(input.previewKey || "");
  if (!previewKey.startsWith("free-assets/previews/")) {
    return respond(env, 400, { error: "Invalid previewKey" });
  }

  const object = await env.FREE_ASSETS.get(previewKey);
  if (!object) return respond(env, 404, { error: "AI解析用プレビューが見つかりません" });
  const buffer = await object.arrayBuffer();
  const contentType = object.httpMetadata?.contentType || "image/png";
  const imageDataUrl = `data:${contentType};base64,${toBase64(buffer)}`;

  const instruction = `You create accurate SEO metadata for stamp-moke.jp free illustration/photo assets.\nUse only the controlled vocabularies allowed by the schema.\nUsage policy: personal/non-commercial use only. Good uses include Pokekara and social media profiles/posts, personal flyers, school/circle/non-commercial print. Commercial use, resale, redistribution and claiming authorship are prohibited. Copyright belongs to stamp-moke.jp.\nDescriptions must describe only what is visible. Do not invent a character name. SEO copy must be natural and useful.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || "gpt-5.6-luna",
        input: [{
          role: "user",
          content: [
            { type: "input_text", text: `${instruction}\n\nFilename: ${input.filename || "unknown"}\nSize: ${input.width || "?"}x${input.height || "?"}\nPlatform hint: ${input.platformHint || "none"}\nCharacter hint: ${input.characterHint || "none"}` },
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
    return respond(env, 200, { metadata: JSON.parse(text) });
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
      return respond(env, 200, {
        ok: true,
        r2: Boolean(env.FREE_ASSETS),
        openai: Boolean(env.OPENAI_API_KEY),
        adminToken: Boolean(env.FREE_ADMIN_TOKEN),
      });
    }
    if (request.method === "POST" && url.pathname === "/analyze") return analyze(request, env);
    return respond(env, 404, { error: "Not found" });
  },
};
