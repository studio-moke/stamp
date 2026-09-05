import page from "./free-page-v2.js";

const SITE = "https://stamp-moke.jp";
const REQUIRED_JA_TITLE = "無料フリー素材";

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

  return out;
}

export default async function handler(req, res) {
  const originalSend = res.send.bind(res);
  res.send = (body) => {
    if (typeof body !== "string") return originalSend(body);
    const locale = String(req.query?.locale || "ja");
    let html = normalizeFreeDetailUrls(body);
    if (locale === "ja") html = ensureJaTitle(html);
    return originalSend(html);
  };
  return page(req, res);
}
