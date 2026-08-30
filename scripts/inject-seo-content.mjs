import fs from "node:fs/promises";
import path from "node:path";
import { r2GetJson } from "../api/_r2.js";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const LOCALES = ["ja", "en", "zh-tw", "th", "id"];
const localeFromPath = (file) => {
  const rel = path.relative(DIST, file).replaceAll("\\", "/");
  const first = rel.split("/")[0];
  return LOCALES.includes(first) && first !== "ja" ? first : "ja";
};
const esc = (value = "") => String(value).replace(/[&<>\"]/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const metaEsc = (value = "") => esc(String(value).replace(/\s+/g, " ").trim());

async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else if (entry.isFile() && entry.name === "index.html") out.push(full);
  }
  return out;
}

function paragraphs(text = "") {
  const chunks = String(text).split(/\n{2,}|(?<=[。！？.!?])\s+(?=[^\s])/).map((s) => s.trim()).filter(Boolean);
  if (!chunks.length) return "";
  const grouped = [];
  let current = "";
  for (const chunk of chunks) {
    current += (current ? " " : "") + chunk;
    if (current.length >= 180) { grouped.push(current); current = ""; }
  }
  if (current) grouped.push(current);
  return grouped.map((p) => `<p>${esc(p)}</p>`).join("");
}

function replaceMeta(html, name, value) {
  if (!value) return html;
  const re = new RegExp(`<meta\\s+name=["']${name}["'][^>]*>`, "i");
  const tag = `<meta name="${name}" content="${metaEsc(value)}">`;
  return re.test(html) ? html.replace(re, tag) : html.replace("</head>", `${tag}</head>`);
}
function replaceProperty(html, property, value) {
  if (!value) return html;
  const re = new RegExp(`<meta\\s+property=["']${property}["'][^>]*>`, "i");
  const tag = `<meta property="${property}" content="${metaEsc(value)}">`;
  return re.test(html) ? html.replace(re, tag) : html.replace("</head>", `${tag}</head>`);
}

function stickerSection(local, locale) {
  const copy = {
    ja:{label:"STICKER GUIDE",about:"このLINEスタンプについて",target:"こんな人におすすめ",concept:"コンセプトと使いどころ",uses:"こんな場面で使えます",keywords:"関連する検索テーマ"},
    en:{label:"STICKER GUIDE",about:"About this LINE sticker set",target:"Who this set is for",concept:"Concept and communication style",uses:"When to use it",keywords:"Related search themes"},
    "zh-tw":{label:"貼圖指南",about:"這組LINE貼圖的特色",target:"推薦給這些人",concept:"概念與溝通方式",uses:"適合使用的情境",keywords:"相關搜尋主題"},
    th:{label:"STICKER GUIDE",about:"เกี่ยวกับสติกเกอร์ LINE ชุดนี้",target:"เหมาะกับใคร",concept:"คอนเซปต์และการสื่อสาร",uses:"เหมาะใช้ในสถานการณ์",keywords:"หัวข้อค้นหาที่เกี่ยวข้อง"},
    id:{label:"PANDUAN STIKER",about:"Tentang set stiker LINE ini",target:"Cocok untuk siapa",concept:"Konsep dan gaya komunikasi",uses:"Situasi penggunaan",keywords:"Tema pencarian terkait"},
  }[locale] || {};
  const uses = (local.uses || []).map((x) => `<li>${esc(x)}</li>`).join("");
  const keywords = (local.keywords || []).slice(0, 18).map((x) => `<span>${esc(x)}</span>`).join("");
  if (!local.overview && !local.target && !local.concept && !uses) return "";
  return `<section class="sticker-seo-editorial" aria-label="${esc(copy.about)}"><div class="seo-kicker">${esc(copy.label)}</div><h2>${esc(copy.about)}</h2>${paragraphs(local.overview)}${local.target?`<div class="seo-sub"><h3>${esc(copy.target)}</h3>${paragraphs(local.target)}</div>`:""}${local.concept?`<div class="seo-sub"><h3>${esc(copy.concept)}</h3>${paragraphs(local.concept)}</div>`:""}${uses?`<div class="seo-sub"><h3>${esc(copy.uses)}</h3>${local.usageIntro?`<p>${esc(local.usageIntro)}</p>`:""}<ul>${uses}</ul></div>`:""}${keywords?`<div class="seo-sub"><h3>${esc(copy.keywords)}</h3><div class="seo-keywords">${keywords}</div></div>`:""}</section><style>.sticker-seo-editorial{margin-top:28px;background:#fff;border:1px solid #e3e2de;border-radius:20px;padding:30px;color:#222}.sticker-seo-editorial .seo-kicker{font-size:10px;letter-spacing:.18em;color:#777;font-weight:800;margin-bottom:8px}.sticker-seo-editorial h2{margin:0 0 18px;font-size:28px;line-height:1.35}.sticker-seo-editorial h3{margin:0 0 10px;font-size:18px}.sticker-seo-editorial p{margin:0 0 13px;color:#5f5f5f;font-size:13px;line-height:2}.sticker-seo-editorial .seo-sub{margin-top:24px;padding-top:22px;border-top:1px solid #eeeeeb}.sticker-seo-editorial ul{margin:10px 0 0;padding-left:1.35em;color:#5f5f5f;font-size:13px;line-height:1.9}.seo-keywords{display:flex;flex-wrap:wrap;gap:7px}.seo-keywords span{padding:7px 10px;border-radius:999px;background:#f4f3ef;border:1px solid #e6e4dd;font-size:10px;color:#666}@media(max-width:640px){.sticker-seo-editorial{padding:20px;border-radius:16px}.sticker-seo-editorial h2{font-size:23px}.sticker-seo-editorial h3{font-size:16px}}</style>`;
}

