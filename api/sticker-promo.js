import fs from "node:fs";
import path from "node:path";

function loadStickers(){
  try{
    const file=path.join(process.cwd(),"src","data","stickers.json");
    const raw=fs.readFileSync(file,"utf8");
    const parsed=JSON.parse(raw);
    return Array.isArray(parsed)?parsed:[];
  }catch(error){
    console.error("sticker promo data load failed",error);
    return [];
  }
}

export default function handler(req,res){
  const stickers=loadStickers();
  const rows=stickers.slice(0,80).map(s=>({
    id:String(s.id||""),
    title:String(s.title||"").replace(/\s*-\s*LINE\s*スタンプ.*$/i,"").replace(/\s*\|\s*LINE STORE.*$/i,"").trim(),
    description:String(s.description||"").trim(),
    image:String(s.image||""),
  })).filter(x=>x.id&&x.image);
  res.setHeader("Cache-Control","public, s-maxage=3600, stale-while-revalidate=86400");
  res.setHeader("Content-Type","application/json; charset=utf-8");
  return res.status(200).json({items:rows});
}
