import fs from "node:fs/promises";
import path from "node:path";

const ROOT=path.resolve("dist"),SITE="https://stamp-moke.jp";
const targets={"zh-cn":"zh-Hans-CN",ko:"ko"};
const sourceFor={"zh-cn":"zh-tw",ko:"en"};
const requiredHreflang=["ja","en","zh-Hant-TW","zh-Hans-CN","ko","th","id","x-default"];
const errors=[];

async function exists(file){try{await fs.access(file);return true}catch{return false}}
async function walk(dir){const out=[];for(const e of await fs.readdir(dir,{withFileTypes:true}).catch(()=>[])){const f=path.join(dir,e.name);if(e.isDirectory())out.push(...await walk(f));else if(e.isFile()&&e.name==="index.html")out.push(f)}return out}
const rel=f=>path.relative(ROOT,f).replaceAll(path.sep,"/");
const expectedUrl=(locale,file)=>{const r=rel(file).split("/").slice(1).join("/").replace(/index\.html$/,"");return `${SITE}/${locale}/${r}`};
const canonical=html=>{const m=html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)||html.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i);return m?.[1]||""};
function noindex(html){return /<meta\b[^>]*name=["'](?:robots|googlebot)["'][^>]*content=["'][^"']*noindex/i.test(html)}
function escapeRe(value){return String(value).replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}

for(const [locale,lang] of Object.entries(targets)){
 const root=path.join(ROOT,locale);if(!(await exists(root))){errors.push(`missing locale output: ${locale}`);continue}
 const files=await walk(root);if(!files.length)errors.push(`no HTML output for ${locale}`);
 for(const file of files){
  const html=await fs.readFile(file,"utf8"),r=rel(file),want=expectedUrl(locale,file),got=canonical(html);
  if(!new RegExp(`<html\\b[^>]*lang=["']${escapeRe(lang)}["']`,`i`).test(html))errors.push(`${r}: wrong html lang`);
  if(got!==want)errors.push(`${r}: canonical mismatch (${got||"missing"} != ${want})`);
  if(got.includes(`/${sourceFor[locale]}/`))errors.push(`${r}: canonical points to source locale`);
  if(/\/\//.test(new URL(want).pathname))errors.push(`${r}: double slash`);
  if(!want.endsWith("/"))errors.push(`${r}: expected URL missing trailing slash`);
  if(!noindex(html)){
   for(const hreflang of requiredHreflang){if(!new RegExp(`hreflang=["']${escapeRe(hreflang)}["']`,`i`).test(html))errors.push(`${r}: missing hreflang ${hreflang}`)}
  }
  if(locale==="zh-cn"&&/<html\b[^>]*lang=["'](?:ja|zh-Hant|zh-tw)/i.test(html))errors.push(`${r}: source language leaked to html lang`);
  if(locale==="ko"&&/<html\b[^>]*lang=["'](?:ja|en)["']/i.test(html))errors.push(`${r}: source language leaked to html lang`);
 }
}

for(const [target,source] of Object.entries(sourceFor)){
 const sourceRoot=path.join(ROOT,source),targetRoot=path.join(ROOT,target);
 for(const file of await walk(sourceRoot)){
  const relative=path.relative(sourceRoot,file);
  if(relative.startsWith(`tags${path.sep}`)&&relative!==path.join("tags","index.html"))continue;
  const counterpart=path.join(targetRoot,relative);
  if(!(await exists(counterpart)))errors.push(`${target}: missing counterpart for ${source}/${relative.replaceAll(path.sep,"/")}`);
 }
}

for(const locale of Object.keys(targets)){
 for(const priority of ["index.html","stickers/index.html","tags/index.html","categories/index.html","search/index.html","free/index.html","tools/index.html","news/index.html"]){
  const file=path.join(ROOT,locale,priority);if(!(await exists(file)))errors.push(`${locale}: missing priority page ${priority}`);
 }
}

if(errors.length){console.error(`[i18n-audit] ${errors.length} problem(s)`);for(const e of errors.slice(0,150))console.error(` - ${e}`);if(errors.length>150)console.error(` - ... ${errors.length-150} more`);process.exit(1)}
console.log("[i18n-audit] zh-cn/ko route parity, lang, canonical, trailing slash and hreflang validation passed");