async function injectStickerSeo(files) {
  const stickerFiles = files.filter((file) => /(?:^|[\\/])stickers[\\/]\d+[\\/]index\.html$/.test(file));
  const ids = [...new Set(stickerFiles.map((file) => file.match(/[\\/]stickers[\\/](\d+)[\\/]index\.html$/)?.[1]).filter(Boolean))];
  const records = new Map();
  for (const id of ids) {
    try { records.set(id, await r2GetJson(`sticker-seo/${id}.json`, null)); }
    catch (error) { console.warn(`SEO record read skipped for ${id}:`, error?.message || error); }
  }
  let changed = 0;
  for (const file of stickerFiles) {
    const id = file.match(/[\\/]stickers[\\/](\d+)[\\/]index\.html$/)?.[1];
    const record = records.get(id);
    if (!record) continue;
    const locale = localeFromPath(file);
    const local = record.locales?.[locale] || record.locales?.ja || {};
    let html = await fs.readFile(file, "utf8");
    if (local.seoTitle) {
      html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(local.seoTitle)}</title>`);
      html = replaceProperty(html, "og:title", local.seoTitle);
      html = replaceMeta(html, "twitter:title", local.seoTitle);
    }
    if (local.metaDescription) {
      html = replaceMeta(html, "description", local.metaDescription);
      html = replaceProperty(html, "og:description", local.metaDescription);
      html = replaceMeta(html, "twitter:description", local.metaDescription);
    }
    if ((local.keywords || []).length) html = replaceMeta(html, "keywords", local.keywords.join(", "));
    const section = stickerSection(local, locale);
    if (section && !html.includes("sticker-seo-editorial")) html = html.replace("</main>", `${section}</main>`);
    await fs.writeFile(file, html);
    changed++;
  }
  console.log(`Injected GPT sticker SEO into ${changed} static pages.`);
}

async function injectFreeSeo(files) {
  const title = {
    ja:"ポケカラ・MV/PV・SNSに使える無料フリー素材｜画像・サムネ・AIイラスト | stamp moke",
    en:"Free Images & Illustrations for Pokekara, MV/PV, Thumbnails & Social Media | stamp moke",
    "zh-tw":"Pokekara・MV/PV・縮圖可用免費圖片與插畫素材 | stamp moke",
    th:"รูปและภาพประกอบฟรีสำหรับ Pokekara, MV/PV, Thumbnail และโซเชียล | stamp moke",
    id:"Gambar & Ilustrasi Gratis untuk Pokekara, MV/PV, Thumbnail & Media Sosial | stamp moke",
  };
  const desc = {
    ja:"ポケカラの背景画像、SNS投稿、プロフィール、動画サムネ、MV・PV制作などに使いやすい無料フリー素材を配布。AIイラストを含む画像素材を用途別に探せます。個人・非商用利用向けです。",
    en:"Browse free images and illustrations for Pokekara backgrounds, social posts, profiles, video thumbnails and non-commercial MV/PV projects.",
    "zh-tw":"提供Pokekara背景、社群貼文、個人檔案、影片縮圖與非商業MV/PV製作可用的免費圖片與插畫素材。",
    th:"รวมรูปและภาพประกอบฟรีสำหรับพื้นหลัง Pokekara โซเชียล โปรไฟล์ Thumbnail และงาน MV/PV แบบไม่เชิงพาณิชย์",
    id:"Koleksi gambar dan ilustrasi gratis untuk latar Pokekara, media sosial, profil, thumbnail video, serta proyek MV/PV non-komersial.",
  };
  const extraJa = `<section class="free-seo-intro"><h2>ポケカラ・サムネ・MV/PV制作に使える無料画像素材</h2><p>stamp mokeのフリー素材集では、ポケカラの背景やプロフィール画像、SNS投稿、YouTubeなどの動画サムネ、個人制作のMV・PV、学校やサークルの制作物に使いやすい画像・イラスト素材を配布しています。AIで制作したイラストを含め、用途や雰囲気から探せるよう整理しています。</p><p>「無料素材」「フリー素材」「著作権フリー素材」と検索して素材を探している方にも見つけやすい構成ですが、当サイトは著作権を放棄する意味での“著作権フリー”ではありません。著作権はstamp-moke.jpに帰属し、個人・非商用の範囲で無料利用できます。各素材の利用条件を確認したうえで、ポケカラ、サムネイル、MV、PV、SNSなどの制作にご利用ください。</p></section><style>.free-seo-intro{margin:18px 0 26px;background:#fff;border:1px solid #deddd8;border-radius:18px;padding:22px}.free-seo-intro h2{margin:0 0 12px;font-size:20px}.free-seo-intro p{margin:8px 0;color:#666;font-size:12px;line-height:1.9}</style>`;
  for (const file of files.filter((f) => /(?:^|[\\/])free[\\/]index\.html$/.test(f))) {
    const locale = localeFromPath(file);
    let html = await fs.readFile(file, "utf8");
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(title[locale] || title.ja)}</title>`);
    html = replaceMeta(html, "description", desc[locale] || desc.ja);
    html = replaceProperty(html, "og:title", title[locale] || title.ja);
    html = replaceProperty(html, "og:description", desc[locale] || desc.ja);
    if (locale === "ja" && !html.includes("free-seo-intro")) html = html.replace('<section class="tools">', `${extraJa}<section class="tools">`);
    await fs.writeFile(file, html);
  }
}

async function main() {
  const required = ["R2_ACCOUNT_ID","R2_BUCKET_NAME","R2_ACCESS_KEY_ID","R2_SECRET_ACCESS_KEY"];
  const files = await walk(DIST);
  await injectFreeSeo(files);
  if (required.every((name) => process.env[name])) await injectStickerSeo(files);
  else console.warn("R2 credentials unavailable during build; GPT sticker SEO injection skipped.");
}

main().catch((error) => { console.error("SEO injection failed:", error); process.exitCode = 1; });
