import { r2GetJson, r2PutJson } from "./_r2.js";

const NEWS_KEY = "news/index.json";
const DRAFT_KEY = "note-drafts/index.json";
const MAX_DRAFTS = 90;

const clean = (v = "") => String(v ?? "").replace(/\s+/g, " ").trim();
const asArray = (v) => Array.isArray(v) ? v : [];
const jstDate = () => new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit"
}).format(new Date()).replaceAll("/", "-");

function getAuth(req) {
  const auth = clean(req.headers?.authorization || "");
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  const adminKey = clean(req.headers?.["x-admin-key"] || req.query?.key || "");
  const cronSecret = clean(process.env.CRON_SECRET || "");
  const adminSecret = clean(process.env.NOTE_DRAFT_ADMIN_KEY || cronSecret);
  return {
    cron: Boolean(cronSecret && bearer && bearer === cronSecret),
    admin: Boolean(adminSecret && ((adminKey && adminKey === adminSecret) || (bearer && bearer === adminSecret))),
    configured: Boolean(cronSecret || adminSecret),
  };
}

function parseText(data) {
  return data?.output_text || data?.output?.flatMap(x => x.content || []).find(x => x.type === "output_text")?.text || "";
}

function normalizeDraft(d = {}) {
  return {
    id: clean(d.id),
    date: clean(d.date),
    status: clean(d.status || "draft"),
    score: Number(d.score || 0),
    rationale: clean(d.rationale),
    sourceIds: asArray(d.sourceIds).map(clean).filter(Boolean),
    sourceItems: asArray(d.sourceItems),
    titleOptions: asArray(d.titleOptions).map(clean).filter(Boolean).slice(0, 3),
    title: clean(d.title),
    body: String(d.body || "").trim(),
    tags: asArray(d.tags).map(clean).filter(Boolean).slice(0, 10),
    imagePrompt: clean(d.imagePrompt),
    socialPost: String(d.socialPost || "").trim(),
    createdAt: clean(d.createdAt || new Date().toISOString()),
    updatedAt: clean(d.updatedAt || d.createdAt || new Date().toISOString()),
  };
}

function recentNews(news, drafts) {
  const used = new Set(asArray(drafts).flatMap(d => asArray(d.sourceIds)));
  return asArray(news)
    .filter(n => n?.id && !used.has(n.id))
    .sort((a, b) => `${b.date || ""}${b.generatedAt || ""}`.localeCompare(`${a.date || ""}${a.generatedAt || ""}`))
    .slice(0, 8);
}

async function generateWithAi(items) {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
  const source = items.map((x, i) => ({
    n: i + 1,
    id: x.id,
    type: x.type,
    label: x.label,
    date: x.date,
    title: x.title,
    lead: x.lead,
    body: x.body,
    url: x.url,
  }));
  const prompt = `あなたは個人クリエイター「stamp moke」のnote編集者です。以下は実際にstamp-moke.jpで発生した最近の更新です。\n\n目的:\n- 毎日無理に記事を作らず、noteに書く価値がある日だけ記事候補を作る。\n- AIっぽく綺麗にまとめすぎない。実際にやったこと、なぜやったか、迷い、気づき、次にどうするかを中心にする。\n- 入力にない事実、数字、感情、成果、背景を創作しない。\n- 小さな更新が複数ある場合は、共通テーマがあれば1本にまとめてよい。\n- 一般論の水増しは禁止。\n- 文体は少しフランクで、個人の開発日記・制作日記として自然に。\n\n判定:\n- scoreは0〜100。55未満ならpublishCandidate=falseにする。\n- publishCandidate=falseでも理由を短く残す。\n- publishCandidate=trueなら本文は700〜1600字程度。\n\n出力はJSONのみ:\n{\n  "publishCandidate": true,\n  "score": 0,\n  "rationale": "",\n  "sourceIds": [],\n  "titleOptions": ["", "", ""],\n  "body": "",\n  "tags": [],\n  "imagePrompt": "",\n  "socialPost": ""\n}\n\n最近の更新:\n${JSON.stringify(source, null, 2)}`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.NOTE_AI_MODEL || process.env.NEWS_AI_MODEL || "gpt-5.6-luna",
      input: prompt,
    }),
  });
  if (!response.ok) throw new Error(`OpenAI API failed: ${response.status}`);
  const raw = parseText(await response.json()).trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  return JSON.parse(raw);
}

