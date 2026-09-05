const SITE_ORIGIN = "https://stamp-moke.jp";
const SITE_HOST = "stamp-moke.jp";
const FILE_RE = /\/[^/?#]+\.[a-z0-9]{1,16}$/i;

function isInternalHost(url) {
  return url.hostname === SITE_HOST;
}

function isPagePath(pathname) {
  if (!pathname || pathname === "/" || pathname.endsWith("/")) return false;
  if (pathname === "/api" || pathname.startsWith("/api/")) return false;
  if (FILE_RE.test(pathname)) return false;
  return true;
}

export function normalizeInternalPageUrl(value) {
  if (typeof value !== "string" || !value) return value;
  const raw = value.trim();
  if (!raw || raw.startsWith("#") || /^(?:mailto:|tel:|javascript:|data:)/i.test(raw)) return value;

  const isRootRelative = raw.startsWith("/") && !raw.startsWith("//");
  const isAbsolute = /^https?:\/\//i.test(raw);
  if (!isRootRelative && !isAbsolute) return value;

  let url;
  try {
    url = new URL(raw, SITE_ORIGIN);
  } catch {
    return value;
  }

  if (!isInternalHost(url) || !isPagePath(url.pathname)) return value;
  url.pathname += "/";

  if (isRootRelative) return `${url.pathname}${url.search}${url.hash}`;
  return url.toString();
}

export function normalizeInternalUrls(value, seen = new WeakSet()) {
  if (typeof value === "string") return normalizeInternalPageUrl(value);
  if (!value || typeof value !== "object") return value;
  if (Buffer.isBuffer(value) || value instanceof Uint8Array || value instanceof Date) return value;
  if (seen.has(value)) return value;
  seen.add(value);

  if (Array.isArray(value)) return value.map(item => normalizeInternalUrls(item, seen));

  for (const key of Object.keys(value)) {
    value[key] = normalizeInternalUrls(value[key], seen);
  }
  return value;
}

function normalizeAbsoluteUrlsInText(text) {
  return text.replace(/https?:\/\/stamp-moke\.jp(?:\/[^\s\"'<>]*)?/gi, match => normalizeInternalPageUrl(match));
}

function normalizeRootRelativeAttributes(text) {
  return text.replace(/\b(href|action)=(['"])(\/[^'"<>]*)\2/gi, (all, attr, quote, raw) => {
    const normalized = normalizeInternalPageUrl(raw);
    return `${attr}=${quote}${normalized}${quote}`;
  });
}

export function normalizeInternalUrlsInText(text) {
  if (typeof text !== "string" || !text) return text;
  return normalizeRootRelativeAttributes(normalizeAbsoluteUrlsInText(text));
}

export function installInternalUrlNormalization(res) {
  if (!res || res.__stampMokeInternalUrlNormalization) return res;
  res.__stampMokeInternalUrlNormalization = true;

  if (typeof res.json === "function") {
    const originalJson = res.json.bind(res);
    res.json = body => originalJson(normalizeInternalUrls(body));
  }

  if (typeof res.send === "function") {
    const originalSend = res.send.bind(res);
    res.send = body => originalSend(typeof body === "string" ? normalizeInternalUrlsInText(body) : body);
  }

  if (typeof res.redirect === "function") {
    const originalRedirect = res.redirect.bind(res);
    res.redirect = (first, second) => {
      if (typeof second === "string") return originalRedirect(first, normalizeInternalPageUrl(second));
      if (typeof first === "string") return originalRedirect(normalizeInternalPageUrl(first));
      return originalRedirect(first, second);
    };
  }

  if (typeof res.setHeader === "function") {
    const originalSetHeader = res.setHeader.bind(res);
    res.setHeader = (name, value) => {
      if (String(name).toLowerCase() === "location" && typeof value === "string") {
        return originalSetHeader(name, normalizeInternalPageUrl(value));
      }
      return originalSetHeader(name, value);
    };
  }

  return res;
}
