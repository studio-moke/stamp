(()=>{
  const path=location.pathname;
  let loc='ja';
  for(const l of ['en','zh-tw','th','id']) if(path===`/${l}`||path.startsWith(`/${l}/`)){loc=l;break}
  const prefix=loc==='ja'?'':`/${loc}`;
  const isHome=path===`${prefix}/`||path===prefix||(!prefix&&path==='/');
  if(!isHome)return;

  const C={
    ja:{k:'FREE TOOLS / stamp moke',title:'無料ツール',lead:'画像加工・漫画素材・QR・配色など。気になるツールを横に流しながら選べます。',all:'無料ツールをすべて見る →'},
    en:{k:'FREE TOOLS / stamp moke',title:'Free Tools',lead:'Image tools, manga effects, QR codes, palettes and more. Browse them in a moving rail.',all:'Browse all free tools →'},
    'zh-tw':{k:'FREE TOOLS / stamp moke',title:'免費工具',lead:'圖片處理、漫畫素材、QR、配色等工具，從橫向滑動列中快速選擇。',all:'查看所有免費工具 →'},
    th:{k:'FREE TOOLS / stamp moke',title:'เครื่องมือฟรี',lead:'เครื่องมือรูป มังงะ QR พาเลตสี และอื่น ๆ เลือกได้จากแถบเลื่อนแนวนอน',all:'ดูเครื่องมือฟรีทั้งหมด →'},
    id:{k:'FREE TOOLS / stamp moke',title:'Alat Gratis',lead:'Alat gambar, manga, QR, palet warna, dan lainnya. Jelajahi lewat baris yang bergerak.',all:'Lihat semua alat gratis →'}
  }[loc];

  const names={
    ja:[['集中線','漫画の集中線を作る','/manga-speed-lines/','線'],['効果線','漫画のスピード・効果線','/manga-effect-lines/','効'],['トーン','漫画トーンを生成','/manga-tone-maker/','網'],['フキダシ','漫画フキダシを作る','/manga-speech-bubble/','吹'],['効果音','漫画の効果音文字','/manga-sfx/','音'],['ポップアート','写真をポップアート風に','/pop-art-maker/','POP'],['ドット絵','画像をピクセルアートに','/pixel-art-maker/','PIX'],['ステッカー','画像をステッカー風に','/sticker-maker/','ST'],['チャットスタンプ','文字から社内チャット用スタンプ','/chat-stamp-maker','Aa'],['画像圧縮','画像容量を軽くする','/image-compressor/','KB'],['画像サイズ変更','幅・高さを指定してリサイズ','/image-resizer/','↔'],['背景透過PNG','背景を透明にしてPNG保存','/png-transparent/','透'],['カラーパレット','画像から配色を抽出','/color-palette/','#'],['QRコード','かわいいQRコードを作る','/qr-maker','QR'],['電子印鑑・落款','透過PNGの印影を作る','/seal-maker/','印']],
    en:[['Speed Lines','Create manga speed lines','/manga-speed-lines/','LINE'],['Effect Lines','Create manga action lines','/manga-effect-lines/','FX'],['Manga Tone','Generate manga screen tones','/manga-tone-maker/','DOT'],['Speech Bubble','Create manga speech bubbles','/manga-speech-bubble/','POP'],['Manga SFX','Create manga sound effects','/manga-sfx/','SFX'],['Pop Art','Turn images into pop art','/pop-art-maker/','POP'],['Pixel Art','Convert images to pixel art','/pixel-art-maker/','PIX'],['Sticker Maker','Make sticker-style images','/sticker-maker/','ST'],['Chat Stamp','Create chat stamps from text','/chat-stamp-maker','Aa'],['Image Compressor','Reduce image file size','/image-compressor/','KB'],['Image Resizer','Resize by width and height','/image-resizer/','↔'],['Transparent PNG','Remove backgrounds to PNG','/png-transparent/','PNG'],['Color Palette','Extract colors from images','/color-palette/','#'],['QR Code','Create custom QR codes','/qr-maker','QR'],['Seal Maker','Create transparent PNG seals','/seal-maker/','印']]
  };
  const tools=names[loc]||names.en;

  function esc(s){return String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}

  function style(){
    if(document.getElementById('sm-home-tools-placement-style'))return;
    const s=document.createElement('style');s.id='sm-home-tools-placement-style';s.textContent=`
      .sm-home-tools-rail{margin:95px 0 0;padding:0;overflow:hidden}
      .sm-htr-head{display:flex;align-items:flex-end;justify-content:space-between;gap:28px;margin-bottom:20px;padding-bottom:18px;border-bottom:1px solid #dddcd8}
      .sm-htr-k{display:block;margin-bottom:8px;color:#777;font-size:10px;font-weight:800;letter-spacing:.18em}
      .sm-htr-title{margin:0;font-size:36px;line-height:1;font-weight:900;letter-spacing:-.03em}
      .sm-htr-lead{max-width:510px;margin:0;color:#777;font-size:12px;line-height:1.75;text-align:right}
      .sm-htr-viewport{position:relative;overflow:hidden;margin-inline:calc(50% - 50vw);padding:4px 0 10px}
      .sm-htr-viewport:before,.sm-htr-viewport:after{content:"";position:absolute;top:0;bottom:0;width:max(24px,calc((100vw - min(1180px,90vw))/2));z-index:3;pointer-events:none}
      .sm-htr-viewport:before{left:0;background:linear-gradient(90deg,#f7f6f2,transparent)}
      .sm-htr-viewport:after{right:0;background:linear-gradient(270deg,#f7f6f2,transparent)}
      .sm-htr-track{display:flex;gap:14px;width:max-content;will-change:transform;animation:smToolMarquee 42s linear infinite}
      .sm-htr-viewport:hover .sm-htr-track,.sm-htr-viewport:focus-within .sm-htr-track{animation-play-state:paused}
      .sm-htr-card{display:grid;grid-template-columns:58px 1fr 28px;align-items:center;gap:12px;width:310px;min-height:104px;padding:16px 16px;border:1px solid #deddd8;border-radius:18px;background:#fff;color:#171717!important;text-decoration:none!important;box-shadow:0 8px 24px rgba(42,40,32,.035);transition:transform .18s,border-color .18s,box-shadow .18s}
      .sm-htr-card:hover{transform:translateY(-3px);border-color:#c9c7c0;box-shadow:0 13px 30px rgba(42,40,32,.08)}
      .sm-htr-icon{width:58px;height:58px;display:grid;place-items:center;border-radius:15px;background:#f2f0eb;color:#171717;font-size:12px;font-weight:900;font-style:normal}
      .sm-htr-copy{min-width:0}.sm-htr-copy strong{display:block;color:#171717;font-size:14px;line-height:1.35}.sm-htr-copy small{display:block;margin-top:5px;color:#777;font-size:10px;line-height:1.45}
      .sm-htr-arrow{width:28px;height:28px;display:grid;place-items:center;border-radius:50%;background:#171717;color:#fff;font-size:13px;font-weight:900}
      .sm-htr-footer{margin-top:24px;text-align:center}
      .sm-htr-all{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:46px!important;padding:0 21px!important;border:1px solid #171717!important;border-radius:999px!important;background:#171717!important;color:#fff!important;text-decoration:none!important;font-size:11px!important;font-weight:900!important;line-height:1!important}
      @keyframes smToolMarquee{from{transform:translateX(0)}to{transform:translateX(calc(-50% - 7px))}}
      @media(prefers-reduced-motion:reduce){.sm-htr-track{animation:none}.sm-htr-viewport{overflow-x:auto}.sm-htr-viewport:before,.sm-htr-viewport:after{display:none}}
      @media(max-width:640px){.sm-home-tools-rail{margin-top:72px}.sm-htr-head{display:block}.sm-htr-title{font-size:30px}.sm-htr-lead{margin-top:9px;text-align:left;font-size:11px}.sm-htr-card{width:260px;grid-template-columns:50px 1fr 26px;min-height:92px;padding:13px}.sm-htr-icon{width:50px;height:50px;border-radius:13px}.sm-htr-track{gap:10px;animation-duration:36s}.sm-htr-all{width:100%!important;min-height:48px!important}}
    `;document.head.appendChild(s);
  }

  function cleanOld(main,hero,stickers){
    let node=hero.nextElementSibling;
    while(node&&node!==stickers){const next=node.nextElementSibling;node.remove();node=next}
    main.querySelectorAll('.sm-color-promo,.sm-image-tool-promo,.sm-seal-home,.sm-home-tools-zone,.sm-free-home').forEach(el=>el.remove());
  }

  function build(){
    const main=document.querySelector('main.main')||document.querySelector('main');
    const hero=main?.querySelector('.hero');
    const stickers=main?.querySelector('#stickers');
    const intro=main?.querySelector('.intro');
    if(!main||!hero||!stickers||!intro)return false;
    cleanOld(main,hero,stickers);
    let sec=main.querySelector('.sm-home-tools-rail');
    if(sec)return true;
    sec=document.createElement('section');sec.className='sm-home-tools-rail';
    const cards=tools.map(([n,d,u,i])=>`<a class="sm-htr-card" href="${prefix}${u}"><i class="sm-htr-icon">${esc(i)}</i><span class="sm-htr-copy"><strong>${esc(n)}</strong><small>${esc(d)}</small></span><b class="sm-htr-arrow">→</b></a>`).join('');
    sec.innerHTML=`<div class="sm-htr-head"><div><span class="sm-htr-k">${esc(C.k)}</span><h2 class="sm-htr-title">${esc(C.title)}</h2></div><p class="sm-htr-lead">${esc(C.lead)}</p></div><div class="sm-htr-viewport" aria-label="${esc(C.title)}"><div class="sm-htr-track">${cards}${cards}</div></div><div class="sm-htr-footer"><a class="sm-htr-all" href="${prefix}/tools/">${esc(C.all)}</a></div>`;
    intro.insertAdjacentElement('beforebegin',sec);
    return true;
  }

  function run(){style();build()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{run();setTimeout(run,160);setTimeout(run,600)},{once:true});else{run();setTimeout(run,160);setTimeout(run,600)}
  let n=0;const mo=new MutationObserver(()=>{if(n++<24)run();else mo.disconnect()});mo.observe(document.documentElement,{childList:true,subtree:true});setTimeout(()=>mo.disconnect(),2800);
})();