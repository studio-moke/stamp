import crypto from 'node:crypto';

const TARGETS = [
  { name: 'moke-stickers', base: 'https://store.line.me/stickershop/author/6507349/ja', type: 'stickershop' },
  { name: 'control-m-coffee', base: 'https://store.line.me/stickershop/author/1418225/ja', type: 'stickershop' },
  { name: 'moke-emoji-same-author-id', base: 'https://store.line.me/emojishop/author/6507349/ja', type: 'emojishop' },
];

const baseHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',
  'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'same-origin',
  'Upgrade-Insecure-Requests': '1',
};

function createSession() {
  const jar = new Map();
  function updateCookies(res) {
    let values = [];
    if (typeof res.headers.getSetCookie === 'function') values = res.headers.getSetCookie();
    if (!values.length) { const s = res.headers.get('set-cookie'); if (s) values = s.split(/,(?=[^;,]+=)/g); }
    for (const v of values) { const pair = v.split(';', 1)[0]; const i = pair.indexOf('='); if (i > 0) jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim()); }
  }
  function cookieHeader() { return [...jar].map(([k,v]) => `${k}=${v}`).join('; '); }
  async function get(url, referer = 'https://store.line.me/') {
    const headers = { ...baseHeaders, Referer: referer };
    const cookies = cookieHeader();
    if (cookies) headers.Cookie = cookies;
    const res = await fetch(url, { headers, redirect: 'follow', cache: 'no-store' });
    updateCookies(res);
    const html = await res.text();
    return { res, html, cookieNames: [...jar.keys()] };
  }
  return { get };
}

function productIds(html, type) {
  const re = type === 'emojishop'
    ? /\/emojishop\/product\/(\d+)\/(?:ja|en|ko|th|zh-Hant|zh-Hans|id)/gi
    : /\/stickershop\/product\/(\d+)\/(?:ja|en|ko|th|zh-Hant|zh-Hans|id)/gi;
  return [...new Set([...html.matchAll(re)].map(m => m[1]))];
}
function title(html) { return (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/\s+/g, ' ').trim(); }
function hash(html) { return crypto.createHash('sha256').update(html).digest('hex').slice(0, 16); }
function visibleCount(html) {
  const normalized = html.replace(/\s+/g, ' ');
  const authorHeader = normalized.match(/data-test=["']author-name["'][\s\S]{0,500}?<span>\s*([0-9,]+)\s*件\s*<\/span>/i);
  if (authorHeader) return Number(authorHeader[1].replace(/,/g, ''));
  const generic = normalized.match(/<span>\s*([0-9,]+)\s*件\s*<\/span>/i);
  return generic ? Number(generic[1].replace(/,/g, '')) : null;
}
function pager(html) {
  const normalized = html.replace(/\s+/g, ' ');
  const m = normalized.match(/<nav[^>]+class=["'][^"']*MdCMN14Pagination[^"']*["'][^>]*>([\s\S]*?)<\/nav>/i);
  return m ? m[1].replace(/\s+/g, ' ').trim().slice(0, 1000) : '(none)';
}
function crossShopAuthorLinks(html) {
  const out = new Set();
  for (const m of html.matchAll(/href=["']([^"']*(?:stickershop|emojishop)\/author\/\d+\/[^"']*)["']/gi)) out.add(m[1].replace(/&amp;/g, '&'));
  return [...out];
}

for (const target of TARGETS) {
  const session = createSession();
  console.log(`\n######## ${target.name} ########`);
  let referer = 'https://store.line.me/';
  for (const suffix of ['', '?page=1', '?page=2', '?page=3', '?page=4']) {
    const url = `${target.base}${suffix}`;
    try {
      const { res, html, cookieNames } = await session.get(url, referer);
      const ids = productIds(html, target.type);
      console.log(`URL ${url}`);
      console.log('status', res.status, 'final', res.url, 'bytes', Buffer.byteLength(html), 'hash', hash(html));
      console.log('title', JSON.stringify(title(html)), 'visibleCount', visibleCount(html), 'products', ids.length);
      console.log('firstIds', ids.slice(0, 8).join(','), 'cookies', cookieNames.join(',') || '(none)');
      console.log('pager', JSON.stringify(pager(html)));
      if (!suffix) console.log('crossShopAuthorLinks', JSON.stringify(crossShopAuthorLinks(html)));
      referer = url;
    } catch (error) {
      console.log(`URL ${url}`);
      console.log('ERROR', error.message);
    }
  }
}
