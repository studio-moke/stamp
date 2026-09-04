import fs from 'node:fs';
import path from 'node:path';

const target = path.join(process.cwd(), 'src', 'pages', 'tools', '[slug].astro');
if (fs.existsSync(target)) {
  let source = fs.readFileSync(target, 'utf8');
  const outerStart = source.indexOf('const tools = [');
  const fnStart = source.indexOf('export function getStaticPaths', Math.max(0, outerStart));

  if (outerStart !== -1 && fnStart !== -1 && fnStart > outerStart) {
    const listStart = source.indexOf('[', outerStart);
    const listClose = source.lastIndexOf('];', fnStart);
    const fnLineEnd = source.indexOf('\n', fnStart);

    if (listStart !== -1 && listClose !== -1 && fnLineEnd !== -1) {
      const list = source.slice(listStart, listClose + 1);
      const fixed = `export function getStaticPaths() {\n  const tools = ${list};\n  return tools.map((tool) => ({ params: { slug: tool.slug }, props: { tool } }));\n}`;
      source = source.slice(0, outerStart) + fixed + source.slice(fnLineEnd);
      fs.writeFileSync(target, source);
      console.log('[build-fix] Moved business tools data inside getStaticPaths for Astro isolation.');
    } else {
      console.warn('[build-fix] Could not identify business tool array boundaries.');
    }
  } else if (/export function getStaticPaths\(\)\s*\{\s*const tools\s*=\s*\[/s.test(source)) {
    console.log('[build-fix] Business tool getStaticPaths already fixed.');
  } else {
    console.warn('[build-fix] Business tool route shape changed; no patch applied.');
  }
}

// Some tool components currently contain copy for ja/en/zh-tw/th/id only.
// The global site already knows zh-cn/ko, so blindly generating every tool for
// every LOCALE makes Astro prerender crash when a tool has no copy for them.
// Until those tool translations are added, generate localized tool routes only
// for the languages those components actually support. This keeps the rest of
// the zh-cn/ko site intact and prevents one untranslated utility from blocking
// the whole production build.
const localeDir = path.join(process.cwd(), 'src', 'pages', '[locale]');
if (fs.existsSync(localeDir)) {
  const supportedToolLocalesExpr = 'LOCALES.filter(locale=>["en","zh-tw","th","id"].includes(locale))';
  let patched = 0;
  for (const name of fs.readdirSync(localeDir)) {
    if (!name.endsWith('.astro')) continue;
    const file = path.join(localeDir, name);
    let source = fs.readFileSync(file, 'utf8');
    const before = source;
    source = source.replaceAll(
      'LOCALES.filter(locale=>locale!=="ja")',
      supportedToolLocalesExpr,
    );
    source = source.replaceAll(
      "LOCALES.filter(locale=>locale!=='ja')",
      supportedToolLocalesExpr,
    );
    if (source !== before) {
      fs.writeFileSync(file, source);
      patched += 1;
    }
  }
  console.log(`[build-fix] Guarded localized tool routes in ${patched} page(s).`);
}
