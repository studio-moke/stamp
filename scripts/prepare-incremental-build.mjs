import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

// Keep the Japanese sticker detail pages statically generated, but make them
// incremental so unchanged stickers can be reused by Astro's cache.
const jaTarget = path.join(root, 'src', 'pages', 'stickers', '[id].astro');
let jaSource = fs.readFileSync(jaTarget, 'utf8');

if (!jaSource.includes('cacheKey: JSON.stringify(sticker)')) {
  const before = 'return stickers.map((sticker) => ({ params: { id: sticker.id }, props: { sticker } }));';
  const after = `return stickers.map((sticker) => ({\n    params: { id: sticker.id },\n    props: { sticker },\n    cacheKey: JSON.stringify(sticker),\n  }));`;

  if (jaSource.includes(before)) {
    jaSource = jaSource.replace(before, after);
    fs.writeFileSync(jaTarget, jaSource);
    console.log('[build-opt] Added cacheKey to Japanese sticker pages.');
  } else {
    console.warn('[build-opt] Japanese sticker route shape changed; cacheKey patch skipped.');
  }
} else {
  console.log('[build-opt] Japanese sticker route already has cacheKey.');
}

// The localized sticker detail routes multiplied build time by four because
// every sticker was prerendered again for each locale. Those public URLs are
// preserved by Vercel redirects to the canonical Japanese detail page, while
// locale home/search/tool pages remain untouched.
const localizedRoutes = ['en', 'zh-tw', 'th', 'id'];
for (const locale of localizedRoutes) {
  const target = path.join(root, 'src', 'pages', locale, 'stickers', '[id].astro');
  if (!fs.existsSync(target)) continue;

  const source = fs.readFileSync(target, 'utf8');
  const start = source.indexOf('export function getStaticPaths()');
  const marker = 'const { sticker } = Astro.props;';
  const end = source.indexOf(marker);

  if (start === -1 || end === -1 || end <= start) {
    console.warn(`[build-opt] ${locale} sticker route shape changed; prerender patch skipped.`);
    continue;
  }

  const replacement = `export function getStaticPaths() {\n  return [];\n}\n`;
  const patched = source.slice(0, start) + replacement + source.slice(end);
  fs.writeFileSync(target, patched);
  console.log(`[build-opt] Disabled bulk prerender for ${locale} sticker details.`);
}
