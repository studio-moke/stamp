import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST_DIR = fileURLToPath(new URL('../dist/', import.meta.url));
// Cache-bust the icon URL so browsers stop reusing the old/default Astro favicon.
const FAVICON_TAGS = `  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=green-m-20260903" />\n  <link rel="alternate icon" type="image/x-icon" href="/favicon.ico?v=green-m-20260903" />\n  <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico?v=green-m-20260903" />`;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(fullPath);
  }

  return files;
}

const htmlFiles = await walk(DIST_DIR);
let updated = 0;

for (const file of htmlFiles) {
  const original = await readFile(file, 'utf8');
  if (!/<head(?:\s[^>]*)?>/i.test(original)) continue;

  // Remove every existing icon declaration (including framework/page defaults)
  // and then inject the stamp moke green-m favicon as the single source of truth.
  let html = original.replace(/\s*<link\b[^>]*\brel=["'][^"']*icon[^"']*["'][^>]*>\s*/gi, '\n');
  html = html.replace(/<\/head>/i, `${FAVICON_TAGS}\n</head>`);

  if (html !== original) {
    await writeFile(file, html, 'utf8');
    updated += 1;
  }
}

console.log(`[favicon] forced green-m favicon in ${updated}/${htmlFiles.length} HTML files`);
