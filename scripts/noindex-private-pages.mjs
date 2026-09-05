import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("dist");
const PRIVATE_SEGMENTS = new Set(["admin", "free-admin"]);

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await listFiles(full));
    else out.push(full);
  }
  return out;
}

function isPrivateHtml(file) {
  if (!file.endsWith(".html")) return false;
  const relative = path.relative(ROOT, file).split(path.sep).filter(Boolean);
  return relative.some((segment) => PRIVATE_SEGMENTS.has(segment));
}

function injectNoindex(html) {
  const robots = '<meta name="robots" content="noindex,nofollow,noarchive,nosnippet" />';
  const googlebot = '<meta name="googlebot" content="noindex,nofollow,noarchive,nosnippet" />';
  let out = html
    .replace(/<meta\s+name=["']robots["'][^>]*>\s*/gi, "")
    .replace(/<meta\s+name=["']googlebot["'][^>]*>\s*/gi, "");
  const tags = `${robots}\n${googlebot}\n`;
  if (/<head(?:\s[^>]*)?>/i.test(out)) return out.replace(/<head(\s[^>]*)?>/i, (match) => `${match}\n${tags}`);
  return `${tags}${out}`;
}

let changed = 0;
try {
  for (const file of await listFiles(ROOT)) {
    if (!isPrivateHtml(file)) continue;
    const before = await fs.readFile(file, "utf8");
    const after = injectNoindex(before);
    if (after !== before) {
      await fs.writeFile(file, after);
      changed++;
    }
  }
  console.log(`[seo-noindex] protected ${changed} private/admin pages`);
} catch (error) {
  if (error?.code === "ENOENT") console.log("[seo-noindex] dist not found; skipped");
  else throw error;
}
