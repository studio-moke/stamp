import crypto from "node:crypto";
import { presignR2Put, r2Configured, r2GetBuffer, r2GetJson, r2Key, r2PutJson } from "./_r2.js";

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
function cleanHash(value = "") { const v=String(value).toLowerCase().replace(/[^a-f0-9]/g,""); return v.length===64?v:""; }
function extFor(contentType = "") { if(/webp/i.test(contentType))return ".webp"; if(/jpe?g/i.test(contentType))return ".jpg"; return ".png"; }
function publicCode(){return crypto.randomBytes(6).toString("hex")}
function hashKey(hash){return `free-assets/hashes/${hash}.json`}
async function readIndex(){const value=await r2GetJson(INDEX_KEY,[]);return Array.isArray(value)?value:[]}
async function writeIndex(list){return r2PutJson(INDEX_KEY,list.slice(0,5000))}
async function listAssets(limit=250){const index=await readIndex();return index.filter(x=>x?.status==="published").sort((a,b)=>String(b.publishedAt).localeCompare(String(a.publishedAt))).slice(0,Math.min(Math.max(limit,1),5000))}
async function findBySlug(slug){return r2GetJson(`free-assets/meta/${slug}.json`,null)}
async function persistRecord(record){await r2PutJson(`free-assets/meta/${record.slug}.json`,record);const index=await readIndex();const next=record.status==="published"?[record,...index.filter(x=>x?.slug!==record.slug)]:index.filter(x=>x?.slug!==record.slug);await writeIndex(next)}

