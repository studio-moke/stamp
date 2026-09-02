(()=>{
  const path=location.pathname.replace(/^\/(en|zh-tw|th|id)(?=\/)/,'');
  const m=path.match(/^\/tools\/([^/]+)\/?$/);
  if(!m||m[1]==='')return;
  const slug=m[1];
  document.body.classList.add('sm-business-tool-page',`sm-tool-${slug}`);

  const copyText=async(text)=>{
    if(!text)return false;
    try{await navigator.clipboard.writeText(text);return true}catch(e){
      try{const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';ta.style.pointerEvents='none';document.body.appendChild(ta);ta.select();const ok=document.execCommand('copy');ta.remove();return ok}catch{return false}
    }
  };

  const ensureTextResults=()=>{
    const app=document.getElementById('app');
    if(!app)return;
    app.querySelectorAll('textarea[readonly]').forEach((ta,index)=>{
      if(ta.dataset.smTextResult==='1')return;
      ta.dataset.smTextResult='1';
      ta.classList.add('sm-native-result-hidden');
      const field=ta.closest('.field')||ta.parentElement;
      const label=field?.querySelector('label')?.textContent?.trim()||'結果';
      const box=document.createElement('section');
      box.className='sm-text-result';
      box.dataset.source=ta.id||String(index);
      box.innerHTML=`<div class="sm-text-result-label">${label}</div><pre class="sm-text-result-value" tabindex="0" aria-live="polite"></pre>`;
      field?.insertAdjacentElement('afterend',box);
    });
  };

  const syncTextResults=()=>{
    const app=document.getElementById('app');
    if(!app)return;
    app.querySelectorAll('textarea[readonly][data-sm-text-result="1"]').forEach((ta,index)=>{
      const key=ta.id||String(index);
      const box=[...app.querySelectorAll('.sm-text-result')].find(el=>el.dataset.source===key);
      const pre=box?.querySelector('.sm-text-result-value');
      if(!pre)return;
      const next=ta.value||'結果がここに表示されます';
      if(pre.textContent!==next)pre.textContent=next;
    });
  };

  const getText=()=>{
    const app=document.getElementById('app');
    if(!app)return '';
    const title=document.querySelector('.hero h1')?.textContent?.trim()||'';
    const metrics=[...app.querySelectorAll('.metric')].map(el=>{
      const k=el.querySelector('small')?.textContent?.trim();
      const v=el.querySelector('strong')?.textContent?.trim();
      return k&&v?`${k}: ${v}`:'';
    }).filter(Boolean);
    const visibleText=[...app.querySelectorAll('.sm-text-result-value')].map(el=>el.textContent?.trim()).filter(Boolean).join('\n');
    const result=app.querySelector('.result')?.innerText?.trim();
    const body=metrics.length?metrics.join('\n'):(visibleText||result||'');
    return body?`${title}\n${body}`:title;
  };

  const ensureCopyButton=()=>{
    const app=document.getElementById('app');
    if(!app||app.querySelector('.sm-copy-result'))return;
    if(!app.querySelector('.metric,.result,textarea[readonly],.sm-text-result'))return;
    const btn=document.createElement('button');
    btn.type='button';btn.className='sm-copy-result';btn.innerHTML='<span class="sm-copy-icon">⧉</span><span>結果をテキストコピー</span>';
    btn.addEventListener('click',async()=>{
      syncTextResults();
      const ok=await copyText(getText());
      btn.innerHTML=ok?'<span>✓</span><span>コピーしました</span>':'<span>!</span><span>コピーできませんでした</span>';
      btn.classList.toggle('is-done',ok);
      window.setTimeout(()=>{btn.innerHTML='<span class="sm-copy-icon">⧉</span><span>結果をテキストコピー</span>';btn.classList.remove('is-done')},1600);
    });
    app.appendChild(btn);
  };

  const setupInitialClear=()=>{
    const app=document.getElementById('app');
    if(!app)return;
    app.querySelectorAll('input').forEach(el=>{
      if(['checkbox','radio','button','submit','hidden','file'].includes(el.type))return;
      if(el.dataset.smInitialClearBound==='1')return;
      const initial=el.value;
      if(!initial)return;
      el.dataset.smInitialClearBound='1';
      el.dataset.smInitialValue=initial;
      el.addEventListener('focus',()=>{
        if(el.dataset.smInitialCleared==='1')return;
        el.dataset.smInitialCleared='1';
        if(el.value===el.dataset.smInitialValue){
          el.value='';
          el.dispatchEvent(new Event('input',{bubbles:true}));
        }
      },{once:true});
    });
  };

  const addTips=()=>{
    const app=document.getElementById('app');
    if(!app||app.querySelector('.sm-tool-tip'))return;
    const tips={
      'date-calculator':['日付は何度でも変更できます','開始日と終了日の差、基準日からの加減算に使えます。'],
      'password-generator':['端末内で生成','生成したパスワードは下の「結果をテキストコピー」からすぐコピーできます。'],
      'gross-profit':['入力するだけで再計算','売価・原価を変えるたびに粗利額・粗利率・原価率が更新されます。'],
      'text-counter':['リアルタイム集計','文章を貼り付けた瞬間から文字数・空白除外・行数を確認できます。']
    };
    const t=tips[slug];
    if(!t)return;
    const div=document.createElement('div');div.className='sm-tool-tip';div.innerHTML=`<span>💡</span><span><b>${t[0]}</b><br>${t[1]}</span>`;app.appendChild(div);
  };

  const enhanceOnce=()=>{
    const app=document.getElementById('app');
    if(!app)return;
    app.querySelectorAll('input[type="number"]').forEach(el=>{el.inputMode='decimal'});
    app.querySelectorAll('input,select,textarea,button').forEach(el=>{if(!el.hasAttribute('enterkeyhint'))el.setAttribute('enterkeyhint','done')});
    ensureTextResults();
    syncTextResults();
    ensureCopyButton();
    setupInitialClear();
    addTips();
  };

  const start=()=>{
    const app=document.getElementById('app');
    if(!app)return;
    enhanceOnce();
    const syncSoon=()=>requestAnimationFrame(()=>syncTextResults());
    app.addEventListener('input',syncSoon,true);
    app.addEventListener('change',syncSoon,true);
    app.addEventListener('click',syncSoon,true);
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();