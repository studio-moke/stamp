(() => {
  const p=location.pathname;
  let loc='ja';
  for(const l of ['en','zh-tw','th','id']) if(p===`/${l}`||p.startsWith(`/${l}/`)){loc=l;break}
  const labels={ja:'画像圧縮',en:'Image Tool','zh-tw':'圖片壓縮',th:'บีบอัดรูป',id:'Kompres Gambar'};
  const href='/image-compressor/';
  function add(){
    const h=document.querySelector('.sm-site-header'); if(!h)return;
    const nav=h.querySelector('.sm-site-actions');
    if(nav&&!nav.querySelector(`a[href="${href}"]`)){
      const a=document.createElement('a');a.href=href;a.className='sm-site-link sm-site-tool sm-site-hide-tablet';a.textContent=labels[loc]||labels.ja;
      const lang=nav.querySelector('.sm-language');nav.insertBefore(a,lang||null);
    }
    const mobile=h.querySelector('.sm-mobile-menu-nav');
    if(mobile&&!mobile.querySelector(`a[href="${href}"]`)){
      const a=document.createElement('a');a.href=href;a.innerHTML=`<strong>${labels[loc]||labels.ja}</strong><span>→</span>`;mobile.appendChild(a);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(add,0),{once:true});else setTimeout(add,0);
})();
