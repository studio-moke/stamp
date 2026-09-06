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
      .sticker-card,.sticker-card:visited{background:#7696C4!important;border-color:#7696C4!important;color:#171717!important}
      .sticker-card strong{color:#171717!important}
      .hero-art .clover{aspect-ratio:1/1!important;border-radius:50%!important;overflow:hidden!important;background:#fff!important;display:grid!important;place-items:center!important}
      .hero-art .clover::before,.hero-art .clover::after{content:none!important;display:none!important}
      .hero-art .clover .sm-hero-official-logo{display:block;width:72%;height:72%;object-fit:contain}
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
        .hero-title{word-break:keep-all;overflow-wrap:normal}
        .hero-art .clover .sm-hero-official-logo{width:68%;height:68%}
      }
    `;
    document.head.appendChild(style);
  };

  const installOfficialHeroLogo=()=>{
    const clover=document.querySelector('.hero-art .clover');
    if(!clover||clover.querySelector('.sm-hero-official-logo'))return;
    const img=document.createElement('img');
    img.className='sm-hero-official-logo';
    img.src='/favicon.svg?v=20260904-6';
    img.alt='stamp moke';
    img.width=256;
    img.height=256;
    img.decoding='async';
    img.fetchPriority='high';
    clover.replaceChildren(img);
  };

  const removeRequestedBlocks=()=>{
    const pickup=document.querySelector('.pickup-card');
    if(pickup)pickup.closest('section')?.remove();
    document.querySelector('.main .about')?.remove();
  };

  const run=()=>{
    addHeroStyle();
    installOfficialHeroLogo();
    removeRequestedBlocks();
    const slugs=['shigoto','nichijo','doubutsu','omoshiro'];
    document.querySelectorAll('.category-grid .category-card').forEach((card,index)=>{
      if(slugs[index])card.setAttribute('href',`${prefix}/categories/${slugs[index]}/1`);
    });
    if(loc==='ja'){
      const title=document.querySelector('.hero-title');
      if(title)title.textContent='日常をちょっと楽しく。';
    }
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();