import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("dist");
const SITE = "https://stamp-moke.jp";
const PAIRS = [
  { source: "zh-tw", target: "zh-cn", htmlLang: "zh-Hans-CN", label: "简体中文" },
  { source: "en", target: "ko", htmlLang: "ko", label: "한국어" },
];
const HREFLANG = {
  ja: "ja",
  en: "en",
  "zh-tw": "zh-Hant-TW",
  "zh-cn": "zh-Hans-CN",
  ko: "ko",
  th: "th",
  id: "id",
};
const LOCALES = Object.keys(HREFLANG);

const TOOL_COPY = {
  "chat-stamp-maker": {
    "zh-cn": ["聊天贴图制作工具", "在浏览器中制作适合聊天使用的图片与贴图素材。无需注册即可使用。"],
    ko: ["채팅 스탬프 만들기", "브라우저에서 채팅용 이미지와 스탬프 소재를 만들 수 있는 무료 도구입니다."],
  },
  "color-palette": {
    "zh-cn": ["图片配色提取工具", "从照片或插图中提取主要颜色，并查看适合网页、横幅和设计使用的配色。图片仅在浏览器内处理。"],
    ko: ["이미지 컬러 팔레트 추출", "사진과 일러스트에서 주요 색상을 추출하고 웹·배너 디자인에 활용할 수 있는 색상 조합을 확인하세요. 이미지는 브라우저 안에서만 처리됩니다."],
  },
  "convert-to-jpg": {
    "zh-cn": ["图片转 JPG", "在浏览器中把图片转换为 JPG。无需上传到服务器。"],
    ko: ["이미지를 JPG로 변환", "이미지를 브라우저에서 JPG로 변환합니다. 서버 업로드 없이 처리됩니다."],
  },
  "image-compressor": {
    "zh-cn": ["图片压缩工具", "在浏览器中压缩图片并减小文件大小。无需注册，图片不会上传到服务器。"],
    ko: ["이미지 압축", "브라우저에서 이미지 용량을 줄이는 무료 도구입니다. 가입이 필요 없으며 이미지는 서버에 업로드되지 않습니다."],
  },
  "image-resizer": {
    "zh-cn": ["图片尺寸调整", "在浏览器中调整图片的宽度和高度。适合社交媒体、头像和网页素材。"],
    ko: ["이미지 크기 조절", "브라우저에서 이미지의 가로·세로 크기를 조절합니다. SNS, 프로필, 웹 소재에 활용할 수 있습니다."],
  },
  "jpg-to-image": {
    "zh-cn": ["JPG 图片转换工具", "在浏览器中转换 JPG 图片格式。无需注册，也不会把图片发送到服务器。"],
    ko: ["JPG 이미지 변환", "브라우저에서 JPG 이미지 형식을 변환합니다. 가입이 필요 없고 이미지를 서버로 보내지 않습니다."],
  },
  "manga-effect-lines": {
    "zh-cn": ["漫画效果线制作", "免费制作适合漫画、插图和社交媒体图片的效果线。"],
    ko: ["만화 효과선 만들기", "만화, 일러스트, SNS 이미지에 사용할 수 있는 효과선을 무료로 만드세요."],
  },
  "manga-sfx": {
    "zh-cn": ["漫画拟声字制作", "制作适合漫画与插图的拟声字效果，并在浏览器中完成编辑。"],
    ko: ["만화 효과음 글자 만들기", "만화와 일러스트에 사용할 효과음 글자를 브라우저에서 만들 수 있습니다."],
  },
  "manga-speech-bubble": {
    "zh-cn": ["漫画对话框制作", "制作漫画、插图和社交媒体图片使用的对话框与气泡。"],
    ko: ["만화 말풍선 만들기", "만화, 일러스트, SNS 이미지에 사용할 말풍선을 만들 수 있습니다."],
  },
  "manga-speed-lines": {
    "zh-cn": ["漫画速度线制作", "免费生成适合漫画与插图的速度线和集中线效果。"],
    ko: ["만화 스피드라인 만들기", "만화와 일러스트에 사용할 스피드라인과 집중선 효과를 무료로 만드세요."],
  },
  "manga-tone-maker": {
    "zh-cn": ["漫画网点制作", "在浏览器中制作漫画网点与灰度效果。"],
    ko: ["만화 스크린톤 만들기", "브라우저에서 만화 스크린톤과 그레이 효과를 만들 수 있습니다."],
  },
  "pixel-art-maker": {
    "zh-cn": ["像素画制作工具", "把图片制作成像素画风格，适合图标、社交媒体和创作素材。"],
    ko: ["픽셀아트 만들기", "이미지를 픽셀아트 스타일로 바꿔 아이콘, SNS, 창작 소재에 활용하세요."],
  },
  "png-transparent": {
    "zh-cn": ["PNG 背景透明化", "在浏览器中处理 PNG 图片并制作透明背景。"],
    ko: ["PNG 배경 투명화", "브라우저에서 PNG 이미지의 배경을 투명하게 처리할 수 있습니다."],
  },
  "pop-art-maker": {
    "zh-cn": ["波普艺术图片制作", "把照片或图片转换成波普艺术风格，在浏览器中免费制作。"],
    ko: ["팝아트 이미지 만들기", "사진이나 이미지를 팝아트 스타일로 바꾸는 무료 브라우저 도구입니다."],
  },
  "qr-maker": {
    "zh-cn": ["二维码制作工具", "免费制作二维码。适合网址、社交媒体和分享用途。"],
    ko: ["QR 코드 만들기", "URL, SNS, 공유용 QR 코드를 무료로 만들 수 있습니다."],
  },
  "seal-maker": {
    "zh-cn": ["印章图片制作", "在浏览器中制作印章风格的图片素材。"],
    ko: ["도장 이미지 만들기", "브라우저에서 도장 스타일의 이미지 소재를 만들 수 있습니다."],
  },
  "sticker-maker": {
    "zh-cn": ["贴纸图片制作工具", "制作适合社交媒体、聊天和个人创作使用的贴纸风格图片。"],
    ko: ["스티커 이미지 만들기", "SNS, 채팅, 개인 창작에 사용할 스티커 스타일 이미지를 만들 수 있습니다."],
  },
  tools: {
    "zh-cn": ["免费工具", "stamp moke 的免费浏览器工具集合。图片处理、创作和实用工具无需注册即可使用。"],
    ko: ["무료 도구", "stamp moke의 무료 브라우저 도구 모음입니다. 이미지 편집, 창작, 실용 도구를 가입 없이 사용할 수 있습니다."],
  },
  news: {
    "zh-cn": ["最新消息", "查看 stamp moke 的 LINE 贴图、商品、免费工具与免费素材更新。"],
    ko: ["새 소식", "stamp moke의 LINE 스티커, 굿즈, 무료 도구와 무료 소재 업데이트를 확인하세요."],
  },
};

