import crypto from "node:crypto";
import { r2GetJson, r2PutJson } from "./_r2.js";

const LOCALES=["ja","en","zh-tw","th","id"];
const key=id=>`sticker-seo/${String(id).replace(/[^0-9]/g,"")}.json`;
const INDEX_KEY="sticker-seo/index.json";
const json=(res,status,payload)=>res.status(status).json(payload);
function safeHexEqual(a="",b=""){if(!/^[a-f0-9]{64}$/i.test(a)||!/^[a-f0-9]{64}$/i.test(b))return false;const aa=Buffer.from(a,"hex"),bb=Buffer.from(b,"hex");return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb)}
function isSignedBatch(req,id){const secret=process.env.R2_SECRET_ACCESS_KEY;const ts=String(req.headers["x-sticker-seo-timestamp"]||"");const sig=String(req.headers["x-sticker-seo-signature"]||"");const n=Number(ts);if(!secret||!Number.isFinite(n)||Math.abs(Date.now()-n)>300000)return false;const expected=crypto.createHmac("sha256",secret).update(`sticker-seo:${id}:${ts}`).digest("hex");return safeHexEqual(sig,expected)}
const isAdmin=(req,id)=>Boolean(process.env.FREE_ADMIN_TOKEN&&req.headers["x-admin-token"]===process.env.FREE_ADMIN_TOKEN)||isSignedBatch(req,id);
function stripFence(v=""){return String(v).trim().replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/i,"")}
function parseJson(v=""){const raw=stripFence(v);try{return JSON.parse(raw)}catch{}const a=raw.indexOf("{"),b=raw.lastIndexOf("}");if(a>=0&&b>a){try{return JSON.parse(raw.slice(a,b+1).replace(/,\s*([}\]])/g,"$1"))}catch{}}return null}
function cleanLocale(v={}){return{seoTitle:String(v.seoTitle||"").slice(0,90),pageDescription:String(v.pageDescription||"").slice(0,420),overview:String(v.overview||"").slice(0,3200),target:String(v.target||"").slice(0,1000),concept:String(v.concept||"").slice(0,1000),usageIntro:String(v.usageIntro||"").slice(0,900),uses:[...new Set((Array.isArray(v.uses)?v.uses:[]).map(String).map(x=>x.trim()).filter(Boolean))].slice(0,14),relationships:[...new Set((Array.isArray(v.relationships)?v.relationships:[]).map(String).map(x=>x.trim()).filter(Boolean))].slice(0,12),keywords:[...new Set((Array.isArray(v.keywords)?v.keywords:[]).map(String).map(x=>x.trim()).filter(Boolean))].slice(0,55),metaDescription:String(v.metaDescription||"").slice(0,180)}}
function normalize(raw={},input={}){const locales={};for(const locale of LOCALES)locales[locale]=cleanLocale(raw?.locales?.[locale]||{});return{id:String(input.id||""),version:3,sourceTitle:String(input.title||""),sourceDescription:String(input.description||""),generatedAt:new Date().toISOString(),locales}}
function searchable(record){return{id:record.id,version:record.version,sourceTitle:record.sourceTitle,generatedAt:record.generatedAt,locales:Object.fromEntries(LOCALES.map(locale=>{const v=record.locales?.[locale]||{};return[locale,{seoTitle:v.seoTitle||"",pageDescription:v.pageDescription||"",metaDescription:v.metaDescription||"",overview:v.overview||"",target:v.target||"",concept:v.concept||"",usageIntro:v.usageIntro||"",uses:v.uses||[],relationships:v.relationships||[],keywords:v.keywords||[]}]}))}}
async function updateIndex(record){const current=await r2GetJson(INDEX_KEY,[]);const list=Array.isArray(current)?current:[];const next=[searchable(record),...list.filter(x=>String(x?.id)!==String(record.id))].slice(0,5000);await r2PutJson(INDEX_KEY,next)}
async function callOpenAI(input,extra=""){
 const instruction=`You are the senior SEO/content editor for stamp-moke.jp, a LINE sticker discovery site. Analyze one real sticker set only from the supplied title, official LINE STORE description, category and detected phrases. Never invent unsupported characters, phrases, demographics, visual details, popularity or sales claims.

The official LINE STORE description is source material only. Do not merely paraphrase or pad it. Create an original, people-first introduction that helps a visitor decide whether the sticker fits their conversations.

For EACH locale ja,en,zh-tw,th,id, return only:
- seoTitle: concise search title based only on supported facts.
- pageDescription: the on-page introduction that will replace the existing short description without changing layout or adding sections. For Japanese, aim for about 140-260 Japanese characters when the source supports it. Include 2-4 concrete, supported dimensions among: who may use it, relationship, likely conversation situations, communication/emotional job, tone/personality, and what distinguishes the set. Do not repeat the official description sentence-by-sentence. Do not keyword-stuff.
- metaDescription: a natural search-result description around 100-150 Japanese characters / locale-equivalent, consistent with pageDescription.

Write each locale for native searchers rather than literal translation. Preserve actual Japanese sticker phrases when useful. Return strictly one JSON object only with shape {"locales":{"ja":{"seoTitle":"","pageDescription":"","metaDescription":""},"en":{},"zh-tw":{},"th":{},"id":{}}}.`;
 const bodyText=`${instruction}\n\nSticker ID: ${input.id}\nTitle: ${input.title}\nLINE STORE description: ${input.description||""}\nCategory: ${input.category||""}\nDetected phrases: ${(input.phrases||[]).join(" / ")||"none"}${extra?`\n\n${extra}`:""}`;
 const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.STICKER_SEO_AI_MODEL||process.env.FREE_ASSET_AI_MODEL||"gpt-5.6-luna",input:bodyText})});
 if(!response.ok)throw new Error(`OpenAI ${response.status}: ${await response.text()}`);
 const data=await response.json();const text=data.output_text||data.output?.flatMap(o=>o.content||[]).find(c=>c.type==="output_text")?.text;if(!text)throw new Error("AI returned no SEO content");return parseJson(text)
}
async function generate(input){let raw=await callOpenAI(input);if(!raw)raw=await callOpenAI(input,"The previous response was invalid JSON. Return the same analysis as strictly valid JSON only.");if(!raw)throw new Error("GPT SEO JSON generation failed twice");return normalize(raw,input)}
export default async function handler(req,res){try{
 const id=String(req.query.id||req.body?.id||"").replace(/[^0-9]/g,"");if(!id)return json(res,400,{error:"Sticker ID is required"});
 if(req.method==="GET"){const record=await r2GetJson(key(id),null);if(!record)return json(res,404,{error:"Not generated"});res.setHeader("Cache-Control","public, s-maxage=300, stale-while-revalidate=1800");return json(res,200,{record})}
 if(req.method!=="POST")return json(res,405,{error:"Method not allowed"});if(!isAdmin(req,id))return json(res,401,{error:"管理トークンが一致しません。"});if(!process.env.OPENAI_API_KEY)return json(res,500,{error:"OPENAI_API_KEY is not configured"});
 const force=Boolean(req.body?.force),existing=await r2GetJson(key(id),null);if(existing&&!force&&Number(existing.version||0)>=3){await updateIndex(existing).catch(()=>{});return json(res,200,{record:existing,skipped:true});}
 const record=await generate({...req.body,id});await r2PutJson(key(id),record);await updateIndex(record);return json(res,200,{record,skipped:false});
}catch(error){console.error("sticker-seo",error);return json(res,500,{error:error instanceof Error?error.message:String(error)})}}
