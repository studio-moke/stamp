(() => {
  const locales=['en','zh-tw','zh-cn','ko','th','id'];
  const first=(location.pathname||'/').split('/').filter(Boolean)[0];
  const loc=locales.includes(first)?first:'ja';
  const prefix=loc==='ja'?'':`/${loc}`;
  const home=location.pathname==='/'||location.pathname===prefix||location.pathname===`${prefix}/`;
  if(!home)return;

  const run=()=>{
    const slugs=['shigoto','nichijo','doubutsu','omoshiro'];
    document.querySelectorAll('.category-grid .category-card').forEach((card,index)=>{
      if(slugs[index])card.setAttribute('href',`${prefix}/categories/${slugs[index]}/1/`);
    });
    document.querySelectorAll('.section').forEach((section)=>{
      const eyebrow=section.querySelector('.eyebrow');
      if(eyebrow?.textContent?.trim()==='PICK UP') section.remove();
    });
    document.querySelector('.about')?.remove();
    document.querySelector('.hero-art')?.remove();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();