import stickers from "../../src/data/stickers.json" with { type: "json" };
import suzuriDesigns from "../../src/data/suzuri-designs.json" with { type: "json" };
import { r2GetJson, r2PutJson } from "./_r2.js";

const NEWS_KEY = "news/index.json";
const DRAFT_KEY = "note-drafts/index.json";
const FREE_INDEX_KEY = "free-assets/index.json";
const MAX_DRAFTS = 90;
const SITE = "https://stamp-moke.jp";
const GITHUB_REPO = "studio-moke/stamp";

const clean = (v = "") => String(v ?? "").replace(/\s+/g, " ").trim();
const asArray = (v) => Array.isArray(v) ? v : [];
const jstDate = (value) => new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit"
}).format(value ? new Date(value) : new Date()).replaceAll("/", "-");

function getAuth(req) {
  const auth = clean(req.headers?.authorization || "");
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  const adminKey = clean(req.headers?.["x-admin-key"] || req.query?.key || "");
  const cronSecret = clean(process.env.CRON_SECRET || "");
  const adminSecret = clean(process.env.NOTE_DRAFT_ADMIN_KEY || process.env.ANALYTICS_ADMIN_TOKEN || cronSecret);
  const cronSchedule = clean(req.headers?.["x-vercel-cron-schedule"] || "");
  return {
    cron: Boolean((cronSecret && bearer === cronSecret) || (!cronSecret && cronSchedule === "15 22 * * *")),
    admin: Boolean(adminSecret && ((adminKey && adminKey === adminSecret) || (bearer && bearer === adminSecret))),
    configured: Boolean(cronSecret || adminSecret || cronSchedule),
  };
}

function parseText(data) {
  return data?.output_text || data?.output?.flatMap(x => x.content || []).find(x => x.type === "output_text")?.text || "";
}

function normalizeDraft(d = {}) {
  return {
    id: clean(d.id), date: clean(d.date), status: clean(d.status || "draft"), score: Number(d.score || 0),
    rationale: clean(d.rationale), sourceIds: asArray(d.sourceIds).map(clean).filter(Boolean), sourceItems: asArray(d.sourceItems),
    titleOptions: asArray(d.titleOptions).map(clean).filter(Boolean).slice(0, 3), title: clean(d.title), body: String(d.body || "").trim(),
    tags: asArray(d.tags).map(clean).filter(Boolean).slice(0, 10), imagePrompt: clean(d.imagePrompt), socialPost: String(d.socialPost || "").trim(),
    createdAt: clean(d.createdAt || new Date().toISOString()), updatedAt: clean(d.updatedAt || d.createdAt || new Date().toISOString()),
  };
}

function normalizeSource(s = {}) {
  return {
    id: clean(s.id), type: clean(s.type), label: clean(s.label), date: clean(s.date), title: clean(s.title), lead: clean(s.lead),
    body: clean(s.body), url: clean(s.url), generatedAt: clean(s.generatedAt || ""),
  };
}

function sourceFromSticker(x = {}) {
  const title = clean(x.title || "新しいLINEスタンプ").replace(/\s*-\s*LINE\s*スタンプ.*$/i, "").replace(/\s*\|\s*LINE STORE.*$/i, "");
  return normalizeSource({ id:`sticker:${x.id}`, type:"sticker", label:"LINEスタンプ", date:jstDate(x.publishedAt || x.updatedAt || Date.now()), title, lead:clean(x.description), body:clean(x.description), url:`/stickers/${x.id}` });
}

function sourceFromSuzuri(x = {}) {
  return normalizeSource({ id:`suzuri:${x.id}`, type:"suzuri", label:"SUZURI", date:jstDate(x.publishedAt || x.updatedAt || Date.now()), title:clean(x.title || "新しいグッズ"), lead:clean(x.description), body:clean(x.description), url:`/goods/${x.id}` });
}

function sourceFromFree(x = {}) {
  const ja=x?.locales?.ja||{};
  return normalizeSource({ id:`free:${x.slug}`, type:"free", label:"フリー素材", date:jstDate(x.publishedAt || x.updatedAt || Date.now()), title:clean(ja.title || x.slug || "新しいフリー素材"), lead:clean(ja.description || ja.alt), body:clean(ja.description || ja.alt), url:`/free/${encodeURIComponent(x.slug)}/` });
}

