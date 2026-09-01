(() => {
  if (!location.pathname.endsWith('/image-compressor/')) return;
  const blobMap = new Map();
  const origCreate = URL.createObjectURL.bind(URL);
  const origRevoke = URL.revokeObjectURL.bind(URL);
  URL.createObjectURL = (blob) => { const u = origCreate(blob); blobMap.set(u, blob); return u; };
  URL.revokeObjectURL = (u) => { origRevoke(u); };
  window.addEventListener('beforeunload', () => blobMap.clear());

  const esc = (s) => String(s).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const style = document.createElement('style');
  style.textContent = `.sm-live-preview{margin-top:14px;border:1px solid #e2e0da;border-radius:14px;overflow:hidden;background:#fff}.sm-live-preview-head{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:10px 11px;border-bottom:1px solid #ece9e2}.sm-live-preview-head strong{font-size:10px}.sm-live-preview-head span{font-size:9px;color:#888}.sm-live-stage{min-height:180px;display:grid;place-items:center;padding:12px;background-color:#fff;background-image:linear-gradient(45deg,#eee 25%,transparent 25%),linear-gradient(-45deg,#eee 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#eee 75%),linear-gradient(-45deg,transparent 75%,#eee 75%);background-size:18px 18px;background-position:0 0,0 9px,9px -9px,-9px 0}.sm-live-stage img{display:block;max-width:100%;max-height:360px;width:auto;height:auto;object-fit:contain}.sm-live-empty{font-size:10px;color:#777;text-align:center;line-height:1.6}.sm-zip-note{font-size:9px;color:#777;margin-top:7px}.sm-zip-busy{opacity:.55;pointer-events:none}`;
  document.head.appendChild(style);

  function getSourceBlob(){
    const img = document.querySelector('#fileList .file-row img');
    return img ? blobMap.get(img.src) || null : null;
  }
  const loadImage = (blob) => new Promise((res, rej) => {
    const u = origCreate(blob), img = new Image();
    img.onload = () => { origRevoke(u); res(img); };
    img.onerror = () => { origRevoke(u); rej(new Error('load')); };
    img.src = u;
  });
  const toBlob = (c,t,q) => new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('blob')),t,q));
  function cropBounds(ctx,w,h){const d=ctx.getImageData(0,0,w,h).data;let minX=w,minY=h,maxX=-1,maxY=-1;for(let y=0;y<h;y++){for(let x=0;x<w;x++){if(d[(y*w+x)*4+3]>8){if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y}}}return maxX<0?{x:0,y:0,w,h}:{x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1}}
  let lineMode = false, timer = 0, previewUrl = '';
  async function renderPreview(){
    const stage = document.querySelector('.sm-live-stage'); if(!stage) return;
    const srcBlob = getSourceBlob();
    if(!srcBlob){ stage.innerHTML='<div class="sm-live-empty">画像を選ぶと、ここに仕上がりが表示されます。</div>'; return; }
    stage.innerHTML='<div class="sm-live-empty">プレビュー更新中…</div>';
    try{
      const img = await loadImage(srcBlob);
      const maxPreview = 1000;
      const baseScale = Math.min(1,maxPreview/img.naturalWidth,maxPreview/img.naturalHeight);
      let sw=Math.max(1,Math.round(img.naturalWidth*baseScale)), sh=Math.max(1,Math.round(img.naturalHeight*baseScale));
      const src=document.createElement('canvas'); src.width=sw; src.height=sh; const sx=src.getContext('2d',{willReadFrequently:true}); sx.drawImage(img,0,0,sw,sh);
      let x0=0,y0=0,cw=sw,ch=sh,targetW=sw,targetH=sh,outType='image/png';
      const active=document.querySelector('.task.active'); const mode=active?.dataset.mode||'compress';
      if(lineMode){targetW=370;targetH=320;outType='image/png';}
      else {
        const fmt=document.getElementById('format'); outType=mode==='trim'?(srcBlob.type||'image/png'):(fmt?.value==='same'?(srcBlob.type||'image/png'):(fmt?.value||'image/png'));
        if(mode==='trim'){
          const b=cropBounds(sx,sw,sh), p=Number(document.getElementById('padding')?.value||0)*baseScale;
          x0=Math.max(0,Math.floor(b.x-p));y0=Math.max(0,Math.floor(b.y-p));cw=Math.min(sw-x0,Math.ceil(b.w+p*2));ch=Math.min(sh-y0,Math.ceil(b.h+p*2));targetW=cw;targetH=ch;
        } else if(mode==='resize'||mode==='compress'){
          const mw=Number(document.getElementById('maxWidth')?.value)||img.naturalWidth,mh=Number(document.getElementById('maxHeight')?.value)||img.naturalHeight;
          const ratio=Math.min(1,mw/img.naturalWidth,mh/img.naturalHeight); targetW=Math.max(1,Math.round(sw*ratio/baseScale));targetH=Math.max(1,Math.round(sh*ratio/baseScale));
          const fit=Math.min(1,maxPreview/targetW,maxPreview/targetH);targetW=Math.max(1,Math.round(targetW*fit));targetH=Math.max(1,Math.round(targetH*fit));
        }
      }
      const c=document.createElement('canvas');c.width=targetW;c.height=targetH;const cx=c.getContext('2d');
      if(outType==='image/jpeg'){cx.fillStyle='#fff';cx.fillRect(0,0,targetW,targetH)}
      cx.imageSmoothingEnabled=true;cx.imageSmoothingQuality='high';
      if(lineMode){const s=Math.min(370/sw,320/sh);const w=Math.max(1,Math.round(sw*s)),h=Math.max(1,Math.round(sh*s));cx.drawImage(src,0,0,sw,sh,Math.round((370-w)/2),Math.round((320-h)/2),w,h)}else cx.drawImage(src,x0,y0,cw,ch,0,0,targetW,targetH);
      const q=Number(document.getElementById('quality')?.value||78)/100;const b=await toBlob(c,outType,q);
      if(previewUrl)origRevoke(previewUrl);previewUrl=origCreate(b);stage.innerHTML=`<img src="${previewUrl}" alt="仕上がりプレビュー">`;
    }catch(e){stage.innerHTML='<div class="sm-live-empty">プレビューを表示できませんでした。</div>'}
  }
  function schedulePreview(){clearTimeout(timer);timer=setTimeout(renderPreview,160)}

  function crc32(data){let c=-1;for(let i=0;i<data.length;i++){c^=data[i];for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xEDB88320:0)}return(c^-1)>>>0}
  const u16=n=>new Uint8Array([n&255,(n>>>8)&255]);
  const u32=n=>new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]);
  function concat(parts){const len=parts.reduce((s,p)=>s+p.length,0),out=new Uint8Array(len);let o=0;for(const p of parts){out.set(p,o);o+=p.length}return out}
  async function makeZip(entries){const enc=new TextEncoder(),locals=[],centrals=[];let offset=0;for(const e of entries){const name=enc.encode(e.name),data=new Uint8Array(await e.blob.arrayBuffer()),crc=crc32(data);const local=concat([u32(0x04034b50),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),name,data]);locals.push(local);const central=concat([u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name]);centrals.push(central);offset+=local.length}const centralSize=centrals.reduce((s,p)=>s+p.length,0),end=concat([u32(0x06054b50),u16(0),u16(0),u16(entries.length),u16(entries.length),u32(centralSize),u32(offset),u16(0)]);return new Blob([...locals,...centrals,end],{type:'application/zip'})}
  async function zipResults(btn){
    const rows=[...document.querySelectorAll('#resultList .result-row')],entries=[];
    for(const row of rows){const img=row.querySelector('img'),name=row.querySelector('.file-name')?.textContent?.trim();if(!img||!name)continue;const blob=blobMap.get(img.src);if(blob)entries.push({name,blob})}
    if(!entries.length)return;
    btn.classList.add('sm-zip-busy');const old=btn.textContent;btn.textContent='ZIP作成中…';
    try{const zip=await makeZip(entries),u=origCreate(zip),a=document.createElement('a');a.href=u;a.download=`stamp-moke-images-${Date.now()}.zip`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>origRevoke(u),3000)}finally{btn.textContent=old;btn.classList.remove('sm-zip-busy')}
  }

  document.addEventListener('DOMContentLoaded',()=>{
    const settings=document.querySelector('.settings');
    if(settings&&!document.querySelector('.sm-live-preview')){const box=document.createElement('div');box.className='sm-live-preview';box.innerHTML='<div class="sm-live-preview-head"><strong>仕上がりプレビュー</strong><span>設定変更で自動更新</span></div><div class="sm-live-stage"><div class="sm-live-empty">画像を選ぶと、ここに仕上がりが表示されます。</div></div>';const preset=settings.querySelector('.line-preset');settings.insertBefore(box,preset||null)}
    const all=document.getElementById('downloadAll');if(all){all.textContent='ZIPで一括保存';all.onclick=(e)=>{e.preventDefault();e.stopImmediatePropagation();zipResults(all)};const note=document.createElement('div');note.className='sm-zip-note';note.textContent='複数画像を1つのZIPファイルにまとめて保存します。';all.parentElement?.parentElement?.appendChild(note)}
    document.getElementById('taskGrid')?.addEventListener('click',()=>{lineMode=false;schedulePreview()});
    document.getElementById('linePreset')?.addEventListener('click',()=>{lineMode=true;schedulePreview()});
    ['quality','maxWidth','maxHeight','format','padding'].forEach(id=>{const el=document.getElementById(id);el?.addEventListener('input',schedulePreview);el?.addEventListener('change',schedulePreview)});
    new MutationObserver(schedulePreview).observe(document.getElementById('fileList'),{childList:true,subtree:true});
    schedulePreview();
  });
})();