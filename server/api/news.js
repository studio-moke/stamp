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
const stripLinkBlurb = (value = "") => clean(value)
  .replace(/(?:詳しくはこちら|詳細はこちら)\s*[：:]\s*https?:\/\/\S+/gi, "")
  .replace(/(?:詳しくはこちら|詳細はこちら)\s*[：:]\s*\/\S+/gi, "")
  .trim();

function normalizeRecord(record = {}) {
  const type = clean(record.type);
  let url = clean(record.url);
  if (type === "free") url = url.replace(/\/+$/, "");
  return {
    id: clean(record.id),
    slug: clean(record.slug),
    type,
    label: clean(record.label),
    date: clean(record.date),
    title: clean(record.title),
    lead: clean(record.lead),
    body: stripLinkBlurb(record.body),
    sourceTitle: clean(record.sourceTitle),
    sourceDescription: clean(record.sourceDescription),
    url,
    image: clean(record.image),
    generatedAt: clean(record.generatedAt || new Date().toISOString()),
  };
}

function candidateFromSticker(item) {
  const sourceTitle = stripLineSuffix(item.title || "新作LINEスタンプ");
  return { id:`sticker:${item.id}`, type:"sticker", label:"LINEスタンプ", sourceTitle, sourceDescription:clean(item.description), url:`/stickers/${item.id}`, image:clean(item.image), date:"" };
}

function candidateFromSuzuri(item) {
  return { id:`suzuri:${item.id}`, type:"suzuri", label:"SUZURI", sourceTitle:clean(item.title || "新しいグッズ"), sourceDescription:clean(item.description), url:`/goods/${item.id}`, image:clean(item.image), date:jstDate(item.publishedAt) };
}

function candidateFromFree(item) {
  const ja = item?.locales?.ja || {};
  return { id:`free:${item.slug}`, type:"free", label:"フリー素材", sourceTitle:clean(ja.title || item.slug || "新しいフリー素材"), sourceDescription:clean(ja.description || ja.alt || ""), url:`/free/${encodeURIComponent(item.slug)}`, image:clean(item.previewUrl || item.image || item.thumbnail || ""), date:jstDate(item.publishedAt) };
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
      out.push({ id:`tool:${href}`, type:"tool", label:"無料ツール", sourceTitle:text, sourceDescription:`${text}をstamp mokeの無料ツール集に追加しました。`, url:href, image:"", date:"" });
    }
    return [...new Map(out.map(x => [x.id, x])).values()].slice(0, 40);
  } catch { return []; }
}

async function candidates() {
  const free = await r2GetJson(FREE_INDEX_KEY, []).catch(() => []);
  const freePublished = asArray(free).filter(x => x?.status === "published").sort((a,b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || ""))).slice(0, 12).map(candidateFromFree);
  const tools = await discoverTools();
  return [...asArray(stickers).slice(0,12).map(candidateFromSticker), ...asArray(suzuriDesigns).slice(0,12).map(candidateFromSuzuri), ...freePublished, ...tools];
}

function fallbackCopy(c, initial = false) {
  const title = c.type === "sticker" ? `「${c.sourceTitle}」${initial ? "を掲載しました" : "をリリースしました！"}` : c.type === "suzuri" ? `SUZURIに「${c.sourceTitle}」を追加しました！` : c.type === "tool" ? `無料ツール「${c.sourceTitle}」を追加しました！` : `フリー素材「${c.sourceTitle}」を追加しました！`;
  if (c.type === "sticker") return {
    title,
    lead:"stamp mokeに新しいLINEスタンプが加わりました。",
    body:`今回のお知らせは「${c.sourceTitle}」。普段のトークで使う場面を想像しながら、気軽に選べる新作として紹介します。スタンプの詳しい内容や収録デザインは作品ページでご覧いただけます。`,
  };
  if (c.type === "suzuri") return {
    title,
    lead:"stamp mokeのデザインを、グッズでも楽しめるようになりました。",
    body:`「${c.sourceTitle}」をSUZURIのラインナップに追加しました。NEWSでは更新情報としてポイントだけを紹介しています。アイテムの種類や仕様など、詳しい内容は商品ページでチェックしてみてください。`,
  };
  if (c.type === "tool") return {
    title,
    lead:"日々のちょっとした作業を軽くする無料ツールを追加しました。",
    body:`今回追加したのは「${c.sourceTitle}」。必要なときにすぐ使えることを意識して、stamp mokeの無料ツール集に加えています。機能や使い方はツールページでお試しください。`,
  };
  return {
    title,
    lead:"フリー素材コーナーに新しい一枚を追加しました。",
    body:`今回追加したのは「${c.sourceTitle}」。NEWSでは素材そのものの説明を繰り返さず、新着情報として短くご紹介します。画像の雰囲気や利用条件、ダウンロードについては素材ページで確認できます。`,
  };
}

function parseText(data) { return data?.output_text || data?.output?.flatMap(x => x.content || []).find(x => x.type === "output_text")?.text || ""; }

