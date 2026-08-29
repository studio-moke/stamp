import crypto from 'node:crypto';

const AUTHOR = 'https://store.line.me/stickershop/author/6507349/ja';
const jar = new Map();
const baseHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',
  'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'same-origin',
  'Upgrade-Insecure-Requests': '1',
};
function updateCookies(res) {
  let values = [];
  if (typeof res.headers.getSetCookie === 'function') values = res.headers.getSetCookie();
  if (!values.length) { const s = res.headers.get('set-cookie'); if (s) values = s.split(/,(?=[^;,]+=)/g); }
  for (const v of values) { const pair = v.split(';',1)[0]; const i = pair.indexOf('='); if (i > 0) jar.set(pair.slice(0,i).trim(), pair.slice(i+1).trim()); }
}
function cookieHeader() { return [...jar].map(([k,v]) => `${k}=${v}`).join('; '); }
function ids(html) { return [...new Set([...html.matchAll(/\/stickershop\/product\/(\d+)\/(?:ja|en|ko|th|zh-Hant|zh-Hans)/gi)].map(m => m[1]))]; }
function title(html) { return (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/\s+/g,' ').trim(); }
function hash(html) { return crypto.createHash('sha256').update(html).digest('hex').slice(0,16); }
function links(html) {
  const out = new Set();
  for (const m of html.matchAll(/href=["']([^"']+)["']/gi)) { const h=m[1].replace(/&amp;/g,'&'); if (/author\/6507349|(?:\?|&)(?:page|offset|start)=/i.test(h)) out.add(h); }
  return [...out].slice(0,80);
}
function snippets(html) {
  const normalized = html.replace(/\s+/g,' ');
  const needles = ['MdCMN14Pagination','pagination','data-page','data-offset','data-start','author-item'];
  const out=[];
  for (const needle of needles) {
    let from=0;
    for (let n=0;n<4;n++) {
      const i=normalized.toLowerCase().indexOf(needle.toLowerCase(),from);
      if (i<0) break;
      out.push(`${needle}: ${normalized.slice(Math.max(0,i-500),Math.min(normalized.length,i+1500))}`);
      from=i+needle.length;
    }
  }
  return out;
}
function attrs(html) {
  const out = new Set();
  for (const m of html.matchAll(/\b(?:data-[\w-]+|name|value|action|method)=["'][^"']*["']/gi)) {
    if (/page|offset|start|author|cursor|limit|next|prev|stick|product|item/i.test(m[0])) out.add(m[0]);
    if (out.size>=120) break;
  }
  return [...out];
}
function scripts(html) { return [...new Set([...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m=>m[1].replace(/&amp;/g,'&')))]; }
async function get(url, referer) {
  const headers={...baseHeaders, Referer:referer||'https://store.line.me/'}; const c=cookieHeader(); if(c) headers.Cookie=c;
  const res=await fetch(url,{headers,redirect:'follow',cache:'no-store'}); updateCookies(res); const html=await res.text(); return {res,html};
}

const urls=[AUTHOR,`${AUTHOR}?page=1`,`${AUTHOR}?page=2`,`${AUTHOR}?page=3`,`${AUTHOR}?page=4`];
let prev='https://store.line.me/';
for (const url of urls) {
  const {res,html}=await get(url,prev); const productIds=ids(html);
  console.log('\n===',url,'===');
  console.log('status',res.status,'final',res.url,'bytes',Buffer.byteLength(html),'hash',hash(html),'products',productIds.length);
  console.log('title',JSON.stringify(title(html)),'cookies',[...jar.keys()].join(',')||'(none)');
  console.log('firstIds',productIds.slice(0,10).join(','));
  console.log('paginationLinks',JSON.stringify(links(html)));
  if (url===AUTHOR) {
    console.log('ATTRS',JSON.stringify(attrs(html)));
    console.log('SCRIPTS',JSON.stringify(scripts(html)));
    for (const s of snippets(html)) console.log('SNIPPET',s);
  }
  prev=url;
}
