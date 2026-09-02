(()=>{
  const path=location.pathname.replace(/^\/(en|zh-tw|th|id)(?=\/)/,'');
  const m=path.match(/^\/tools\/([^/]+)\/?$/);
  if(!m||m[1]==='')return;
  const slug=m[1];
  document.body.classList.add('sm-business-tool-page',`sm-tool-${slug}`);

  const getText=()=>{
    const app=document.getElementById('app');
    if(!app)return '';
    const title=document.querySelector('.hero h1')?.textContent?.trim()||'';
    const metrics=[...app.querySelectorAll('.metric')].map(el=>{
      const k=el.querySelector('small')?.textContent?.trim();
      const v=el.querySelector('strong')?.textContent?.trim();
      return k&&v?`${k}: ${v}`:'';
    }).filter(Boolean);
    const result=app.querySelector('.result')?.innerText?.trim();
    const out=app.querySelector('textarea[readonly]')?.value?.trim();
    const password=slug==='password-generator'?app.querySelector('textarea[readonly]')?.value?.trim():'';
    const body=metrics.length?metrics.join('\n'):(out||password||result||'');
    return body?`${title}\n${body}`:title;
  };

  const copyText=async(text)=>{
    if(!text)return false;
    try{await navigator.clipboard.writeText(text);return true}catch(e){
      try{const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();const ok=document.execCommand('copy');ta.remove();return ok}catch{return false}
    }
  };

  const enhance=()=>{
    const app=document.getElementById('app');
    if(!app)return;
    app.querySelectorAll('input[type="number"]').forEach(el=>{el.inputMode='decimal'});
    app.querySelectorAll('input,select,textarea,button').forEach(el=>{el.setAttribute('enterkeyhint','done')});
    if(!app.querySelector('.sm-copy-result')){
      const hasUseful=app.querySelector('.metric,.result,textarea[readonly]');
      if(hasUseful){
        const btn=document.createElement('button');
        btn.type='button';btn.className='sm-copy-result';btn.textContent='結果をコピー';
        btn.addEventListener('click',async()=>{
          const ok=await copyText(getText());
          btn.textContent=ok?'✓ コピーしました':'コピーできませんでした';
          btn.classList.toggle('is-done',ok);
          setTimeout(()=>{btn.textContent='結果をコピー';btn.classList.remove('is-done')},1600);
        });
        app.appendChild(btn);
      }
    }
    if(!app.querySelector('.sm-tool-tip')){
      const tips={
        'date-calculator':['日付は何度でも変更できます','開始日と終了日の差、基準日からの加減算に使えます。'],
        'password-generator':['端末内で生成','生成したパスワードは「結果をコピー」からすぐコピーできます。'],
        'gross-profit':['入力するだけで再計算','売価・原価を変えるたびに粗利額・粗利率・原価率が更新されます。'],
        'text-counter':['リアルタイム集計','文章を貼り付けた瞬間から文字数・空白除外・行数を確認できます。']
      };
      const t=tips[slug];
      if(t){const div=document.createElement('div');div.className='sm-tool-tip';div.innerHTML=`<span>💡</span><span><b>${t[0]}</b><br>${t[1]}</span>`;app.appendChild(div)}
    }
  };

  const start=()=>{
    enhance();
    const app=document.getElementById('app');
    if(app)new MutationObserver(()=>enhance()).observe(app,{childList:true,subtree:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();