(()=>{
  const isAppleMobile=()=>/iPhone|iPad|iPod/i.test(navigator.userAgent||'')||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if(!isAppleMobile())return;
  const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function toBlob(href){
    if(href.startsWith('blob:'))return fetch(href).then(r=>r.blob());
    if(href.startsWith('data:image/'))return fetch(href).then(r=>r.blob());
    return null;
  }
  function preview(blob,name,pokekara){
    document.getElementById('sm-ios-save')?.remove();
    const url=URL.createObjectURL(blob),m=document.createElement('div');m.id='sm-ios-save';m.innerHTML=`<div class="smis-bg"></div><div class="smis-card"><button class="smis-x" aria-label="閉じる">×</button><h2>iPhoneに画像を保存</h2><p>下の画像を長押しして、<b>「写真に保存」または「写真に追加」</b>を選んでください。</p>${pokekara?'<p class="smis-poke">ポケカラで使う場合は「写真」に保存すると、そのまま写真ライブラリから選べます。</p>':''}<img src="${url}" alt="保存する画像"><a href="${url}" download="${esc(name)}">うまくいかない場合：ファイルとして保存</a></div><style>#sm-ios-save{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:14px}.smis-bg{position:absolute;inset:0;background:#000b}.smis-card{position:relative;width:min(560px,100%);max-height:94vh;overflow:auto;background:#fff;border-radius:20px;padding:20px;text-align:center;color:#171717}.smis-x{position:absolute;right:9px;top:7px;border:0;background:none;font-size:30px}.smis-card h2{font-size:20px;margin:3px 30px 9px}.smis-card p{font-size:13px;line-height:1.7}.smis-poke{background:#f5f3ee;border-radius:12px;padding:10px}.smis-card img{display:block;max-width:100%;max-height:58vh;object-fit:contain;margin:14px auto}.smis-card a{display:block;border:1px solid #bbb;border-radius:12px;padding:13px;color:#222;text-decoration:none;font-size:12px;font-weight:700}</style>`;document.body.appendChild(m);
    const close=()=>{m.remove();URL.revokeObjectURL(url)};m.querySelector('.smis-x').onclick=close;m.querySelector('.smis-bg').onclick=close;
  }
  document.addEventListener('click',async e=>{
    const a=e.target.closest('a[download]');if(!a||a.dataset.smIosFallback==='1')return;
    const href=a.href||'';if(!href.startsWith('blob:')&&!href.startsWith('data:image/'))return;
    e.preventDefault();e.stopImmediatePropagation();
    try{
      const blob=await toBlob(href);if(!blob||!blob.type.startsWith('image/')){location.href=href;return}
      const name=a.getAttribute('download')||`stamp-moke-${Date.now()}.${blob.type.includes('jpeg')?'jpg':'png'}`;
      const file=new File([blob],name,{type:blob.type});
      if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
        try{await navigator.share({files:[file],title:name});return}catch(err){if(err?.name==='AbortError')return}
      }
      preview(blob,name,location.pathname.startsWith('/free/')||location.pathname.includes('/free/'));
    }catch(_){location.href=href}
  },true);
})();