import stickers from "../../src/data/stickers.json" with { type: "json" };
import suzuriDesigns from "../../src/data/suzuri-designs.json" with { type: "json" };
import { r2GetJson, r2PutJson } from "./_r2.js";

const INDEX_KEY = "news/index.json";
const FREE_INDEX_KEY = "free-assets/index.json";
const MAX_ITEMS = 80;
const site = "https://stamp-moke.jp";

const clean = (value = "") => String(value).replace(/\s+/g, " ").trim();
const slugify = (value = "") => clean(value).toLowerCase().replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);
const jstDate = (value) => {
  const d = value ? new Date(value) : new Date();
  return new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(d).replaceAll("/", "-");
};
const stripLineSuffix = (title = "") => clean(title).replace(/\s*-\s*LINE\s*スタンプ.*$/i, "").replace(/\s*\|\s*LINE STORE.*$/i, "");
const asArray = (v) => Array.isArray(v) ? v : [];

function normalizeRecord(record = {}) {
  return {
    id: clean(record.id),
    slug: clean(record.slug),
    type: clean(record.type),
    label: clean(record.label),
    date: clean(record.date),
    title: clean(record.title),
    lead: clean(record.lead),
    body: clean(record.body),
    sourceTitle: clean(record.sourceTitle),
    sourceDescription: clean(record.sourceDescription),
    url: clean(record.url),
    image: clean(record.image),
    generatedAt: clean(record.generatedAt || new Date().toISOString()),
  };
}

function candidateFromSticker(item) {
  const sourceTitle = stripLineSuffix(item.title || "新作LINEスタンプ");
  return {
    id: `sticker:${item.id}`,
    type: "sticker",
    label: "LINEスタンプ",
    sourceTitle,
    sourceDescription: clean(item.description),
    url: `/stickers/${item.id}`,
    image: clean(item.image),
    date: "",
  };
}

function candidateFromSuzuri(item) {
  return {
    id: `suzuri:${item.id}`,
    type: "suzuri",
    label: "SUZURI",
    sourceTitle: clean(item.title || "新しいグッズ"),
    sourceDescription: clean(item.description),
    url: `/goods/${item.id}`,
    image: clean(item.image),
    date: jstDate(item.publishedAt),
  };
}

function candidateFromFree(item) {
  const ja = item?.locales?.ja || {};
  return {
    id: `free:${item.slug}`,
    type: "free",
    label: "フリー素材",
    sourceTitle: clean(ja.title || item.slug || "新しいフリー素材"),
    sourceDescription: clean(ja.description || ja.alt || ""),
    url: `/free/${encodeURIComponent(item.slug)}/`,
    image: clean(item.previewUrl || item.image || item.thumbnail || ""),
    date: jstDate(item.publishedAt),
  };
}

async function discoverTools() {
  try {
    const html = await fetch(`${site}/tools/`, { headers: { "user-agent": "stamp-moke-news-bot/1.0" } }).then(r => r.ok ? r.text() : "");
    if (!html) return [];
    const out = [];
    const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    while ((m = re.exec(html))) {
      let href = m[1];
      if (!href.startsWith("/")) continue;
      if (href.startsWith("/tools") || href.startsWith("/free/") || href.startsWith("/goods") || href.startsWith("/stickers") || href.startsWith("/news")) continue;
      if (/^\/(?:en|zh-tw|th|id)(?:\/|$)/.test(href)) continue;
      const text = clean(m[2].replace(/<[^>]+>/g, " ").replace(/&[^;]+;/g, " "));
      if (!text || text.length > 90) continue;
      if (!/(ツール|メーカー|生成|変換|計算|検索|圧縮|透過|リサイズ|QR|カラー|文字|年齢|郵便|画像|スタンプ|SKU|パスワード)/i.test(text + " " + href)) continue;
      href = href.split("#")[0].split("?")[0];
      out.push({
        id: `tool:${href}`,
        type: "tool",
        label: "無料ツール",
        sourceTitle: text,
        sourceDescription: `${text}をstamp mokeの無料ツール集に追加しました。`,
        url: href,
        image: "",
        date: "",
      });
    }
    return [...new Map(out.map(x => [x.id, x])).values()].slice(0, 40);
  } catch {
    return [];
  }
}

async function candidates() {
  const free = await r2GetJson(FREE_INDEX_KEY, []).catch(() => []);
  const freePublished = asArray(free).filter(x => x?.status === "published").sort((a,b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || ""))).slice(0, 12).map(candidateFromFree);
  const tools = await discoverTools();
  return [
    ...asArray(stickers).slice(0, 12).map(candidateFromSticker),
    ...asArray(suzuriDesigns).slice(0, 12).map(candidateFromSuzuri),
    ...freePublished,
    ...tools,
  ];
}

