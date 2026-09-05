import fs from "node:fs";
import path from "node:path";

const files = [
  path.join(process.cwd(), "dist", "index.html"),
  path.join(process.cwd(), "dist", "en", "index.html"),
  path.join(process.cwd(), "dist", "zh-tw", "index.html"),
  path.join(process.cwd(), "dist", "th", "index.html"),
  path.join(process.cwd(), "dist", "id", "index.html"),
].filter(fs.existsSync);

const injectedStyle = `
<style id="home-sticker-limit">
  #stickers .sticker-card:nth-child(n+13){display:none!important}
  #stickers .controls,#stickers .pagination{display:none!important}
  .home-sticker-more{display:flex;justify-content:center;margin-top:32px}
  .home-sticker-more a{display:inline-flex;align-items:center;justify-content:center;padding:13px 22px;border-radius:999px;background:#161616;color:#fff;text-decoration:none;font-size:12px;font-weight:800}
</style>`;

for (const file of files) {
  let html = fs.readFileSync(file, "utf8");

  html = html.replaceAll('href="#stickers"', 'href="/stickers/"');
  html = html.replace(/(<[^>]+id="sticker-count"[^>]*>)[^<]*(<\/[^>]+>)/, '$1NEW & RECOMMENDED$2');

  if (!html.includes('id="home-sticker-limit"')) {
    html = html.replace("</head>", `${injectedStyle}</head>`);
  }

  if (!html.includes('class="home-sticker-more"')) {
    const goodsMarker = '<section class="goods-section"';
    const button = '<div class="home-sticker-more"><a href="/stickers/">LINEスタンプをすべて見る</a></div>';
    const markerIndex = html.indexOf(goodsMarker);
    if (markerIndex !== -1) html = html.slice(0, markerIndex) + button + html.slice(markerIndex);
  }

  fs.writeFileSync(file, html);
}
