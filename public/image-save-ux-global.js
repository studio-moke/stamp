(()=>{
  const isAppleMobile=()=>/iPhone|iPad|iPod/i.test(navigator.userAgent||'')||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if(!isAppleMobile())return;

  const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const isImageHref=href=>href.startsWith('blob:')||href.startsWith('data:image/');

  async function hrefToBlob(href){
    if(!isImageHref(href))return null;
    const r=await fetch(href);
    if(!r.ok)throw new Error('image fetch failed');
    return r.blob();
  }

  function filenameFromDisposition(value,fallback){
    const v=String(value||'');
    const utf=v.match(/filename\*=UTF-8''([^;]+)/i);
    if(utf){try{return decodeURIComponent(utf[1])}catch{}}
    const plain=v.match(/filename="?([^";]+)"?/i);
    return plain?.[1]||fallback;
  }

  function preview(blob,name,pokekara){
    document.getElementById('sm-ios-save')?.remove();
    const url=URL.createObjectURL(blob),m=document.createElement('div');
    m.id='sm-ios-save';
    m.innerHTML=`<div class="smis-bg"></div><div class="smis-card"><button class="smis-x" type="button" aria-label="閉じる">×</button><h2>iPhoneに画像を保存</h2><p>下の画像を長押しして、<b>「写真に保存」または「写真に追加」</b>を選んでください。</p>${pokekara?'<p class="smis-poke">ポケカラで使う場合は「写真」に保存すると、そのまま写真ライブラリから選べます。</p>':''}<img src="${url}" alt="保存する画像"><a data-sm-ios-fallback="1" href="${url}" download="${esc(name)}">うまくいかない場合：ファイルとして保存</a></div><style>#sm-ios-save{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:14px}.smis-bg{position:absolute;inset:0;background:#000b}.smis-card{position:relative;width:min(560px,100%);max-height:94vh;overflow:auto;background:#fff;border-radius:20px;padding:20px;text-align:center;color:#171717}.smis-x{position:absolute;right:9px;top:7px;border:0;background:none;font-size:30px}.smis-card h2{font-size:20px;margin:3px 30px 9px}.smis-card p{font-size:13px;line-height:1.7}.smis-poke{background:#f5f3ee;border-radius:12px;padding:10px}.smis-card img{display:block;max-width:100%;max-height:58vh;object-fit:contain;margin:14px auto}.smis-card a{display:block;border:1px solid #bbb;border-radius:12px;padding:13px;color:#222;text-decoration:none;font-size:12px;font-weight:700}</style>`;
    document.body.appendChild(m);
    const close=()=>{m.remove();URL.revokeObjectURL(url)};
    m.querySelector('.smis-x').onclick=close;
    m.querySelector('.smis-bg').onclick=close;
  }

  async function saveBlob(blob,name,{pokekara=false}={}){
    if(!blob||!String(blob.type||'').startsWith('image/'))throw new Error('not image');
    const ext=blob.type.includes('jpeg')?'jpg':blob.type.includes('webp')?'webp':'png';
    const safeName=name||`stamp-moke-${Date.now()}.${ext}`;
    const file=new File([blob],safeName,{type:blob.type});
    if(navigator.share&&navigator.canShare){
      try{
        if(navigator.canShare({files:[file]})){
          await navigator.share({files:[file],title:safeName});
          return;
        }
      }catch(err){
        if(err?.name==='AbortError')return;
      }
    }
    preview(blob,safeName,pokekara);
  }

  async function handleAnchor(a){
    if(!a||a.dataset.smIosFallback==='1')return false;
    const href=a.href||'';
    if(!isImageHref(href))return false;
    const blob=await hrefToBlob(href);
    const name=a.getAttribute('download')||'';
    await saveBlob(blob,name,{pokekara:location.pathname.includes('/free/')});
    return true;
  }

  document.addEventListener('click',async e=>{
    const a=e.target.closest?.('a[download]');
    if(!a||a.dataset.smIosFallback==='1'||!isImageHref(a.href||''))return;
    e.preventDefault();
    e.stopImmediatePropagation();
    try{await handleAnchor(a)}catch{location.href=a.href}
  },true);

  const nativeAnchorClick=HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click=function(){
    if(this.dataset.smIosFallback!=='1'&&this.hasAttribute('download')&&isImageHref(this.href||'')){
      handleAnchor(this).catch(()=>nativeAnchorClick.call(this));
      return;
    }
    return nativeAnchorClick.call(this);
  };

  document.addEventListener('submit',async e=>{
    const form=e.target;
    if(!(form instanceof HTMLFormElement))return;
    const action=new URL(form.action||location.href,location.href);
    if(!action.pathname.endsWith('/api/free-download'))return;
    if(!form.checkValidity())return;
    e.preventDefault();
    e.stopImmediatePropagation();
    try{
      const params=new URLSearchParams(new FormData(form));
      const url=`${action.pathname}?${params.toString()}`;
      const r=await fetch(url,{credentials:'same-origin'});
      if(!r.ok)throw new Error('download failed');
      const blob=await r.blob();
      const slug=params.get('slug')||'stamp-moke-free-asset';
      const fallback=`${slug}.${blob.type.includes('jpeg')?'jpg':blob.type.includes('webp')?'webp':'png'}`;
      const name=filenameFromDisposition(r.headers.get('content-disposition'),fallback);
      await saveBlob(blob,name,{pokekara:true});
    }catch(_){
      HTMLFormElement.prototype.submit.call(form);
    }
  },true);

  window.stampMokeSaveImage=saveBlob;
})();