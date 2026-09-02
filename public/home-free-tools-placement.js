(()=>{
  const path=location.pathname;
  let loc='ja';
  for(const l of ['en','zh-tw','th','id']) if(path===`/${l}`||path.startsWith(`/${l}/`)){loc=l;break}
  const prefix=loc==='ja'?'':`/${loc}`;
  const isHome=path===`${prefix}/`||path===prefix||(!prefix&&path==='/');
  if(!isHome)return;

  const copy={
    ja:'無料ツール集を見る →',
    en:'Browse all free tools →',
    'zh-tw':'查看所有免費工具 →',
    th:'ดูเครื่องมือฟรีทั้งหมด →',
    id:'Lihat semua alat gratis →'
  }[loc]||'無料ツール集を見る →';

  function style(){
    if(document.getElementById('sm-home-tools-placement-style'))return;
    const s=document.createElement('style');
    s.id='sm-home-tools-placement-style';
    s.textContent=`
      .sm-home-tools-zone{margin:88px 0 0!important;padding:0!important}
      .sm-home-tools-zone>a,.sm-home-tools-zone a{color:inherit!important;text-decoration:none!important}
      .sm-home-tools-zone .sm-color-promo,.sm-home-tools-zone .sm-image-tool-promo,.sm-home-tools-zone .sm-seal-home{margin:0 0 18px!important}
      .sm-home-tools-all{display:flex!important;align-items:center!important;justify-content:center!important;width:fit-content!important;min-height:46px!important;margin:22px auto 0!important;padding:0 22px!important;border:1px solid #171717!important;border-radius:999px!important;background:#171717!important;color:#fff!important;text-decoration:none!important;font-size:12px!important;font-weight:900!important;line-height:1!important;box-shadow:none!important}
      .sm-home-tools-all:hover{opacity:.86!important;transform:none!important}
      @media(max-width:640px){.sm-home-tools-zone{margin-top:64px!important}.sm-home-tools-all{width:100%!important;min-height:48px!important}}
    `;
    document.head.appendChild(s);
  }

  function move(){
    const main=document.querySelector('main.main')||document.querySelector('main');
    const hero=main?.querySelector('.hero');
    const stickers=main?.querySelector('#stickers');
    const intro=main?.querySelector('.intro');
    if(!main||!hero||!stickers||!intro)return false;

    let zone=main.querySelector('.sm-home-tools-zone');
    if(!zone){
      zone=document.createElement('section');
      zone.className='sm-home-tools-zone';
      intro.insertAdjacentElement('beforebegin',zone);
    }

    const candidates=[];
    let node=hero.nextElementSibling;
    while(node&&node!==stickers){
      const next=node.nextElementSibling;
      if(node!==zone)candidates.push(node);
      node=next;
    }
    candidates.forEach(el=>zone.appendChild(el));

    document.querySelectorAll('.sm-color-promo,.sm-image-tool-promo,.sm-seal-home').forEach(el=>{
      if(!zone.contains(el))zone.appendChild(el);
    });

    if(!zone.querySelector('.sm-home-tools-all')){
      const a=document.createElement('a');
      a.className='sm-home-tools-all';
      a.href=`${prefix}/tools/`;
      a.textContent=copy;
      zone.appendChild(a);
    }
    return true;
  }

  function run(){style();move()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{run();setTimeout(run,120);setTimeout(run,500)},{once:true});
  else{run();setTimeout(run,120);setTimeout(run,500)}
  let count=0;
  const mo=new MutationObserver(()=>{if(count++<20)run();else mo.disconnect()});
  mo.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(()=>mo.disconnect(),2500);
})();