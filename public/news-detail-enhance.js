(()=>{
  const cleanBody=body=>{
    if(!body)return;
    const before=body.textContent||'';
    const cleaned=before
      .replace(/\s*詳しくはこちら\s*[：:]\s*(?:https?:\/\/\S+|\/\S+)\s*/giu,' ')
      .replace(/[ \t]{2,}/g,' ')
      .replace(/\n{3,}/g,'\n\n')
      .trim();
    if(before!==cleaned)body.textContent=cleaned;
  };

  const enhance=()=>{
    const article=document.getElementById('smn-article');
    if(!article)return;
    cleanBody(article.querySelector('.smn-body'));
    if(article.querySelector('.smn-detail-thumb'))return;
    const cta=article.querySelector('.smn-cta');
    if(!cta)return;
    let path='';
    try{path=new URL(cta.getAttribute('href')||'',location.origin).pathname.replace(/\/+$/,'')}catch{return}
    const m=path.match(/^\/free\/([^/]+)$/);
    if(!m)return;
    let slug=m[1];
    try{slug=decodeURIComponent(slug)}catch{}
    const figure=document.createElement('figure');
    figure.className='smn-detail-thumb';
    const img=document.createElement('img');
    img.src=`/api/free?route=preview&slug=${encodeURIComponent(slug)}`;
    img.alt=article.querySelector('h1')?.textContent?.trim()||'フリー素材のプレビュー';
    img.loading='eager';
    img.decoding='async';
    figure.appendChild(img);
    const body=article.querySelector('.smn-body');
    if(body)body.before(figure);else cta.before(figure);
  };

  const style=document.createElement('style');
  style.textContent='.smn-detail-thumb{margin:26px 0 24px}.smn-detail-thumb img{display:block;width:100%;max-height:520px;object-fit:contain;background:#f5f6f5;border:1px solid #e1e7e3;border-radius:18px}';
  document.head.appendChild(style);
  new MutationObserver(enhance).observe(document.documentElement,{subtree:true,childList:true,characterData:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
})();