function fallbackCopy(c, initial = false) {
  const title = c.type === "sticker"
    ? `「${c.sourceTitle}」${initial ? "を掲載しました" : "をリリースしました！"}`
    : c.type === "suzuri"
      ? `SUZURIに「${c.sourceTitle}」を追加しました！`
      : c.type === "tool"
        ? `無料ツール「${c.sourceTitle}」を追加しました！`
        : `フリー素材「${c.sourceTitle}」を追加しました！`;
  const lead = c.type === "sticker" ? "こんなときに使ってほしい、という気持ちから作った新作です。" : "stamp mokeに新しいコンテンツが仲間入りしました。";
  const body = c.sourceDescription || lead;
  return { title, lead, body };
}

function parseText(data) {
  return data?.output_text || data?.output?.flatMap(x => x.content || []).find(x => x.type === "output_text")?.text || "";
}

async function aiCopy(c, initial = false) {
  if (!process.env.OPENAI_API_KEY) return fallbackCopy(c, initial);
  const prompt = `stamp-moke.jpのNEWS記事を書いてください。企業プレスリリースほど堅くせず、個人クリエイターが新作を紹介するような少しフランクな日本語にしてください。長くしすぎず、全体で180〜320文字程度。\n\n重要ルール:\n- 入力にない事実、売上、人気、制作背景、機能を創作しない。\n- 読者にどんな場面で役立つか、どんな気持ちやコンセプトかを自然に説明する。\n- 「この度」「販売開始いたしました」など硬すぎる定型文は避ける。\n- title / lead / body のJSONだけを返す。\n\n種別: ${c.label}\nタイトル: ${c.sourceTitle}\n説明: ${c.sourceDescription || "説明なし"}\nリンク先: ${c.url}\n初回掲載データか: ${initial ? "はい。リリース日を断定せず『掲載しました』程度にする" : "いいえ。新規検知として紹介してよい"}\n\nJSON形式: {"title":"","lead":"","body":""}`;
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.NEWS_AI_MODEL || process.env.STICKER_SEO_AI_MODEL || "gpt-5.6-luna", input: prompt }),
    });
    if (!response.ok) return fallbackCopy(c, initial);
    const raw = parseText(await response.json()).trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const parsed = JSON.parse(raw);
    return {
      title: clean(parsed.title).slice(0, 120),
      lead: clean(parsed.lead).slice(0, 180),
      body: clean(parsed.body).slice(0, 700),
    };
  } catch {
    return fallbackCopy(c, initial);
  }
}

async function syncNews(existing) {
  const list = asArray(existing).map(normalizeRecord);
  const known = new Set(list.map(x => x.id));
  const all = await candidates();
  const initial = list.length === 0;
  const missing = all.filter(x => !known.has(x.id));
  const limit = initial ? 8 : 4;
  const selected = missing.slice(0, limit);
  if (!selected.length) return list;
  const created = [];
  for (const c of selected) {
    const copy = await aiCopy(c, initial);
    const date = c.date || jstDate();
    created.push(normalizeRecord({
      ...c,
      date,
      title: copy.title,
      lead: copy.lead,
      body: copy.body,
      slug: `${date}-${slugify(c.type)}-${slugify(c.sourceTitle || c.id)}`,
      generatedAt: new Date().toISOString(),
    }));
  }
  const next = [...created, ...list].sort((a,b) => `${b.date}${b.generatedAt}`.localeCompare(`${a.date}${a.generatedAt}`)).slice(0, MAX_ITEMS);
  await r2PutJson(INDEX_KEY, next);
  return next;
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    let index = await r2GetJson(INDEX_KEY, []);
    const noSync = String(req.query?.sync || "1") === "0";
    if (!noSync) index = await syncNews(index);
    const id = clean(req.query?.id || "");
    const slug = clean(req.query?.slug || "");
    if (id || slug) {
      const item = asArray(index).find(x => (id && x.id === id) || (slug && x.slug === slug));
      if (!item) return res.status(404).json({ error: "News not found" });
      res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=1800");
      return res.status(200).json({ item });
    }
    const limit = Math.min(Math.max(Number(req.query?.limit || 20), 1), 80);
    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=900");
    return res.status(200).json({ items: asArray(index).slice(0, limit) });
  } catch (error) {
    console.error("news api failed", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
}