function rel(file) { return path.relative(ROOT, file).replaceAll(path.sep, "/"); }
function routeFromRel(relative) {
  const parts = relative.split("/").filter(Boolean);
  return parts[1] || "";
}
function urlFor(locale, suffix) {
  const clean = suffix.replace(/^\/+/, "");
  return locale === "ja" ? `${SITE}/${clean}` : `${SITE}/${locale}/${clean}`;
}
function esc(value = "") {
  return String(value).replace(/[&<>\"]/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
}
async function exists(file) { try { await fs.access(file); return true; } catch { return false; } }
async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else out.push(full);
  }
  return out;
}
async function copyMissingTree(sourceRoot, targetRoot) {
  let copied = 0;
  for (const source of await walk(sourceRoot)) {
    const relative = path.relative(sourceRoot, source);
    const target = path.join(targetRoot, relative);
    if (await exists(target)) continue;
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(source, target);
    copied++;
  }
  return copied;
}
function setHtmlLang(html, lang) {
  return html.replace(/<html\b([^>]*?)\blang=(['"])[^'"]*\2([^>]*)>/i, `<html$1lang="${lang}"$3>`)
    .replace(/<html(?![^>]*\blang=)([^>]*)>/i, `<html lang="${lang}"$1>`);
}
function setCanonical(html, canonical) {
  const tag = `<link rel="canonical" href="${canonical}">`;
  html = html.replace(/<link\b[^>]*\brel=(['"])canonical\1[^>]*>/gi, "");
  return html.replace("</head>", `${tag}</head>`);
}
function setMeta(html, name, value) {
  const tag = `<meta name="${name}" content="${esc(value)}">`;
  const re = new RegExp(`<meta\\b[^>]*\\bname=(["'])${name}\\1[^>]*>`, "gi");
  html = html.replace(re, "");
  return html.replace("</head>", `${tag}</head>`);
}
function setProperty(html, name, value) {
  const tag = `<meta property="${name}" content="${esc(value)}">`;
  const re = new RegExp(`<meta\\b[^>]*\\bproperty=(["'])${name}\\1[^>]*>`, "gi");
  html = html.replace(re, "");
  return html.replace("</head>", `${tag}</head>`);
}
function setTitle(html, value) {
  return /<title>[\s\S]*?<\/title>/i.test(html)
    ? html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(value)}</title>`)
    : html.replace("</head>", `<title>${esc(value)}</title></head>`);
}
function ensureAlternates(html, suffix) {
  const current = (html.match(/<link\b[^>]*\brel=(['"])alternate\1[^>]*\bhreflang=/gi) || []).length;
  if (current >= 7 && /hreflang=(['"])x-default\1/i.test(html)) return html;
  html = html.replace(/<link\b[^>]*\brel=(['"])alternate\1[^>]*\bhreflang=([^>]+)>/gi, "");
  const links = LOCALES.map((locale) => `<link rel="alternate" hreflang="${HREFLANG[locale]}" href="${urlFor(locale, suffix)}">`).join("")
    + `<link rel="alternate" hreflang="x-default" href="${urlFor("ja", suffix)}">`;
  return html.replace("</head>", `${links}</head>`);
}
function fixLanguageSwitcher(html, locale, label) {
  html = html.replace(/(<span class="language-current">)[\s\S]*?(<\/span>)/i, `$1${label}$2`);
  html = html.replace(/class="language-option active"/g, 'class="language-option"');
  const re = new RegExp(`(<a\\b[^>]*data-locale=["']${locale}["'][^>]*class=["'])language-option(["'])`, "i");
  html = html.replace(re, "$1language-option active$2");
  html = html.replace(/aria-current="page"/g, "");
  const currentRe = new RegExp(`(<a\\b[^>]*data-locale=["']${locale}["'][^>]*)(>)`, "i");
  html = html.replace(currentRe, '$1 aria-current="page"$2');
  return html;
}
function removeInjectedJapaneseEditorial(html) {
  return html.replace(/<section class="sticker-seo-editorial"[\s\S]*?<\/section><style>[\s\S]*?<\/style>/gi, "");
}
function addLocalizedIntro(html, locale, route, description) {
  if (!TOOL_COPY[route] || html.includes("data-zhko-intro")) return html;
  const heading = locale === "zh-cn" ? "关于此工具" : "이 도구 안내";
  const block = `<section data-zhko-intro style="max-width:1180px;margin:28px auto 72px;padding:0 22px;color:#555;line-height:1.85"><h2 style="font-size:20px;color:#171717">${heading}</h2><p>${esc(description)}</p></section>`;
  return html.replace("</body>", `${block}</body>`);
}
function patchHeading(html, heading) {
  return html.replace(/<h1\b([^>]*)>[\s\S]*?<\/h1>/i, `<h1$1>${esc(heading)}</h1>`);
}
function simplifyChinese(html) {
  const from = "體圖貼貓鳥愛關聯報擔驚歡謝學職場東繩灣簡純應勵與實際話開髮兒婦禮復雜問廣處羅單頁覽見顯載樣線畫號選擇轉換壓縮縮圖輸入輸出設置點擊進階隱私網頁務為這個從將還無庫據類別標籤熱門載入僅銷售發佈時區動態視頻檔案儲存處理製作會請確認免費適合個專業點擊開始結果預覽顏色調節圖片頭說明變更連結網站經營獲取發生數據認證帳戶導航搜尋詳情購買禮物返回價格當前推薦";
  const to   = "体图贴猫鸟爱关联报担惊欢谢学职场东绳湾简纯应励与实际话开发儿妇礼复杂问广处罗单页览见显载样线画号选择转换压缩缩图输入输出设置点击进阶隐私网页务为这个从将还无库据类别标签热门载入仅销售发布时区动态视频档案储存处理制作会请确认免费适合个专业点击开始结果预览颜色调节图片头说明变更链接网站经营获取发生数据认证账户导航搜寻详情购买礼物返回价格当前推荐";
  const map = new Map([...from].map((c, i) => [c, [...to][i] || c]));
  return [...html].map((c) => map.get(c) || c).join("");
}

let copiedTotal = 0;
for (const pair of PAIRS) {
  const sourceRoot = path.join(ROOT, pair.source);
  const targetRoot = path.join(ROOT, pair.target);
  if (!(await exists(sourceRoot))) throw new Error(`[i18n] missing source locale output: ${pair.source}`);
  await fs.mkdir(targetRoot, { recursive: true });
  copiedTotal += await copyMissingTree(sourceRoot, targetRoot);

  for (const file of (await walk(targetRoot)).filter((f) => f.endsWith(".html"))) {
    const relative = rel(file);
    const parts = relative.split("/");
    const suffix = parts.slice(1).join("/").replace(/index\.html$/, "");
    const route = routeFromRel(relative);
    const canonical = urlFor(pair.target, suffix);
    let html = await fs.readFile(file, "utf8");
    html = setHtmlLang(html, pair.htmlLang);
    html = setCanonical(html, canonical);
    html = fixLanguageSwitcher(html, pair.target, pair.label);
    html = removeInjectedJapaneseEditorial(html);
    html = ensureAlternates(html, suffix);

    const copy = TOOL_COPY[route]?.[pair.target];
    if (copy) {
      const [heading, description] = copy;
      html = setTitle(html, `${heading} | stamp moke`);
      html = setMeta(html, "description", description);
      html = setProperty(html, "og:title", `${heading} | stamp moke`);
      html = setProperty(html, "og:description", description);
      html = setProperty(html, "og:url", canonical);
      html = patchHeading(html, heading);
      html = addLocalizedIntro(html, pair.target, route, description);
    }

    if (/\/stickers\/\d+\/$/.test(new URL(canonical).pathname)) {
      const id = canonical.match(/\/stickers\/(\d+)\/$/)?.[1] || "";
      const heading = pair.target === "zh-cn" ? `原创 LINE 贴图 ${id}` : `오리지널 LINE 스티커 ${id}`;
      const description = pair.target === "zh-cn"
        ? `stamp moke 的原创 LINE 贴图作品。查看设计与使用场景，在日常聊天中轻松使用。`
        : `stamp moke의 오리지널 LINE 스티커입니다. 디자인과 활용 장면을 확인하고 일상 대화에 사용해 보세요.`;
      html = setTitle(html, `${heading} | stamp moke`);
      html = setMeta(html, "description", description);
      html = setProperty(html, "og:title", `${heading} | stamp moke`);
      html = setProperty(html, "og:description", description);
      html = setProperty(html, "og:url", canonical);
    }

    if (pair.target === "zh-cn") html = simplifyChinese(html);
    await fs.writeFile(file, html);
  }
}

console.log(`[i18n] zh-cn/ko route parity completed; copied ${copiedTotal} missing output file(s)`);
