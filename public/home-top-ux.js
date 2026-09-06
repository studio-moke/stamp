(() => {
  const locales=['en','zh-tw','zh-cn','ko','th','id'];
  const first=(location.pathname||'/').split('/').filter(Boolean)[0];
  const loc=locales.includes(first)?first:'ja';
  const prefix=loc==='ja'?'':`/${loc}`;
  const home=location.pathname==='/'||location.pathname===prefix||location.pathname===`${prefix}/`;
  if(!home)return;

  const addHeroStyle=()=>{
    if(document.getElementById('sm-home-hero-fix'))return;
    const style=document.createElement('style');
    style.id='sm-home-hero-fix';
    style.textContent=`
      .main a:not(.btn):not(.more),.footer a{color:inherit!important}
      .more,.more:visited{color:#26935b!important;text-decoration:none!important}
      .free-card,.free-card:visited,.free-card strong,.free-card b{color:#171717!important;text-decoration:none!important}
      .sticker-card,.sticker-card:visited{background:#faf9f6!important;border-color:#e7e4de!important;color:#171717!important}
      .sticker-card img{background:#7696C4!important}
      .sticker-card strong{background:#faf9f6!important;color:#171717!important}
      .hero-art .clover{aspect-ratio:1/1!important;border-radius:50%!important;overflow:hidden!important;background:#fff!important;display:grid!important;place-items:center!important}
      .hero-art .clover::before,.hero-art .clover::after{content:none!important;display:none!important}
      .hero-art .clover .sm-hero-official-logo{display:block;width:78%;height:78%;object-fit:contain}
      .sm-brand-copy,.sm-mobile-kicker,.sm-mobile-quick,.sm-mobile-lang{display:none}

      @media (min-width: 1101px){
        .hero{grid-template-columns:minmax(0,1.55fr) minmax(300px,.75fr);gap:34px}
        .hero-title{font-size:clamp(54px,5.6vw,82px);line-height:1.04;letter-spacing:-.055em;word-break:keep-all;overflow-wrap:normal}
        html[lang="ja"] .hero-title{white-space:nowrap}
      }
      @media (min-width: 851px) and (max-width: 1100px){
        .hero{grid-template-columns:minmax(0,1.28fr) minmax(270px,.72fr);gap:28px}
        .hero-title{font-size:clamp(48px,5.7vw,64px);word-break:keep-all;overflow-wrap:normal}
        html[lang="ja"] .hero-title{white-space:nowrap}
      }

      @media (max-width: 850px){
        html,body{max-width:100%;overflow-x:hidden!important}
        body{background:#fbfaf6!important}
        .site-header{height:88px!important;padding:0 18px!important;box-shadow:0 1px 0 rgba(20,35,30,.04)}
        .brand{gap:10px!important;min-width:0}
        .brand-mark{width:48px!important;height:48px!important;border:0!important;background:transparent!important;border-radius:0!important;overflow:hidden;color:transparent!important;font-size:0!important;flex:0 0 48px!important}
        .brand-mark img{width:100%;height:100%;object-fit:contain;display:block}
        .brand-name{font-size:22px!important;letter-spacing:.045em!important;line-height:1.05!important;white-space:nowrap}
        .sm-brand-copy{display:block;margin-top:5px;color:#24313e;font-size:10px;font-weight:700;letter-spacing:.04em;white-space:nowrap}
        .header-actions{gap:8px!important}
        .sm-mobile-lang{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:800;color:#203042}
        .sm-mobile-lang::before{content:'◎';font-size:18px;line-height:1}
        .menu summary{width:48px!important;height:48px!important}
        .menu summary::before{font-size:23px!important}

        .main{padding:0 18px 72px!important;overflow:hidden!important;max-width:100%!important}
        .hero{position:relative!important;display:grid!important;grid-template-columns:minmax(0,1.12fr) minmax(108px,.88fr)!important;gap:8px!important;align-items:center!important;padding:38px 0 28px!important;min-height:455px!important;max-width:100%!important}
        .hero::before{inset:0 -18px -16px!important;background:radial-gradient(circle at 84% 35%,rgba(214,241,192,.88),transparent 29%),radial-gradient(circle at 18% 62%,rgba(255,255,255,.96),transparent 42%),linear-gradient(135deg,#fffdf8 0%,#f7f7ee 56%,#eaf6dd 100%)!important}
        .hero>div:first-child{position:relative;z-index:2;min-width:0!important;max-width:100%!important}
        .sm-mobile-kicker{display:block;margin:0 0 14px;color:#279a59;font-size:10px;font-weight:950;letter-spacing:.25em;white-space:nowrap}
        .hero-title{margin:0!important;font-size:clamp(38px,10.6vw,48px)!important;line-height:1.13!important;letter-spacing:-.055em!important;white-space:normal!important;word-break:keep-all!important;overflow-wrap:normal!important;max-width:100%!important;overflow:visible!important}
        .hero-title .sm-hero-accent{color:#28a35f}
        .hero-rule{width:56px!important;height:4px!important;margin:18px 0 16px!important}
        .hero-lead{font-size:13px!important;line-height:1.8!important;color:#565b59!important;max-width:310px!important}
        .hero-actions{grid-column:1/-1;display:grid!important;gap:10px!important;margin-top:22px!important}
        .btn{min-height:52px!important;font-size:14px!important;border-radius:999px!important}
        .btn-primary{background:linear-gradient(90deg,#20a259,#2fb267)!important;color:#fff!important;box-shadow:0 10px 26px rgba(39,160,92,.2)}
        .btn-secondary{background:rgba(255,255,255,.94)!important;border-color:#d9dbd3!important;color:#18283b!important}

        .hero-art{position:relative;z-index:1;min-height:0!important;align-self:center!important;transform:translate(2px,6px);min-width:0!important}
        .hero-art::before,.hero-art::after{content:'';position:absolute;z-index:-1;width:38px;height:20px;border-radius:100% 0 100% 0;background:linear-gradient(135deg,#d9f49d,#6cc63d);opacity:.85}
        .hero-art::before{right:0;top:8%;transform:rotate(-22deg)}
        .hero-art::after{left:0;bottom:6%;transform:rotate(32deg) scale(.8)}
        .hero-art .clover{width:min(39vw,176px)!important;min-width:118px!important;max-width:176px!important;box-shadow:0 22px 48px rgba(68,92,65,.14)!important}
        .hero-art .clover .sm-hero-official-logo{width:82%!important;height:82%!important;image-rendering:auto!important}

        .sm-mobile-quick{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:20px 0 2px;position:relative;z-index:3}
        .sm-mobile-quick a{min-width:0;min-height:92px;padding:12px 5px 10px;border:1px solid #ece9e1;border-radius:16px;background:rgba(255,255,255,.95);box-shadow:0 8px 22px rgba(29,42,37,.04);text-decoration:none!important;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#15243a!important}
        .sm-mobile-quick svg{width:27px;height:27px;margin-bottom:8px;stroke:#173351;stroke-width:1.8;fill:none;stroke-linecap:round;stroke-linejoin:round}
        .sm-mobile-quick strong{font-size:10px;line-height:1.3;white-space:nowrap}
        .sm-mobile-quick small{display:block;margin-top:4px;color:#777;font-size:8px;line-height:1.25;white-space:nowrap}

        .sm-mobile-hide{display:none!important}
        .sm-pickup-section{margin-top:38px!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important}
        .sm-pickup-section .section-head{display:flex!important;align-items:flex-end!important;justify-content:space-between!important;margin-bottom:16px!important}
        .sm-pickup-section .eyebrow{color:#279a59!important;font-size:9px!important;letter-spacing:.22em!important;margin-bottom:6px!important}
        .sm-pickup-section .section-title{font-size:27px!important;color:#15243a!important}
        .sm-pickup-section .more{margin:0!important;padding:9px 14px;border:1px solid #dfe3df;border-radius:999px;background:#fff;color:#15243a!important;font-size:10px!important}
        .sm-pickup-section .sticker-grid{display:grid!important;grid-auto-flow:column!important;grid-auto-columns:minmax(138px,44vw)!important;grid-template-columns:none!important;gap:10px!important;overflow-x:auto!important;padding:2px 1px 10px!important;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}
        .sm-pickup-section .sticker-card{scroll-snap-align:start;background:#fff!important;border-color:#e7e4de!important;border-radius:16px!important}
        .sm-pickup-section .sticker-card strong{font-size:11px!important;padding:9px 10px 12px!important}
      }

      @media (max-width: 390px){
        .brand-name{font-size:19px!important}.sm-brand-copy{font-size:9px}.sm-mobile-lang{display:none}
        .hero{grid-template-columns:minmax(0,1.17fr) minmax(96px,.83fr)!important;min-height:438px!important}
        .hero-title{font-size:clamp(35px,10.2vw,43px)!important}
        .hero-art .clover{width:min(36vw,150px)!important;min-width:106px!important}
        .sm-mobile-quick{gap:6px}.sm-mobile-quick a{padding-left:3px;padding-right:3px}.sm-mobile-quick strong{font-size:9px}.sm-mobile-quick small{font-size:7px}
      }
    `;
    document.head.appendChild(style);
  };

  const installOfficialHeroLogo=()=>{
    const clover=document.querySelector('.hero-art .clover');
    if(!clover)return;
    let img=clover.querySelector('.sm-hero-official-logo');
    if(!img){
      img=document.createElement('img');
      img.className='sm-hero-official-logo';
      img.alt='stamp moke';
      img.width=512;
      img.height=512;
      img.decoding='async';
      img.fetchPriority='high';
      clover.replaceChildren(img);
    }
    img.src='/images/stamp-moke-official-logo.png?v=20260906-3';
  };

  const installHeaderLogo=()=>{
    const mark=document.querySelector('.brand-mark');
    if(mark){
      let img=mark.querySelector('img');
      if(!img){
        img=document.createElement('img');
        img.alt='';
        img.width=64;
        img.height=64;
        img.decoding='async';
        mark.replaceChildren(img);
      }
      img.src='/images/stamp-moke-official-logo.png?v=20260906-3';
    }
    const name=document.querySelector('.brand-name');
    if(name&&!document.querySelector('.sm-brand-copy')){
      const wrap=document.createElement('span');
      wrap.className='sm-brand-text';
      name.parentNode.insertBefore(wrap,name);
      wrap.appendChild(name);
      const sub=document.createElement('span');
      sub.className='sm-brand-copy';
      sub.textContent=loc==='ja'?'スタンプで、ちょっと楽しい毎日を。':'Small joy, every day.';
      wrap.appendChild(sub);
    }
    const actions=document.querySelector('.header-actions');
    if(actions&&!actions.querySelector('.sm-mobile-lang')){
      const lang=document.createElement('span');
      lang.className='sm-mobile-lang';
      lang.textContent=loc==='ja'?'JP':loc.toUpperCase();
      actions.insertBefore(lang,actions.firstChild);
    }
  };

  const installMobileHeroCopy=()=>{
    const hero=document.querySelector('.hero');
    const title=hero?.querySelector('.hero-title');
    if(!hero||!title)return;
    if(!hero.querySelector('.sm-mobile-kicker')){
      const kicker=document.createElement('div');
      kicker.className='sm-mobile-kicker';
      kicker.textContent='SMALL JOY, EVERY DAY';
      title.parentNode.insertBefore(kicker,title);
    }
    if(loc==='ja')title.innerHTML='日常を<br>ちょっと<span class="sm-hero-accent">楽しく。</span>';
  };

  const quickIcon=(type)=>{
    if(type==='stickers')return '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="10"/><path d="M11 14c1.5-4 8.5-4 10 0M12 19c2.5 2 5.5 2 8 0"/></svg>';
    if(type==='free')return '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="6" width="22" height="20" rx="3"/><path d="m8 22 6-7 4 4 3-3 3 6"/><circle cx="21" cy="11" r="2"/></svg>';
    if(type==='tools')return '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M20 5a7 7 0 0 0-7 9L5 22l5 5 8-8a7 7 0 0 0 9-7l-5 5-5-5 5-5z"/></svg>';
    return '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 7h3l3 14h12l3-10H10"/><circle cx="13" cy="26" r="1.8"/><circle cx="23" cy="26" r="1.8"/></svg>';
  };

  const installMobileQuickNav=()=>{
    const hero=document.querySelector('.hero');
    if(!hero||document.querySelector('.sm-mobile-quick'))return;
    const nav=document.createElement('nav');
    nav.className='sm-mobile-quick';
    nav.setAttribute('aria-label','Quick links');
    const labels=loc==='ja'?
      [['stickers','LINEスタンプ','オリジナル作品',`${prefix}/stickers/`],['free','フリー素材','無料で使える',`${prefix}/free/`],['tools','便利ツール','すぐに使える',`${prefix}/tools/`],['goods','グッズ','SUZURIで販売',`${prefix}/goods/`]]:
      [['stickers','Stickers','Original',`${prefix}/stickers/`],['free','Free','Resources',`${prefix}/free/`],['tools','Tools','Useful',`${prefix}/tools/`],['goods','Goods','SUZURI',`${prefix}/goods/`]];
    nav.innerHTML=labels.map(([type,title,sub,href])=>`<a href="${href}">${quickIcon(type)}<strong>${title}</strong><small>${sub}</small></a>`).join('');
    hero.insertAdjacentElement('afterend',nav);
  };

  const prepareSections=()=>{
    const sections=[...document.querySelectorAll('.main > section.section')];
    const discover=sections.find(section=>section.querySelector('.category-grid'));
    const newSection=sections.find(section=>section.querySelector('.eyebrow')?.textContent.trim()==='NEW');
    if(discover)discover.classList.add('sm-mobile-hide');
    if(newSection)newSection.classList.add('sm-mobile-hide');
    const pickup=sections.find(section=>section.querySelector('.pickup-card'));
    if(pickup)pickup.classList.add('sm-pickup-section');
    document.querySelector('.main .about')?.remove();
    if(window.innerWidth>850&&pickup)pickup.remove();
  };

  const run=()=>{
    addHeroStyle();
    installOfficialHeroLogo();
    installHeaderLogo();
    installMobileHeroCopy();
    installMobileQuickNav();
    prepareSections();
    const slugs=['shigoto','nichijo','doubutsu','omoshiro'];
    document.querySelectorAll('.category-grid .category-card').forEach((card,index)=>{
      if(slugs[index])card.setAttribute('href',`${prefix}/categories/${slugs[index]}/1`);
    });
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();