async function generateDaily() {
  const today = jstDate();
  const existing = asArray(await r2GetJson(DRAFT_KEY, []).catch(() => [])).map(normalizeDraft);
  const already = existing.find(d => d.date === today);
  if (already) return { created: false, draft: already, reason: "already-generated-today" };

  const news = await r2GetJson(NEWS_KEY, []).catch(() => []);
  const candidates = recentNews(news, existing);
  if (!candidates.length) {
    const skipped = normalizeDraft({
      id: `note:${today}`,
      date: today,
      status: "skipped",
      score: 0,
      rationale: "新しい更新が見つからなかったため、今日は記事候補を作成しませんでした。",
      sourceIds: [],
      sourceItems: [],
      createdAt: new Date().toISOString(),
    });
    await r2PutJson(DRAFT_KEY, [skipped, ...existing].slice(0, MAX_DRAFTS));
    return { created: true, draft: skipped, reason: "no-new-updates" };
  }

  const ai = await generateWithAi(candidates);
  const selectedIds = asArray(ai.sourceIds).map(clean).filter(Boolean);
  const selectedItems = candidates.filter(x => selectedIds.includes(x.id));
  const publishCandidate = Boolean(ai.publishCandidate) && Number(ai.score || 0) >= 55;
  const titleOptions = asArray(ai.titleOptions).map(clean).filter(Boolean).slice(0, 3);
  const draft = normalizeDraft({
    id: `note:${today}`,
    date: today,
    status: publishCandidate ? "draft" : "skipped",
    score: Math.max(0, Math.min(100, Number(ai.score || 0))),
    rationale: ai.rationale,
    sourceIds: selectedIds,
    sourceItems: selectedItems,
    titleOptions,
    title: titleOptions[0] || "",
    body: publishCandidate ? ai.body : "",
    tags: publishCandidate ? ai.tags : [],
    imagePrompt: publishCandidate ? ai.imagePrompt : "",
    socialPost: publishCandidate ? ai.socialPost : "",
    createdAt: new Date().toISOString(),
  });
  await r2PutJson(DRAFT_KEY, [draft, ...existing].slice(0, MAX_DRAFTS));
  return { created: true, draft, reason: publishCandidate ? "draft-created" : "low-value-skip" };
}

async function updateStatus(id, status) {
  const allowed = new Set(["draft", "published", "skipped"]);
  if (!allowed.has(status)) throw new Error("Invalid status");
  const list = asArray(await r2GetJson(DRAFT_KEY, []).catch(() => [])).map(normalizeDraft);
  const i = list.findIndex(d => d.id === id);
  if (i < 0) throw new Error("Draft not found");
  list[i] = normalizeDraft({ ...list[i], status, updatedAt: new Date().toISOString() });
  await r2PutJson(DRAFT_KEY, list);
  return list[i];
}

export default async function handler(req, res) {
  try {
    const auth = getAuth(req);
    if (!auth.configured) return res.status(503).json({ error: "CRON_SECRET or NOTE_DRAFT_ADMIN_KEY is not configured" });

    if (req.method === "GET") {
      const action = clean(req.query?.action || "list");
      if (action === "generate") {
        if (!auth.cron && !auth.admin) return res.status(401).json({ error: "Unauthorized" });
        const result = await generateDaily();
        return res.status(200).json({ ok: true, created: result.created, status: result.draft?.status, score: result.draft?.score, reason: result.reason });
      }
      if (!auth.admin) return res.status(401).json({ error: "Unauthorized" });
      const limit = Math.min(Math.max(Number(req.query?.limit || 30), 1), MAX_DRAFTS);
      const list = asArray(await r2GetJson(DRAFT_KEY, []).catch(() => [])).map(normalizeDraft);
      res.setHeader("Cache-Control", "private, no-store");
      return res.status(200).json({ items: list.slice(0, limit) });
    }

    if (req.method === "POST") {
      if (!auth.admin) return res.status(401).json({ error: "Unauthorized" });
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      const action = clean(body.action);
      if (action === "generate") return res.status(200).json({ ok: true, ...(await generateDaily()) });
      if (action === "status") return res.status(200).json({ ok: true, item: await updateStatus(clean(body.id), clean(body.status)) });
      return res.status(400).json({ error: "Unknown action" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("note drafts api failed", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
}