async function aiCopy(c, initial = false) {
  if (!process.env.OPENAI_API_KEY) return fallbackCopy(c, initial);
  const prompt = `stamp-moke.jpのNEWS記事を書いてください。これはリンク先ページの要約ではなく、サイト運営者が更新を紹介する独立した編集記事です。企業プレスリリースほど堅くせず、個人クリエイターが新作を紹介するような少しフランクな日本語にしてください。全体で180〜320文字程度。\n\n最重要ルール:\n- 「説明」欄は事実確認の参考資料にすぎません。文章・文節・語順をコピーしないでください。\n- リンク先ページと同じ文章、近い言い換え、冒頭文の流用を避け、NEWS独自の切り口で書いてください。\n- NEWSでは「何が追加されたか」「どんな場面で役立ちそうか」「今回の更新の見どころ」を編集者目線で短く紹介してください。\n- URL、パス文字列、「詳しくはこちら：〜」は本文に絶対に書かないでください。CTAボタンを別途表示します。\n- 入力にない事実、売上、人気、制作背景、機能を創作しないでください。\n- 「この度」「販売開始いたしました」など硬すぎる定型文は避けてください。\n- title / lead / body のJSONだけを返してください。\n\n種別: ${c.label}\nタイトル: ${c.sourceTitle}\n参考用の元ページ説明（転載禁止）: ${c.sourceDescription || "説明なし"}\nリンク先: ${c.url}\n初回掲載データか: ${initial ? "はい。リリース日を断定せず『掲載しました』程度にする" : "いいえ。新規検知として紹介してよい"}\n\nJSON形式: {"title":"","lead":"","body":""}`;
  try {
    const response = await fetch("https://api.openai.com/v1/responses", { method:"POST", headers:{ Authorization:`Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type":"application/json" }, body:JSON.stringify({ model:process.env.NEWS_AI_MODEL || process.env.STICKER_SEO_AI_MODEL || "gpt-5.6-luna", input:prompt }) });
    if (!response.ok) return fallbackCopy(c, initial);
    const raw = parseText(await response.json()).trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const parsed = JSON.parse(raw);
    return { title:clean(parsed.title).slice(0,120), lead:clean(parsed.lead).slice(0,180), body:stripLinkBlurb(parsed.body).slice(0,700) };
  } catch { return fallbackCopy(c, initial); }
}

function compactForCompare(value = "") {
  return clean(value).replace(/[、。！？!?・\s]/g, "").toLowerCase();
}

function isTooCloseToSource(record = {}, candidate = {}) {
  const body = compactForCompare(record.body);
  const source = compactForCompare(candidate.sourceDescription || record.sourceDescription);
  if (!body || !source) return false;
  if (body === source || body.includes(source) || source.includes(body)) return true;
  const sample = source.slice(0, Math.min(36, source.length));
  return sample.length >= 18 && body.includes(sample);
}

async function syncNews(existing, { rewriteExisting = false } = {}) {
  const list = asArray(existing).map(normalizeRecord);
  const all = await candidates();
  const candidateMap = new Map(all.map(x => [x.id, x]));
  const known = new Set(list.map(x => x.id));
  const initial = list.length === 0;
  const missing = all.filter(x => !known.has(x.id));
  const created = [];
  for (const c of missing.slice(0, initial ? 8 : 4)) {
    const copy = await aiCopy(c, initial);
    const date = c.date || jstDate();
    created.push(normalizeRecord({ ...c, date, title:copy.title, lead:copy.lead, body:copy.body, slug:`${date}-${slugify(c.type)}-${slugify(c.sourceTitle || c.id)}`, generatedAt:new Date().toISOString() }));
  }

  let rewritten = 0;
  const refreshed = [];
  for (const item of list) {
    const c = candidateMap.get(item.id);
    const shouldRewrite = rewriteExisting && c && rewritten < 12 && (isTooCloseToSource(item, c) || /詳しくはこちら|詳細はこちら/.test(item.body));
    if (!shouldRewrite) {
      refreshed.push(item);
      continue;
    }
    const copy = await aiCopy(c, false);
    rewritten += 1;
    refreshed.push(normalizeRecord({ ...item, ...c, title:copy.title, lead:copy.lead, body:copy.body, generatedAt:new Date().toISOString() }));
  }

  const next = [...created, ...refreshed].sort((a,b) => `${b.date}${b.generatedAt}`.localeCompare(`${a.date}${a.generatedAt}`)).slice(0, MAX_ITEMS);
  if (created.length || rewritten) await r2PutJson(INDEX_KEY, next);
  return next;
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error:"Method not allowed" });
  try {
    let index = asArray(await r2GetJson(INDEX_KEY, [])).map(normalizeRecord);
    const shouldSync = String(req.query?.sync || "0") === "1";
    const rewriteExisting = String(req.query?.rewrite || "0") === "1";
    if (shouldSync) index = await syncNews(index, { rewriteExisting });
    const id = clean(req.query?.id || "");
    const slug = clean(req.query?.slug || "");
    if (id || slug) {
      const item = index.find(x => (id && x.id === id) || (slug && x.slug === slug));
      if (!item) return res.status(404).json({ error:"News not found" });
      res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=900");
      return res.status(200).json({ item });
    }
    const limit = Math.min(Math.max(Number(req.query?.limit || 20), 1), 80);
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=900");
    return res.status(200).json({ items:index.slice(0,limit) });
  } catch (error) {
    console.error("news api failed", error);
    return res.status(500).json({ error:error instanceof Error ? error.message : String(error) });
  }
}
