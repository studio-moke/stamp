import page from "./free-page-v2.js";

const SITE = "https://stamp-moke.jp";
const REQUIRED_JA_TITLE = "無料フリー素材";
const FILE_RE = /\/[^/?#]+\.[a-z0-9]{1,12}$/i;

function ensureJaTitle(html) {
  return html.replace(/<title>(.*?)<\/title>/i, (all, rawTitle) => {
    if (rawTitle.includes(REQUIRED_JA_TITLE)) return all;
    const base = rawTitle.replace(/\s*\|\s*stamp moke\s*$/i, "").trim();
    return `<title>${base}｜${REQUIRED_JA_TITLE} | stamp moke</title>`;
  }).replace(/<meta property="og:title" content="([^"]*)">/i, (all, rawTitle) => {
    if (rawTitle.includes(REQUIRED_JA_TITLE)) return all;
    const base = rawTitle.replace(/\s*\|\s*stamp moke\s*$/i, "").trim();
    return `<meta property="og:title" content="${base}｜${REQUIRED_JA_TITLE} | stamp moke">`;
  });
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
    if (locale === "ja") html = ensureJaTitle(html);
    html = html.replace("</body>", '<script src="/trailing-slash-links.js?v=20260905-1"></script></body>');
    return originalSend(html);
  };
  return page(req, res);
}