const localeSchema={
  type:"object",
  additionalProperties:false,
  required:["title","description","seoTitle","metaDescription","alt","keywords"],
  properties:{
    title:{type:"string"},description:{type:"string"},seoTitle:{type:"string"},metaDescription:{type:"string"},alt:{type:"string"},
    keywords:{type:"array",items:{type:"string"}}
  }
};
const metadataSchema={
  type:"object",
  additionalProperties:false,
  required:["slug","platforms","types","motifs","styles","character","transparent","locales"],
  properties:{
    slug:{type:"string"},
    platforms:{type:"array",items:{type:"string",enum:MASTER.platforms}},
    types:{type:"array",items:{type:"string",enum:MASTER.types}},
    motifs:{type:"array",items:{type:"string",enum:MASTER.motifs}},
    styles:{type:"array",items:{type:"string",enum:MASTER.styles}},
    character:{type:"string"},
    transparent:{type:"boolean"},
    locales:{type:"object",additionalProperties:false,required:LOCALES,properties:Object.fromEntries(LOCALES.map(locale=>[locale,localeSchema]))}
  }
};
async function analyzeWithOpenAI(input){
  if(!process.env.OPENAI_API_KEY)throw new Error("OPENAI_API_KEY is not configured");
  if(!input.previewKey)throw new Error("previewKey is required");
  const preview=await r2GetBuffer(input.previewKey);if(!preview)throw new Error("AI解析用プレビューが見つかりません");
  const imageDataUrl=`data:${preview.contentType};base64,${preview.buffer.toString("base64")}`;
  const instruction=`You create accurate SEO metadata for stamp-moke.jp free illustration/photo assets.\nUse only the controlled vocabularies allowed by the schema.\nUsage policy: personal/non-commercial use only. Good uses include Pokekara and social media profiles/posts, personal flyers, school/circle/non-commercial print. Commercial use, resale, redistribution and claiming authorship are prohibited. Copyright belongs to stamp-moke.jp.\nDescriptions must describe only what is visible. Do not invent a character name. SEO copy must be natural and useful.`;
  const response=await fetch("https://api.openai.com/v1/responses",{
    method:"POST",
    headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},
    body:JSON.stringify({
      model:process.env.FREE_ASSET_AI_MODEL||"gpt-5.6-luna",
      input:[{role:"user",content:[
        {type:"input_text",text:`${instruction}\n\nFilename: ${input.filename||"unknown"}\nSize: ${input.width||"?"}x${input.height||"?"}\nPlatform hint: ${input.platformHint||"none"}\nCharacter hint: ${input.characterHint||"none"}`},
        {type:"input_image",image_url:imageDataUrl}
      ]}],
      text:{format:{type:"json_schema",name:"free_asset_metadata",strict:true,schema:metadataSchema}}
    })
  });
  if(!response.ok)throw new Error(`OpenAI ${response.status}: ${await response.text()}`);
  const data=await response.json();
  const text=data.output_text||data.output?.flatMap(o=>o.content||[]).find(c=>c.type==="output_text")?.text;
  if(!text)throw new Error("AI returned no metadata");
  try{return JSON.parse(text)}catch(error){console.error("structured metadata parse failed",text,error);throw new Error("AI解析結果のJSONを読み込めませんでした。")}
}
function normalizeLocales(locales={}){return Object.fromEntries(LOCALES.map(locale=>{const v=locales?.[locale]||{};return[locale,{title:String(v.title||"").slice(0,120),description:String(v.description||"").slice(0,700),seoTitle:String(v.seoTitle||"").slice(0,160),metaDescription:String(v.metaDescription||"").slice(0,320),alt:String(v.alt||"").slice(0,180),keywords:[...new Set((Array.isArray(v.keywords)?v.keywords:[]).map(String).map(x=>x.trim()).filter(Boolean))].slice(0,30)}]}))}
function normalizeMetadata(raw,fallback={}){const locales=normalizeLocales(raw?.locales||fallback.locales||{});const jaTitle=locales.ja.title||fallback.filename?.replace(/\.[^.]+$/,"")||"無料素材";return{slug:slugify(raw?.slug||fallback.slug||jaTitle),platforms:safeArray(raw?.platforms??fallback.platforms,MASTER.platforms),types:safeArray(raw?.types??fallback.types,MASTER.types),motifs:safeArray(raw?.motifs??fallback.motifs,MASTER.motifs),styles:safeArray(raw?.styles??fallback.styles,MASTER.styles),character:String(raw?.character??fallback.characterHint??fallback.character??"").slice(0,60),transparent:Boolean(raw?.transparent??fallback.transparent),locales}}
function cookieSecret(){return process.env.FREE_DOWNLOAD_SECRET||process.env.FREE_ADMIN_TOKEN||""}function sign(value){return crypto.createHmac("sha256",cookieSecret()).update(value).digest("base64url")}function parseCookies(header=""){return Object.fromEntries(header.split(";").map(part=>part.trim()).filter(Boolean).map(part=>{const i=part.indexOf("=");return[part.slice(0,i),decodeURIComponent(part.slice(i+1))]}))}function getDownloadState(req){const today=new Date().toISOString().slice(0,10);const raw=parseCookies(req.headers.cookie||"").sm_free_dl;if(!raw||!cookieSecret())return{day:today,count:0};const i=raw.lastIndexOf(".");if(i<0)return{day:today,count:0};const payload=raw.slice(0,i),sig=raw.slice(i+1);if(sign(payload)!==sig)return{day:today,count:0};try{const state=JSON.parse(Buffer.from(payload,"base64url").toString("utf8"));return state.day===today?state:{day:today,count:0}}catch{return{day:today,count:0}}}function setDownloadState(res,state){if(!cookieSecret())return;const payload=Buffer.from(JSON.stringify(state),"utf8").toString("base64url");res.setHeader("Set-Cookie",`sm_free_dl=${payload}.${sign(payload)}; Path=/; Max-Age=86400; Secure; HttpOnly; SameSite=Lax`)}function runtimeRateAllowed(req){const ip=String(req.headers["x-forwarded-for"]||req.socket?.remoteAddress||"unknown").split(",")[0].trim();const hour=new Date().toISOString().slice(0,13);const key=`${ip}:${hour}`;const next=(runtimeRate.get(key)||0)+1;runtimeRate.set(key,next);if(runtimeRate.size>2000)runtimeRate.clear();return next<=DOWNLOADS_PER_HOUR_PER_RUNTIME}
export default async function handler(req,res){try{
  if(req.method==="GET"){
    const action=String(req.query.action||"list");
    if(action==="list"){const assets=await listAssets(Number(req.query.limit||500));res.setHeader("Cache-Control","public, s-maxage=120, stale-while-revalidate=600");return json(res,200,{assets})}
    if(action==="detail"){const asset=await findBySlug(slugify(req.query.slug||""));if(!asset||asset.status!=="published")return json(res,404,{error:"Not found"});return json(res,200,{asset})}
    if(action==="download"){
      if(String(req.query.agree||"")!=="1")return json(res,400,{error:"Terms agreement required"});
      if(!runtimeRateAllowed(req))return json(res,429,{error:"Too many downloads. Please try again later."});
      const state=getDownloadState(req);if(state.count>=DOWNLOADS_PER_DAY)return json(res,429,{error:`Daily download limit (${DOWNLOADS_PER_DAY}) reached.`});
      const asset=await findBySlug(slugify(req.query.slug||""));if(!asset||asset.status!=="published")return json(res,404,{error:"Not found"});
      const file=await r2GetBuffer(asset.originalKey);if(!file)return json(res,404,{error:"Original file not found"});
      setDownloadState(res,{day:state.day,count:state.count+1});const updated={...asset,downloads:Number(asset.downloads||0)+1,updatedAt:new Date().toISOString()};await persistRecord(updated).catch(error=>console.error("download count update failed",error));
      const filename=`stamp-moke-${asset.publicCode||String(asset.id||"").replace(/-/g,"").slice(0,12)||publicCode()}${extFor(asset.contentType||file.contentType)}`;
      res.setHeader("Cache-Control","private, no-store");res.setHeader("Content-Type",asset.contentType||file.contentType);res.setHeader("X-Content-Type-Options","nosniff");res.setHeader("Content-Disposition",`attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);res.end(file.buffer);return;
    }
    return json(res,400,{error:"Unknown action"});
  }
  if(req.method==="POST"){
    if(!isAdmin(req))return json(res,401,{error:"管理トークンが一致しません。FREE_ADMIN_TOKEN を確認してください。"});
    const action=String(req.query.action||req.body?.action||"");
    if(action==="health"){const checks={adminToken:true,...r2Configured(),openaiApiKey:Boolean(process.env.OPENAI_API_KEY)};const missing=Object.entries(checks).filter(([,ok])=>!ok).map(([name])=>name);if(missing.length)return json(res,500,{error:`環境設定不足: ${missing.join(", ")}`,checks});return json(res,200,{ok:true,checks,storage:"cloudflare-r2"})}
    if(action==="duplicate"){const hash=cleanHash(req.body?.contentHash||"");if(!hash)return json(res,400,{error:"Invalid content hash"});const existing=await r2GetJson(hashKey(hash),null);return json(res,200,{duplicate:Boolean(existing),asset:existing||null})}
    if(action==="upload-url"){const role=String(req.body?.role||"");if(!["preview","thumb","original"].includes(role))return json(res,400,{error:"Invalid role"});const ext=extFor(req.body?.contentType||"");const anonymous=`asset-${crypto.randomUUID()}${role==="thumb"?".webp":ext}`;const folder=role==="preview"?"previews":role==="thumb"?"thumbs":"originals";const key=r2Key(`free-assets/${folder}`,anonymous);return json(res,200,{key,uploadUrl:presignR2Put(key,900)})}
    if(action==="analyze"){const ai=await analyzeWithOpenAI(req.body||{});return json(res,200,{metadata:normalizeMetadata(ai,req.body||{})})}
    if(action==="admin-list")return json(res,200,{assets:await listAssets(5000)});
    if(action==="publish"){const body=req.body||{};const meta=normalizeMetadata(body.metadata||{},body);if(!body.originalKey||!body.previewKey)return json(res,400,{error:"originalKey and previewKey are required"});const now=new Date().toISOString(),id=body.id||crypto.randomUUID(),code=body.publicCode||publicCode(),hash=cleanHash(body.contentHash||"");const record={...meta,id,publicCode:code,originalKey:body.originalKey,previewKey:body.previewKey,thumbKey:body.thumbKey||"",contentHash:hash,width:Number(body.width||0),height:Number(body.height||0),contentType:body.contentType||"image/png",license:"personal-noncommercial",copyright:"© stamp-moke.jp",downloads:Number(body.downloads||0),status:"published",publishedAt:body.publishedAt||now,updatedAt:now,canonicalUrl:`${SITE_URL}/free/${encodeURIComponent(meta.slug)}`};await persistRecord(record);if(hash)await r2PutJson(hashKey(hash),{slug:record.slug,id:record.id,title:record.locales?.ja?.title||""});return json(res,200,{asset:record})}
    if(action==="attach-thumb"){const slug=slugify(req.body?.slug||"");const thumbKey=String(req.body?.thumbKey||"");if(!thumbKey.startsWith("free-assets/thumbs/"))return json(res,400,{error:"Invalid thumbKey"});const current=await findBySlug(slug);if(!current)return json(res,404,{error:"Not found"});const updated={...current,thumbKey,updatedAt:new Date().toISOString()};await persistRecord(updated);return json(res,200,{asset:updated})}
    if(action==="update"){const slug=slugify(req.body?.slug||"");const current=await findBySlug(slug);if(!current)return json(res,404,{error:"Not found"});const patch=req.body?.patch||{},locales=normalizeLocales({...current.locales,...(patch.locales||{})});const updated={...current,platforms:safeArray(patch.platforms??current.platforms,MASTER.platforms),types:safeArray(patch.types??current.types,MASTER.types),motifs:safeArray(patch.motifs??current.motifs,MASTER.motifs),styles:safeArray(patch.styles??current.styles,MASTER.styles),character:String(patch.character??current.character??"").slice(0,60),locales,status:patch.status==="draft"?"draft":"published",updatedAt:new Date().toISOString()};await persistRecord(updated);return json(res,200,{asset:updated})}
    if(action==="delete"){const slug=slugify(req.body?.slug||"");const current=await findBySlug(slug);if(!current)return json(res,404,{error:"Not found"});await persistRecord({...current,status:"deleted",updatedAt:new Date().toISOString()});return json(res,200,{ok:true})}
    return json(res,400,{error:"Unknown action"});
  }
  return json(res,405,{error:"Method not allowed"});
}catch(error){console.error("free-assets error",error);return json(res,500,{error:error instanceof Error?error.message:String(error)})}}
