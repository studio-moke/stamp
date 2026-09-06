import page from "./free-page-v2.js";

const SITE = "https://stamp-moke.jp";
const REQUIRED_JA_TITLE = "ダウンロードできる、無料アイコン & フリー素材";
const LEGACY_JA_TITLE = "無料フリー素材";
const FILE_RE = /\/[^/?#]+\.[a-z0-9]{1,12}$/i;

function cleanJaTitle(rawTitle = "") {
  return String(rawTitle)
    .replace(/\s*\|\s*stamp moke\s*$/i, "")
    .replace(new RegExp(`\\s*[｜|]\\s*${LEGACY_JA_TITLE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`), "")
    .replace(new RegExp(`\\s*[｜|]\\s*${REQUIRED_JA_TITLE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`), "")
    .trim();
}

function ensureJaTitle(html) {
  return html.replace(/<title>(.*?)<\/title>/i, (_all, rawTitle) => {
    const base = cleanJaTitle(rawTitle);
    return `<title>${base}｜${REQUIRED_JA_TITLE} | stamp moke</title>`;
  }).replace(/<meta property="og:title" content="([^"]*)">/i, (_all, rawTitle) => {
    const base = cleanJaTitle(rawTitle);
    return `<meta property="og:title" content="${base}｜${REQUIRED_JA_TITLE} | stamp moke">`;
  });
}

function buildJaDescription(rawDescription = "", rawTitle = "") {
  const base = String(rawDescription).trim().replace(/[。．\s]+$/, "");
  const assetName = cleanJaTitle(rawTitle).trim();
  const searchText = assetName
    ? `${assetName}、無料アイコン、フリー素材、プロフィール画像、SNSアイコンなどを探している方におすすめです。`
    : "無料アイコン、フリー素材、プロフィール画像、SNSアイコンなどを探している方におすすめです。";
  const chatText = "Discord、Microsoft Teams、Slackのプロフィール画像やチャット用アイコンとして、個人・非商用でダウンロードして使えます。";
  return `${base ? `${base}。` : ""}${searchText}${chatText}`;
}

function ensureJaDescription(html) {
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const rawTitle = titleMatch?.[1] || "";
  let description = "";

  let out = html.replace(/<meta name="description" content="([^"]*)">/i, (_all, rawDescription) => {
    description = buildJaDescription(rawDescription, rawTitle);
    return `<meta name="description" content="${description}">`;
  });

  out = out.replace(/<meta property="og:description" content="([^"]*)">/i, (_all, rawDescription) => {
    const value = description || buildJaDescription(rawDescription, rawTitle);
    return `<meta property="og:description" content="${value}">`;
  });

  return out;
}

function ensureJaSeo(html) {
  return ensureJaDescription(ensureJaTitle(html));
}

function slashPath(path) {
  const [beforeHash, hash = ""] = String(path).split("#", 2);
  const [pathname, query = ""] = beforeHash.split("?", 2);
  if (!pathname || pathname === "/" || pathname.endsWith("/")) return path;
  if (pathname === "/api" || pathname.startsWith("/api/") || FILE_RE.test(pathname)) return path;
  return `${pathname}/${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
}

function normalizePageLinks(html) {
  return html.replace(/href="([^"]+)"/g, (all, href) => {
    if (/^(?:#|mailto:|tel:|javascript:|data:)/i.test(href)) return all;
    if (href.startsWith("/")) return `href="${slashPath(href)}"`;
    if (href.startsWith(`${SITE}/`)) {
      const relative = href.slice(SITE.length);
      return `href="${SITE}${slashPath(relative)}"`;
    }
    return all;
  });
}

function normalizeFreeDetailUrls(html) {
  let out = html;

  out = out.replace(
    new RegExp(`${SITE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}((?:/(?:en|zh-tw|th|id))?/free/[^\"'?#<>\\s/]+)(?=[\"'<>\\s])`, "g"),
    (_all, path) => `${SITE}${path}/`
  );

  out = out.replace(
    /href="((?:\/(?:en|zh-tw|th|id))?\/free\/[^"?#\/]+)"/g,
    (_all, path) => `href="${path}/"`
  );

  return normalizePageLinks(out);
}

export default async function handler(req, res) {
  const originalSend = res.send.bind(res);
  res.send = (body) => {
    if (typeof body !== "string") return originalSend(body);
    const locale = String(req.query?.locale || "ja");
    let html = normalizeFreeDetailUrls(body);
    if (locale === "ja") html = ensureJaSeo(html);
    html = html.replace("</body>", '<script src="/trailing-slash-links.js?v=20260905-1"></script></body>');
    return originalSend(html);
  };
  return page(req, res);
}
