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
      }
    `;
    document.head.appendChild(style);
  };

  const run=()=>{
    addHeroStyle();
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