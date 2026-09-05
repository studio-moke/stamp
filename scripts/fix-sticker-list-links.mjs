import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "dist", "stickers");

if (!fs.existsSync(root)) process.exit(0);

for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;

  const file = path.join(root, entry.name, "index.html");
  if (!fs.existsSync(file)) continue;

  let html = fs.readFileSync(file, "utf8");

  // The sticker detail page used the top page as the collection link.
  // Keep the brand link on `/`, but route every "back to stickers" link
  // through the canonical collection URL `/stickers/`.
  html = html.replace(
    /(<a href="\/") class="header-link">/g,
    '<a href="/stickers/" class="header-link">',
  );

  html = html.replace(
    /(<nav class="breadcrumb"[^>]*><a href="\/">stamp moke<\/a> \/ )<a href="\/">/g,
    '$1<a href="/stickers/">',
  );

  html = html.replace(
    /(<div class="footer-links">)<a href="\/">/g,
    '$1<a href="/stickers/">',
  );

  // Keep BreadcrumbList structured data consistent with the visible breadcrumb.
  html = html.replace(
    /(\"position\":2,\"name\":\"[^\"]+\",\"item\":\")https:\/\/stamp-moke\.jp\/(\")/g,
    '$1https://stamp-moke.jp/stickers/$2',
  );

  fs.writeFileSync(file, html);
}
