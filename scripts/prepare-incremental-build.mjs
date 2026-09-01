import fs from 'node:fs';
import path from 'node:path';

const target = path.join(process.cwd(), 'src', 'pages', 'stickers', '[id].astro');
const source = fs.readFileSync(target, 'utf8');

if (source.includes('cacheKey: JSON.stringify(sticker)')) {
  console.log('[incremental] Japanese sticker route already has cacheKey.');
  process.exit(0);
}

const before = 'return stickers.map((sticker) => ({ params: { id: sticker.id }, props: { sticker } }));';
const after = `return stickers.map((sticker) => ({\n    params: { id: sticker.id },\n    props: { sticker },\n    cacheKey: JSON.stringify(sticker),\n  }));`;

if (!source.includes(before)) {
  console.warn('[incremental] Japanese sticker route shape changed; skipping automatic patch.');
  process.exit(0);
}

fs.writeFileSync(target, source.replace(before, after));
console.log('[incremental] Added cacheKey to Japanese sticker pages for this build.');
