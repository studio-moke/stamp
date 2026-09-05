import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("dist");
const SITE = "https://stamp-moke.jp";
const HOST = "stamp-moke.jp";
const FILE_RE = /\/[^/?#]+\.[a-z0-9]{1,16}$/i;
const RUNTIME_SCRIPTS = [
  '<script src="/api-url-normalizer.js?v=20260905-2"></script>',
  '<script src="/trailing-slash-links.js?v=20260905-2"></script>'
];

function isPagePath(pathname) {
  if (!pathname || pathname === "/" || pathname.endsWith("/")) return false;
  if (pathname === "/api" || pathname.startsWith("/api/")) return false;
  if (FILE_RE.test(pathname)) return false;
  return true;
}

function normalizeUrl(value) {
  if (typeof value !== "string" || !value) return value;
  const raw = value.trim();
  if (!raw || raw.startsWith("#") || /^(?:mailto:|tel:|javascript:|data:)/i.test(raw)) return value;
  const rootRelative = raw.startsWith("/") && !raw.startsWith("//");
  const absolute = /^https?:\/\//i.test(raw);
  if (!rootRelative && !absolute) return value;

  let url;
  try { url = new URL(raw, SITE); } catch { return value; }
  if (url.hostname !== HOST || !isPagePath(url.pathname)) return value;
  url.pathname += "/";
  return rootRelative ? `${url.pathname}${url.search}${url.hash}` : url.toString();
}

function injectRuntimeScripts(text) {
  let out = text;
  for (const tag of [...RUNTIME_SCRIPTS].reverse()) {
    const src = tag.match(/src="([^"]+)/)?.[1]?.split("?")[0];
    if (src && out.includes(src)) continue;
    if (/<head(?:\s[^>]*)?>/i.test(out)) {
      out = out.replace(/<head(\s[^>]*)?>/i, match => `${match}${tag}`);
    } else if (out.includes("</body>")) {
      out = out.replace("</body>", `${tag}</body>`);
    } else {
      out = tag + out;
    }
  }
  return out;
}

function normalizeText(text, ext) {
  let out = text.replace(/https?:\/\/stamp-moke\.jp(?:\/[^\s\"'<>]*)?/gi, match => normalizeUrl(match));
  out = out.replace(/\b(href|action)=(['"])(\/[^'"<>]*)\2/gi, (all, attr, quote, raw) => {
    return `${attr}=${quote}${normalizeUrl(raw)}${quote}`;
  });
  if (ext === ".html") out = injectRuntimeScripts(out);
  return out;
}

function normalizeJson(value) {
  if (typeof value === "string") return normalizeUrl(value);
  if (Array.isArray(value)) return value.map(normalizeJson);
  if (value && typeof value === "object") {
    for (const key of Object.keys(value)) value[key] = normalizeJson(value[key]);
  }
  return value;
}

async function files(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await files(full));
    else result.push(full);
  }
  return result;
}

let changed = 0;
try {
  for (const file of await files(ROOT)) {
    const ext = path.extname(file).toLowerCase();
    if (![".html", ".xml", ".json"].includes(ext)) continue;
    const before = await fs.readFile(file, "utf8");
    let after = before;
    if (ext === ".json") {
      try {
        const data = JSON.parse(before);
        after = `${JSON.stringify(normalizeJson(data), null, 2)}\n`;
      } catch {
        after = normalizeText(before, ext);
      }
    } else {
      after = normalizeText(before, ext);
    }
    if (after !== before) {
      await fs.writeFile(file, after);
      changed++;
    }
  }
  console.log(`[trailing-slash] normalized ${changed} generated files`);
} catch (error) {
  if (error?.code === "ENOENT") {
    console.log("[trailing-slash] dist not found; skipped");
  } else {
    throw error;
  }
}
