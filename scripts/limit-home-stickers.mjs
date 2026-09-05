import fs from "node:fs";
import path from "node:path";

const pages = [
  { locale: "ja", file: path.join(process.cwd(), "dist", "index.html"), target: "/stickers/", label: "LINEスタンプをすべて見る" },
  { locale: "en", file: path.join(process.cwd(), "dist", "en", "index.html"), target: "/en/stickers/", label: "View all LINE stickers" },
  { locale: "zh-tw", file: path.join(process.cwd(), "dist", "zh-tw", "index.html"), target: "/zh-tw/stickers/", label: "查看所有LINE貼圖" },
  { locale: "zh-cn", file: path.join(process.cwd(), "dist", "zh-cn", "index.html"), target: "/zh-cn/stickers/", label: "查看所有LINE贴图" },
  { locale: "ko", file: path.join(process.cwd(), "dist", "ko", "index.html"), target: "/ko/stickers/", label: "모든 LINE 스티커 보기" },
  { locale: "th", file: path.join(process.cwd(), "dist", "th", "index.html"), target: "/th/stickers/", label: "ดูสติกเกอร์ LINE ทั้งหมด" },
  { locale: "id", file: path.join(process.cwd(), "dist", "id", "index.html"), target: "/id/stickers/", label: "Lihat semua stiker LINE" },
].filter((page) => fs.existsSync(page.file));

const injectedStyle = `
<style id="home-sticker-limit">
  #stickers .sticker-card:nth-child(n+13){display:none!important}
  #stickers .controls,#stickers .pagination{display:none!important}
  .home-sticker-more{display:flex;justify-content:center;margin-top:32px}
  .home-sticker-more a{display:inline-flex;align-items:center;justify-content:center;padding:13px 22px;border-radius:999px;background:#161616;color:#fff;text-decoration:none;font-size:12px;font-weight:800}
</style>`;

for (const { file, target, label } of pages) {
  let html = fs.readFileSync(file, "utf8");

  html = html.replaceAll('href="#stickers"', `href="${target}"`);
  html = html.replace(/(<[^>]+id="sticker-count"[^>]*>)[^<]*(<\/[^>]+>)/, '$1NEW & RECOMMENDED$2');

  if (!html.includes('id="home-sticker-limit"')) {
    html = html.replace("</head>", `${injectedStyle}</head>`);
  }

  if (!html.includes('class="home-sticker-more"')) {
    const goodsMarker = '<section class="goods-section"';
    const button = `<div class="home-sticker-more"><a href="${target}">${label}</a></div>`;
    const markerIndex = html.indexOf(goodsMarker);
    if (markerIndex !== -1) html = html.slice(0, markerIndex) + button + html.slice(markerIndex);
  }

  fs.writeFileSync(file, html);
}
