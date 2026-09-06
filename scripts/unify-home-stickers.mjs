import fs from "node:fs";
import path from "node:path";

const pages = [
  path.join(process.cwd(), "dist", "index.html"),
  path.join(process.cwd(), "dist", "en", "index.html"),
  path.join(process.cwd(), "dist", "zh-tw", "index.html"),
  path.join(process.cwd(), "dist", "zh-cn", "index.html"),
  path.join(process.cwd(), "dist", "ko", "index.html"),
  path.join(process.cwd(), "dist", "th", "index.html"),
  path.join(process.cwd(), "dist", "id", "index.html"),
].filter((file) => fs.existsSync(file));

const style = `<style id="home-sticker-unified">
  #stickers{display:none!important}
  .pickup-unified-section .sticker-grid{
    display:grid!important;
    grid-template-columns:repeat(4,minmax(0,1fr))!important;
    gap:18px!important;
    overflow:visible!important;
    scroll-snap-type:none!important;
  }
  .pickup-unified-section .sticker-card{
    min-width:0!important;
    width:auto!important;
    display:flex!important;
    flex-direction:column!important;
    background:#fff!important;
    border:1px solid #e6e1d8!important;
    border-radius:18px!important;
    overflow:hidden!important;
    text-decoration:none!important;
    box-shadow:0 8px 24px rgba(20,31,48,.06)!important;
  }
  .pickup-unified-section .sticker-card img{
    display:block!important;
    width:100%!important;
    aspect-ratio:1/1!important;
    height:auto!important;
    object-fit:contain!important;
    object-position:center!important;
    background:#7898c4!important;
    border-radius:0!important;
  }
  .pickup-unified-section .sticker-card strong{
    display:-webkit-box!important;
    -webkit-box-orient:vertical!important;
    -webkit-line-clamp:2!important;
    overflow:hidden!important;
    min-height:3.2em!important;
    padding:14px 14px 16px!important;
    font-size:14px!important;
    line-height:1.6!important;
    font-weight:800!important;
    color:#18263b!important;
    text-decoration:none!important;
  }
  @media(max-width:720px){
    .pickup-unified-section{
      padding-left:18px!important;
      padding-right:18px!important;
    }
    .pickup-unified-section .section-head{
      align-items:center!important;
      gap:14px!important;
      margin-bottom:20px!important;
    }
    .pickup-unified-section .section-title{
      font-size:clamp(34px,10vw,46px)!important;
      line-height:1.05!important;
    }
    .pickup-unified-section .more{
      flex:0 0 auto!important;
      white-space:nowrap!important;
      padding:11px 15px!important;
      font-size:12px!important;
    }
    .pickup-unified-section .sticker-grid{
      grid-template-columns:repeat(2,minmax(0,1fr))!important;
      gap:12px!important;
    }
    .pickup-unified-section .sticker-card{
      border-radius:14px!important;
      box-shadow:0 5px 16px rgba(20,31,48,.05)!important;
    }
    .pickup-unified-section .sticker-card strong{
      min-height:3.15em!important;
      padding:11px 11px 13px!important;
      font-size:12.5px!important;
      line-height:1.55!important;
    }
  }
  @media(max-width:390px){
    .pickup-unified-section .sticker-grid{gap:10px!important}
    .pickup-unified-section .sticker-card strong{font-size:12px!important;padding:10px!important}
  }
</style>`;

const script = `<script id="home-sticker-unified-script">
(() => {
  const collection = document.querySelector('#stickers');
  if (collection) collection.remove();

  const pickupCard = document.querySelector('.pickup-card');
  const section = pickupCard?.closest('section');
  const grid = section?.querySelector('.sticker-grid');
  if (!section || !grid) return;
  section.classList.add('pickup-unified-section');

  const listHref = section.querySelector('.more')?.getAttribute('href') || '/stickers/';
  const newestHrefs = new Set(
    [...document.querySelectorAll('.sticker-card:not(.pickup-card)')]
      .map((card) => card.getAttribute('href'))
      .filter(Boolean)
  );

  const tokyoDay = () => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return values.year + '-' + values.month + '-' + values.day;
  };

  const hash = (text) => {
    let value = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      value ^= text.charCodeAt(i);
      value = Math.imul(value, 16777619);
    }
    return value >>> 0;
  };

  const shuffle = (items, seedText) => {
    const result = [...items];
    let state = hash(seedText) || 1;
    const random = () => {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return (state >>> 0) / 4294967296;
    };
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  const render = (sourceCards) => {
    const candidates = sourceCards.filter((card) => {
      const href = card.getAttribute('href');
      return href && !newestHrefs.has(href);
    });
    if (!candidates.length) return;

    const selected = shuffle(candidates, 'stamp-moke-pickup-' + tokyoDay()).slice(0, 8);
    const fragment = document.createDocumentFragment();

    for (const source of selected) {
      const href = source.getAttribute('href');
      const sourceImage = source.querySelector('img');
      const sourceTitle = source.querySelector('.card-title');
      if (!href || !sourceImage || !sourceTitle) continue;

      const card = document.createElement('a');
      card.className = 'sticker-card pickup-card';
      card.href = href;

      const image = document.createElement('img');
      image.src = sourceImage.getAttribute('src') || '';
      image.alt = sourceImage.getAttribute('alt') || sourceTitle.textContent?.trim() || '';
      image.loading = 'lazy';
      image.decoding = 'async';

      const strong = document.createElement('strong');
      strong.textContent = sourceTitle.textContent?.trim() || '';

      card.append(image, strong);
      fragment.append(card);
    }

    if (fragment.childNodes.length) grid.replaceChildren(fragment);
  };

  const day = tokyoDay();
  const separator = listHref.includes('?') ? '&' : '?';
  fetch(listHref + separator + 'pickupDay=' + encodeURIComponent(day), {
    cache: 'no-store',
    headers: { accept: 'text/html' }
  })
    .then((response) => {
      if (!response.ok) throw new Error('sticker list ' + response.status);
      return response.text();
    })
    .then((html) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      render([...doc.querySelectorAll('#grid .card')]);
    })
    .catch(() => {
      // Keep the server-rendered pickup cards as a safe fallback.
    });
})();
</script>`;

for (const file of pages) {
  let html = fs.readFileSync(file, "utf8");

  html = html.replace(/<style id="home-sticker-limit">[\s\S]*?<\/style>/g, "");
  html = html.replace(/<div class="home-sticker-more">[\s\S]*?<\/div>/g, "");

  if (!html.includes('id="home-sticker-unified"')) {
    html = html.replace("</head>", `${style}</head>`);
  }
  if (!html.includes('id="home-sticker-unified-script"')) {
    html = html.replace("</body>", `${script}</body>`);
  }

  fs.writeFileSync(file, html);
}
