(()=>{
  const locales=['en','zh-tw','zh-cn','ko','th','id'];
  const p=location.pathname||'/';
  const first=p.split('/').filter(Boolean)[0];
  const loc=locales.includes(first)?first:'ja';
  const prefix=loc==='ja'?'':`/${loc}`;
  const isHome=p==='/'||p===prefix||p===`${prefix}/`;
  if(!isHome)return;
  const COPY={
    ja:{title:'新着ニュース',all:'すべて見る →',loading:'NEWSを読み込んでいます…',empty:'まだNEWSはありません。',error:'NEWSを読み込めませんでした。'},
    en:{title:'Latest News',all:'View all →',loading:'Loading news…',empty:'No news yet.',error:'Could not load news.'},
    'zh-tw':{title:'最新消息',all:'查看全部 →',loading:'正在載入消息…',empty:'目前沒有消息。',error:'無法載入消息。'},
    'zh-cn':{title:'最新消息',all:'查看全部 →',loading:'正在加载消息…',empty:'目前没有消息。',error:'无法加载消息。'},
    ko:{title:'새 소식',all:'전체 보기 →',loading:'소식을 불러오는 중…',empty:'아직 소식이 없습니다.',error:'소식을 불러올 수 없습니다.'},
    th:{title:'ข่าวล่าสุด',all:'ดูทั้งหมด →',loading:'กำลังโหลดข่าว…',empty:'ยังไม่มีข่าว',error:'โหลดข่าวไม่ได้'},
    id:{title:'Berita terbaru',all:'Lihat semua →',loading:'Memuat berita…',empty:'Belum ada berita.',error:'Berita tidak dapat dimuat.'}
  }[loc];
  const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const CACHE_KEY=`stamp-moke-home-news-v3-${loc}`;
  const newsUrl=slug=>`${prefix}/news/?slug=${encodeURIComponent(slug)}`;
  function style(){
    if(document.getElementById('sm-home-news-style'))return;
    const s=document.createElement('style');
    s.id='sm-home-news-style';
    s.textContent=`
      .sm-home-feature-grid{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(360px,.92fr);gap:22px;align-items:stretch;margin-top:64px}
      .sm-home-feature-grid>.sm-news-home,.sm-home-feature-grid>.sm-chat-icons-promo{margin:0;min-width:0;height:100%}
      .sm-news-home{padding:28px;border:1px solid #deddd8;border-radius:24px;background:#fff;box-shadow:0 12px 35px rgba(42,40,32,.04);min-width:0}
      .sm-news-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid #eceae4}
      .sm-news-k{display:block;margin-bottom:6px;color:#777;font-size:9px;font-weight:900;letter-spacing:.18em}
      .sm-news-title{margin:0;font-size:30px;line-height:1;font-weight:900;letter-spacing:-.03em}
      .sm-news-actions{display:flex;align-items:center;gap:12px;flex:none}
      .sm-news-all,.sm-news-rss{color:#171717!important;text-decoration:none!important;font-size:11px;font-weight:900}
      .sm-news-rss{display:inline-flex;align-items:center;gap:5px;padding:6px 9px;border:1px solid #deddd8;border-radius:999px;background:#faf9f5}
      .sm-news-list{display:grid;min-width:0}
      .sm-news-row{display:grid;grid-template-columns:90px 88px minmax(0,1fr) 18px;gap:12px;align-items:center;min-width:0;padding:12px 0;border-bottom:1px solid #efeee9;color:#171717!important;text-decoration:none!important}
      .sm-news-row:last-child{border-bottom:0}
      .sm-news-date{color:#777;font-size:10px;white-space:nowrap}
      .sm-news-label{display:inline-flex;justify-content:center;min-width:0;padding:5px 7px;border-radius:999px;background:#f1f0eb;font-size:9px;font-weight:900;white-space:nowrap}
      .sm-news-text{min-width:0;font-size:12px;font-weight:800;line-height:1.45;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .sm-news-arrow{font-size:15px;text-align:right}
      .sm-news-empty{padding:12px 0;color:#888;font-size:11px}
      @media(max-width:980px){.sm-home-feature-grid{grid-template-columns:1fr}.sm-home-feature-grid>.sm-news-home,.sm-home-feature-grid>.sm-chat-icons-promo{height:auto}}
      @media(max-width:640px){
        .sm-home-feature-grid{margin-top:48px;gap:14px}
        .sm-news-home{padding:20px;border-radius:20px}
        .sm-news-head{align-items:center}.sm-news-title{font-size:25px}.sm-news-actions{gap:8px}.sm-news-all{display:none}.sm-news-rss{font-size:10px}
        .sm-news-row{grid-template-columns:72px 72px minmax(0,1fr) 16px;gap:7px;padding:11px 0}
        .sm-news-date{font-size:9px}.sm-news-label{font-size:8px;padding:4px 5px}.sm-news-text{font-size:10px}
      }
    `;
    document.head.appendChild(s);
  }
  function announce(sec){
    document.dispatchEvent(new CustomEvent('sm:content-ready',{detail:{root:sec}}));
    document.dispatchEvent(new CustomEvent('sm:news-ready',{detail:{root:sec}}));
  }
  function render(box,rows){
    box.innerHTML=rows.length?rows.map(n=>`<a class="sm-news-row" href="${newsUrl(n.slug)}" title="${esc(n.title)}"><span class="sm-news-date">${esc((n.date||'').replaceAll('-','/'))}</span><span class="sm-news-label">${esc(n.label)}</span><span class="sm-news-text">${esc(n.title)}</span><span class="sm-news-arrow">→</span></a>`).join(''):`<div class="sm-news-empty">${esc(COPY.empty)}</div>`;
  }
  async function build(){
    const anchor=document.querySelector('main .news-callout');
    if(!anchor||document.querySelector('.sm-news-home'))return;
    const sec=document.createElement('section');
    sec.className='sm-news-home';
    sec.innerHTML=`<div class="sm-news-head"><div><span class="sm-news-k">NEWS / stamp moke</span><h2 class="sm-news-title">${esc(COPY.title)}</h2></div><div class="sm-news-actions"><a class="sm-news-rss" href="/feed.xml" type="application/rss+xml" aria-label="stamp moke NEWS RSS">RSS</a><a class="sm-news-all" href="${prefix}/news/">${esc(COPY.all)}</a></div></div><div class="sm-news-list"><div class="sm-news-empty">${esc(COPY.loading)}</div></div>`;
    anchor.replaceWith(sec);
    announce(sec);
    const box=sec.querySelector('.sm-news-list');
    try{const cached=JSON.parse(localStorage.getItem(CACHE_KEY)||'[]');if(Array.isArray(cached)&&cached.length)render(box,cached)}catch{}
    try{
      const r=await fetch('/api/news?limit=5&sync=0',{cache:'force-cache'});
      const d=await r.json();
      const rows=d.items||[];
      render(box,rows);
      document.dispatchEvent(new CustomEvent('sm:content-ready',{detail:{root:sec}}));
      try{localStorage.setItem(CACHE_KEY,JSON.stringify(rows))}catch{}
    }catch{if(!box.querySelector('.sm-news-row'))box.innerHTML=`<div class="sm-news-empty">${esc(COPY.error)}</div>`}
  }
  function run(){style();build()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();