async function discoverTools() {
  try {
    const html=await fetch(`${SITE}/tools/`,{headers:{"user-agent":"stamp-moke-note-bot/2.0"}}).then(r=>r.ok?r.text():"");
    if(!html) return [];
    const out=[]; const re=/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi; let m;
    while((m=re.exec(html))){
      let href=m[1]; if(!href.startsWith("/")) continue;
      if(href.startsWith("/tools")||href.startsWith("/free/")||href.startsWith("/goods")||href.startsWith("/stickers")||href.startsWith("/news")) continue;
      if(/^\/(?:en|zh-tw|th|id)(?:\/|$)/.test(href)) continue;
      const text=clean(m[2].replace(/<[^>]+>/g," ").replace(/&[^;]+;/g," "));
      if(!text||text.length>90||!/(ツール|メーカー|生成|変換|計算|検索|圧縮|透過|リサイズ|QR|カラー|文字|年齢|郵便|画像|スタンプ|SKU|パスワード)/i.test(text+" "+href)) continue;
      href=href.split("#")[0].split("?")[0];
      out.push(normalizeSource({id:`tool:${href}`,type:"tool",label:"無料ツール",date:jstDate(),title:text,lead:`${text}をstamp mokeの無料ツール集に追加・更新しました。`,body:`${text}をstamp mokeの無料ツール集に追加・更新しました。`,url:href}));
    }
    return [...new Map(out.map(x=>[x.id,x])).values()].slice(0,30);
  } catch { return []; }
}

async function githubUpdates() {
  try {
    const r=await fetch(`https://api.github.com/repos/${GITHUB_REPO}/commits?per_page=20`,{headers:{"accept":"application/vnd.github+json","user-agent":"stamp-moke-note-bot/2.0"}});
    if(!r.ok) return [];
    const rows=await r.json();
    return asArray(rows).map(c=>{
      const message=clean(c?.commit?.message||"").split("\n")[0];
      const date=c?.commit?.committer?.date||c?.commit?.author?.date||"";
      return normalizeSource({id:`github:${c.sha}`,type:"github",label:"サイト改善",date:jstDate(date),title:message,lead:"stamp-moke.jp のサイトや運用機能を更新しました。",body:message,url:c.html_url||`https://github.com/${GITHUB_REPO}/commit/${c.sha}`,generatedAt:date});
    }).filter(x=>x.title && !/^(merge|chore: remove temporary|update stickers, chat icon)/i.test(x.title)).slice(0,12);
  } catch { return []; }
}

async function collectSources() {
  const [news, free, tools, commits]=await Promise.all([
    r2GetJson(NEWS_KEY,[]).catch(()=>[]), r2GetJson(FREE_INDEX_KEY,[]).catch(()=>[]), discoverTools(), githubUpdates()
  ]);
  const direct=[
    ...asArray(stickers).slice(0,20).map(sourceFromSticker),
    ...asArray(suzuriDesigns).slice(0,20).map(sourceFromSuzuri),
    ...asArray(free).filter(x=>x?.status==="published").sort((a,b)=>String(b.publishedAt||"").localeCompare(String(a.publishedAt||""))).slice(0,20).map(sourceFromFree),
    ...tools,
    ...commits,
    ...asArray(news).map(normalizeSource),
  ];
  return [...new Map(direct.filter(x=>x.id).map(x=>[x.id,x])).values()]
    .sort((a,b)=>`${b.date}${b.generatedAt}`.localeCompare(`${a.date}${a.generatedAt}`));
}

function recentSources(all, drafts) {
  const used=new Set(asArray(drafts).flatMap(d=>asArray(d.sourceIds)));
  const cutoff=Date.now()-7*86400000;
  return asArray(all).filter(s=>{
    if(!s?.id||used.has(s.id)) return false;
    const t=Date.parse(s.generatedAt||s.date||"");
    return Number.isNaN(t)||t>=cutoff;
  }).slice(0,14);
}

async function generateWithAi(items) {
  if(!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
  const source=items.map((x,i)=>({n:i+1,id:x.id,type:x.type,label:x.label,date:x.date,title:x.title,lead:x.lead,body:x.body,url:x.url}));
  const prompt=`あなたは個人クリエイター「stamp moke」のnote編集者です。以下は実際にstamp-moke.jp周辺で発生した最近の更新です。\n\n目的:\n- 毎日無理に記事を作らず、noteに書く価値がある日だけ記事候補を作る。\n- AIっぽく綺麗にまとめすぎない。実際にやったこと、なぜやったか、迷い、気づき、次にどうするかを中心にする。\n- 入力にない事実、数字、感情、成果、背景を創作しない。\n- GitHubの技術的なコミット文は、そのまま技術解説にせず「サイトをこう改善した」という制作日記の材料として扱う。\n- 小さな更新が複数ある場合は、共通テーマがあれば1本にまとめてよい。\n- 一般論の水増しは禁止。\n- 文体は少しフランクで、個人の開発日記・制作日記として自然に。\n\n判定:\n- scoreは0〜100。55未満ならpublishCandidate=false。\n- 55以上でも、同じテーマの焼き直しなら低く評価。\n- publishCandidate=trueなら本文は700〜1600字程度。\n\n出力はJSONのみ:\n{"publishCandidate":true,"score":0,"rationale":"","sourceIds":[],"titleOptions":["","",""],"body":"","tags":[],"imagePrompt":"","socialPost":""}\n\n最近の更新:\n${JSON.stringify(source,null,2)}`;
  const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.NOTE_AI_MODEL||process.env.NEWS_AI_MODEL||"gpt-5.6-luna",input:prompt})});
  if(!response.ok) throw new Error(`OpenAI API failed: ${response.status}`);
  const raw=parseText(await response.json()).trim().replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/i,"");
  return JSON.parse(raw);
}

