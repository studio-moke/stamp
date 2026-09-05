import fs from "node:fs";
import path from "node:path";

const dist=path.join(process.cwd(),"dist");
const locales=["ja","en","zh-tw","zh-cn","ko","th","id"];
const failures=[];

function walk(dir){
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    const full=path.join(dir,entry.name);
    return entry.isDirectory()?walk(full):[full];
  });
}
function targetExists(urlPath){
  const clean=decodeURI(urlPath).replace(/^\//,"");
  const direct=path.join(dist,clean);
  if(fs.existsSync(direct)&&fs.statSync(direct).isFile()) return true;
  return fs.existsSync(path.join(direct,"index.html"));
}

for(const locale of locales){
  const prefix=locale==="ja"?"":`/${locale}`;
  const listPath=`${prefix}/stickers/`;
  const homeFile=path.join(dist,prefix.replace(/^\//,""),"index.html");
  if(!targetExists(listPath)) failures.push(`missing collection page: ${listPath}`);
  if(fs.existsSync(homeFile)){
    const home=fs.readFileSync(homeFile,"utf8");
    if(!home.includes(`href="${listPath}"`)) failures.push(`home does not link to localized collection: ${prefix||"/"} -> ${listPath}`);
  }
}

if(fs.existsSync(dist)){
  for(const file of walk(dist).filter(file=>file.endsWith(".html"))){
    const html=fs.readFileSync(file,"utf8");
    for(const match of html.matchAll(/href=["']([^"']+)["']/g)){
      const href=match[1];
      if(href.startsWith("//")){
        failures.push(`double-slash href in ${path.relative(dist,file)}: ${href}`);
        continue;
      }
      if(!href.startsWith("/")||!href.includes("/stickers")) continue;
      const pathname=href.split(/[?#]/)[0];
      if(pathname.includes("//")) failures.push(`double-slash sticker href in ${path.relative(dist,file)}: ${href}`);
      else if(!targetExists(pathname)) failures.push(`broken sticker href in ${path.relative(dist,file)}: ${href}`);
    }
  }
}

if(failures.length){
  console.error("Sticker link check failed:");
  failures.slice(0,100).forEach(item=>console.error(`- ${item}`));
  if(failures.length>100) console.error(`...and ${failures.length-100} more`);
  process.exit(1);
}
console.log("Sticker link check passed for all locales; localized home links are valid and no double-slash sticker links were found.");
