import fs from 'node:fs';
import path from 'node:path';

const target = path.join(process.cwd(), 'src', 'pages', 'tools', '[slug].astro');
if (!fs.existsSync(target)) process.exit(0);

let source = fs.readFileSync(target, 'utf8');
const broken = /const tools = (\[[\s\S]*?\]);\nexport function getStaticPaths\(\)\{return tools\.map\(tool=>\(\{params:\{slug:tool\.slug\},props:\{tool\}\}\)\);\}/;
const match = source.match(broken);

if (match) {
  const list = match[1];
  const fixed = `export function getStaticPaths(){\n  const tools = ${list};\n  return tools.map(tool=>({params:{slug:tool.slug},props:{tool}}));\n}`;
  source = source.replace(match[0], fixed);
  fs.writeFileSync(target, source);
  console.log('[build-fix] Moved business tools data inside getStaticPaths for Astro isolation.');
} else if (source.includes('export function getStaticPaths(){\n  const tools = [')) {
  console.log('[build-fix] Business tool getStaticPaths already fixed.');
} else {
  console.warn('[build-fix] Business tool route shape changed; no patch applied.');
}