async function generateDaily({force=false}={}) {
  const today=jstDate();
  let existing=asArray(await r2GetJson(DRAFT_KEY,[]).catch(()=>[])).map(normalizeDraft);
  const todayIndex=existing.findIndex(d=>d.date===today);
  const todayDraft=todayIndex>=0?existing[todayIndex]:null;
  const all=await collectSources();
  const candidates=recentSources(all,existing.filter((_,i)=>i!==todayIndex));
  if(todayDraft && !force){
    const prior=new Set(todayDraft.sourceIds||[]);
    const hasNew=candidates.some(x=>!prior.has(x.id));
    if(todayDraft.status!=="skipped" || !hasNew) return {created:false,draft:todayDraft,reason:"already-generated-today"};
  }
  if(todayIndex>=0) existing=existing.filter((_,i)=>i!==todayIndex);
  if(!candidates.length){
    const skipped=normalizeDraft({id:`note:${today}`,date:today,status:"skipped",score:0,rationale:"新しい更新が見つからなかったため、今日は記事候補を作成しませんでした。",sourceIds:[],sourceItems:[],createdAt:todayDraft?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()});
    await r2PutJson(DRAFT_KEY,[skipped,...existing].slice(0,MAX_DRAFTS));
    return {created:true,draft:skipped,reason:"no-new-updates"};
  }
  const ai=await generateWithAi(candidates);
  const selectedIds=asArray(ai.sourceIds).map(clean).filter(Boolean);
  const selectedItems=candidates.filter(x=>selectedIds.includes(x.id));
  const publishCandidate=Boolean(ai.publishCandidate)&&Number(ai.score||0)>=55;
  const titleOptions=asArray(ai.titleOptions).map(clean).filter(Boolean).slice(0,3);
  const draft=normalizeDraft({id:`note:${today}`,date:today,status:publishCandidate?"draft":"skipped",score:Math.max(0,Math.min(100,Number(ai.score||0))),rationale:ai.rationale,sourceIds:selectedIds,sourceItems:selectedItems,titleOptions,title:titleOptions[0]||"",body:publishCandidate?ai.body:"",tags:publishCandidate?ai.tags:[],imagePrompt:publishCandidate?ai.imagePrompt:"",socialPost:publishCandidate?ai.socialPost:"",createdAt:todayDraft?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()});
  await r2PutJson(DRAFT_KEY,[draft,...existing].slice(0,MAX_DRAFTS));
  return {created:true,draft,reason:publishCandidate?"draft-created":"low-value-skip"};
}

async function updateStatus(id,status){const allowed=new Set(["draft","published","skipped"]);if(!allowed.has(status))throw new Error("Invalid status");const list=asArray(await r2GetJson(DRAFT_KEY,[]).catch(()=>[])).map(normalizeDraft);const i=list.findIndex(d=>d.id===id);if(i<0)throw new Error("Draft not found");list[i]=normalizeDraft({...list[i],status,updatedAt:new Date().toISOString()});await r2PutJson(DRAFT_KEY,list);return list[i]}

export default async function handler(req,res){
  try{
    const auth=getAuth(req); if(!auth.configured)return res.status(503).json({error:"CRON_SECRET or NOTE_DRAFT_ADMIN_KEY is not configured"});
    if(req.method==="GET"){
      const action=clean(req.query?.action||"list");
      if(action==="generate"){if(!auth.cron&&!auth.admin)return res.status(401).json({error:"Unauthorized"});const result=await generateDaily({force:String(req.query?.force||"")==="1"});return res.status(200).json({ok:true,created:result.created,status:result.draft?.status,score:result.draft?.score,reason:result.reason})}
      if(!auth.admin)return res.status(401).json({error:"Unauthorized"});
      const limit=Math.min(Math.max(Number(req.query?.limit||30),1),MAX_DRAFTS);const list=asArray(await r2GetJson(DRAFT_KEY,[]).catch(()=>[])).map(normalizeDraft);res.setHeader("Cache-Control","private, no-store");return res.status(200).json({items:list.slice(0,limit)});
    }
    if(req.method==="POST"){
      if(!auth.admin)return res.status(401).json({error:"Unauthorized"});const body=typeof req.body==="string"?JSON.parse(req.body||"{}"):req.body||{};const action=clean(body.action);
      if(action==="generate")return res.status(200).json({ok:true,...(await generateDaily({force:Boolean(body.force)}))});
      if(action==="status")return res.status(200).json({ok:true,item:await updateStatus(clean(body.id),clean(body.status))});
      return res.status(400).json({error:"Unknown action"});
    }
    return res.status(405).json({error:"Method not allowed"});
  }catch(error){console.error("note drafts api failed",error);return res.status(500).json({error:error instanceof Error?error.message:String(error)})}
}
