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

  const setupAgeTool=()=>{
    if(slug!=='age-table')return;
    const app=document.getElementById('app');
    if(!app||app.dataset.smAgeTool==='1')return;
    app.dataset.smAgeTool='1';

    const heroTitle=document.querySelector('.hero h1');
    const heroDesc=document.querySelector('.hero p');
    if(heroTitle)heroTitle.textContent='年齢計算・生まれ年逆算ツール';
    if(heroDesc)heroDesc.textContent='生年月日から現在の満年齢・数え年を計算。現在の年齢から生まれ年や昭和・平成・令和も逆算できます。';
    document.title='年齢計算・生まれ年逆算ツール | 無料ツール | stamp moke';
    const meta=document.querySelector('meta[name="description"]');
    if(meta)meta.setAttribute('content','生年月日から現在の満年齢・数え年を計算し、年齢から生まれ年・西暦・和暦を逆算できる無料ツールです。');

    const style=document.createElement('style');
    style.textContent=`
      body.sm-tool-age-table .toolbox:before{content:'生年月日から年齢を計算／年齢から生まれ年を逆算できます'}
      .sm-age-section{padding:22px 0;border-bottom:1px solid #e5e9eb}
      .sm-age-section:first-child{padding-top:0}.sm-age-section:last-child{border-bottom:0;padding-bottom:0}
      .sm-age-title{margin:0 0 6px;font-size:22px;line-height:1.35;color:#1c2830}.sm-age-lead{margin:0 0 16px;color:#69747d;font-size:13px;line-height:1.7}
      .sm-age-output{margin-top:16px;padding:18px 20px;border:2px solid color-mix(in srgb,var(--sm-accent) 20%,#e7ecef);border-radius:18px;background:linear-gradient(135deg,#fff 0%,var(--sm-accent-soft) 100%);white-space:pre-wrap;overflow-wrap:anywhere;user-select:text;-webkit-user-select:text;font:700 16px/1.9 Arial,"Hiragino Sans","Yu Gothic",sans-serif;color:#172027;min-height:68px}
      .sm-age-output strong{font-size:28px;color:var(--sm-accent-deep)}
      .sm-age-copy{margin-top:10px;min-height:48px;padding:0 16px;border:2px solid var(--sm-accent);border-radius:14px;background:#fff;color:var(--sm-accent-deep);font-weight:900;cursor:pointer}
      .sm-age-details{margin-top:4px;border:1px solid #dfe5e8;border-radius:16px;background:#fff;overflow:hidden}.sm-age-details summary{display:flex;align-items:center;justify-content:space-between;min-height:58px;padding:0 17px;font-size:15px;font-weight:900;color:#293640;cursor:pointer;list-style:none}.sm-age-details summary::-webkit-details-marker{display:none}.sm-age-details summary:after{content:'＋';font-size:20px;color:var(--sm-accent)}.sm-age-details[open] summary:after{content:'−'}
      .sm-age-table-text{max-height:500px;overflow:auto;border-top:1px solid #e6eaec;padding:8px 16px 16px;font-size:14px;line-height:1.8;font-variant-numeric:tabular-nums}.sm-age-row{display:grid;grid-template-columns:70px 90px 1fr;gap:10px;padding:8px 2px;border-bottom:1px solid #eef1f2}.sm-age-row b{color:var(--sm-accent-deep)}
      .sm-age-switch{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}.sm-age-switch label{display:flex;align-items:center;gap:7px;min-height:46px;padding:8px 12px;border:1px solid #dfe5e8;border-radius:12px;background:#fafbfb;font-size:13px;font-weight:800;cursor:pointer}.sm-age-switch input{width:19px;height:19px;accent-color:var(--sm-accent)}
      @media(max-width:700px){.sm-age-section{padding:19px 0}.sm-age-title{font-size:20px}.sm-age-output{padding:16px;font-size:15px}.sm-age-row{grid-template-columns:58px 78px 1fr;gap:7px;font-size:13px}}
    `;
    document.head.appendChild(style);

    app.innerHTML=`
      <section class="sm-age-section">
        <h2 class="sm-age-title">生年月日から年齢を計算</h2>
        <p class="sm-age-lead">生年月日を入力すると、今日時点の満年齢・数え年・和暦・干支を表示します。</p>
        <div class="field"><label for="smBirthDate">生年月日</label><input id="smBirthDate" type="date"></div>
        <div class="actions"><button class="btn" id="smBirthRun" type="button">年齢を計算</button></div>
        <div class="sm-age-output" id="smBirthResult" aria-live="polite">生年月日を入力してください。</div>
        <button class="sm-age-copy" id="smBirthCopy" type="button">結果をコピー</button>
      </section>
      <section class="sm-age-section">
        <h2 class="sm-age-title">年齢から生まれ年を逆算</h2>
        <p class="sm-age-lead">「現在45歳」と「今年45歳になる人」を分けて計算できます。</p>
        <div class="field"><label for="smAge">年齢</label><input id="smAge" type="number" min="0" max="150" inputmode="numeric" placeholder="例：45"></div>
        <div class="sm-age-switch">
          <label><input type="radio" name="smAgeMode" value="current" checked>現在この年齢</label>
          <label><input type="radio" name="smAgeMode" value="thisyear">今年この年齢になる</label>
        </div>
        <div class="actions"><button class="btn" id="smAgeRun" type="button">生まれ年を逆算</button></div>
        <div class="sm-age-output" id="smAgeResult" aria-live="polite">年齢を入力してください。</div>
        <button class="sm-age-copy" id="smAgeCopy" type="button">結果をコピー</button>
      </section>
      <section class="sm-age-section">
        <h2 class="sm-age-title">西暦・和暦を変換</h2>
        <p class="sm-age-lead">西暦を入力すると、その年の和暦を確認できます。改元年は両方の元号を表示します。</p>
        <div class="field"><label for="smWesternYear">西暦</label><input id="smWesternYear" type="number" min="1868" max="2200" inputmode="numeric" placeholder="例：1982"></div>
        <div class="sm-age-output" id="smEraResult" aria-live="polite">西暦を入力してください。</div>
      </section>
      <section class="sm-age-section">
        <h2 class="sm-age-title">年齢早見表</h2>
        <p class="sm-age-lead">必要なときだけ開けます。表はテキスト形式なので選択・コピーもしやすくしています。</p>
        <details class="sm-age-details" id="smAgeDetails">
          <summary>年齢早見表を開く</summary>
          <div class="sm-age-table-text" id="smAgeTableText"></div>
        </details>
        <p class="note">早見表は「今年その年齢になる人」の生まれ年です。現在の満年齢は誕生日の前後で1年ずれる場合があります。</p>
      </section>`;

    const byId=(id)=>document.getElementById(id);
    const pad=(n)=>String(n).padStart(2,'0');
    const dateText=(d)=>`${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
    const iso=(d)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    const safeAnniversary=(year,month,day)=>{
      const last=new Date(year,month,0).getDate();
      return new Date(year,month-1,Math.min(day,last));
    };
    const warekiForDate=(d)=>{
      const y=d.getFullYear();
      const md=(d.getMonth()+1)*100+d.getDate();
      if(y>2019||(y===2019&&md>=501))return `令和${y===2019?'元':y-2018}年`;
      if(y>1989||(y===1989&&md>=108))return `平成${y===1989?'元':y-1988}年`;
      if(y>1926||(y===1926&&md>=1225))return `昭和${y===1926?'元':y-1925}年`;
      if(y>1912||(y===1912&&md>=730))return `大正${y===1912?'元':y-1911}年`;
      if(y>1868||(y===1868&&md>=125))return `明治${y===1868?'元':y-1867}年`;
      return `${y}年`;
    };
    const warekiForYear=(y)=>{
      if(y===2019)return '平成31年／令和元年';
      if(y===1989)return '昭和64年／平成元年';
      if(y===1926)return '大正15年／昭和元年';
      if(y===1912)return '明治45年／大正元年';
      if(y>=2020)return `令和${y-2018}年`;
      if(y>=1990)return `平成${y-1988}年`;
      if(y>=1927)return `昭和${y-1925}年`;
      if(y>=1913)return `大正${y-1911}年`;
      if(y>=1869)return `明治${y-1867}年`;
      return `${y}年`;
    };
    const eto=(y)=>['申','酉','戌','亥','子','丑','寅','卯','辰','巳','午','未'][((y%12)+12)%12];
    const today=()=>{const n=new Date();return new Date(n.getFullYear(),n.getMonth(),n.getDate())};

    const calcBirth=()=>{
      const raw=byId('smBirthDate').value;
      if(!raw){byId('smBirthResult').textContent='生年月日を入力してください。';return}
      const [y,m,d]=raw.split('-').map(Number);
      const birth=new Date(y,m-1,d);
      const now=today();
      if(Number.isNaN(birth.getTime())||birth>now){byId('smBirthResult').textContent='今日以前の正しい生年月日を入力してください。';return}
      let age=now.getFullYear()-y;
      const birthdayThisYear=safeAnniversary(now.getFullYear(),m,d);
      if(now<birthdayThisYear)age--;
      const kazoe=now.getFullYear()-y+1;
      let next=safeAnniversary(now.getFullYear(),m,d);
      if(next<=now)next=safeAnniversary(now.getFullYear()+1,m,d);
      const days=Math.ceil((next-now)/86400000);
      byId('smBirthResult').innerHTML=`<strong>満${age}歳</strong>\n数え年：${kazoe}歳\n生年月日：${dateText(birth)}\n和暦：${warekiForDate(birth)}\n干支：${eto(y)}年\n次の誕生日まで：${days}日`;
    };

    const calcAge=()=>{
      const age=Number(byId('smAge').value);
      if(!Number.isInteger(age)||age<0||age>150){byId('smAgeResult').textContent='0〜150歳の年齢を入力してください。';return}
      const mode=app.querySelector('input[name="smAgeMode"]:checked')?.value||'current';
      const now=today();
      if(mode==='thisyear'){
        const y=now.getFullYear()-age;
        byId('smAgeResult').innerHTML=`<strong>${y}年生まれ</strong>\n和暦：${warekiForYear(y)}\n今年${age}歳になる人の生まれ年です。`;
        return;
      }
      const newest=safeAnniversary(now.getFullYear()-age,now.getMonth()+1,now.getDate());
      const oldestBase=safeAnniversary(now.getFullYear()-age-1,now.getMonth()+1,now.getDate());
      const oldest=new Date(oldestBase);oldest.setDate(oldest.getDate()+1);
      byId('smAgeResult').innerHTML=`<strong>${oldest.getFullYear()}年〜${newest.getFullYear()}年生まれ</strong>\n生年月日の範囲：${dateText(oldest)} 〜 ${dateText(newest)}\n和暦の目安：${warekiForYear(oldest.getFullYear())} 〜 ${warekiForYear(newest.getFullYear())}\n今日現在、満${age}歳の人の範囲です。`;
    };

    const calcEra=()=>{
      const y=Number(byId('smWesternYear').value);
      byId('smEraResult').innerHTML=Number.isInteger(y)&&y>=1868&&y<=2200?`<strong>${y}年</strong> ＝ ${warekiForYear(y)}`:'1868〜2200年の西暦を入力してください。';
    };

    const buildTable=()=>{
      const y=today().getFullYear();
      byId('smAgeTableText').innerHTML=Array.from({length:101},(_,age)=>{const by=y-age;return `<div class="sm-age-row"><b>${age}歳</b><span>${by}年</span><span>${warekiForYear(by)}</span></div>`}).join('');
    };

    const flashCopy=async(btn,text)=>{
      const ok=await copyText(text);
      const old=btn.textContent;btn.textContent=ok?'コピーしました':'コピーできませんでした';setTimeout(()=>btn.textContent=old,1500);
    };
    byId('smBirthRun').addEventListener('click',calcBirth);
    byId('smBirthDate').addEventListener('change',calcBirth);
    byId('smAgeRun').addEventListener('click',calcAge);
    byId('smAge').addEventListener('input',()=>{if(byId('smAge').value!=='')calcAge()});
    app.querySelectorAll('input[name="smAgeMode"]').forEach(el=>el.addEventListener('change',()=>{if(byId('smAge').value!=='')calcAge()}));
    byId('smWesternYear').addEventListener('input',()=>{if(byId('smWesternYear').value!=='')calcEra();else byId('smEraResult').textContent='西暦を入力してください。'});
    byId('smBirthCopy').addEventListener('click',()=>flashCopy(byId('smBirthCopy'),byId('smBirthResult').innerText));
    byId('smAgeCopy').addEventListener('click',()=>flashCopy(byId('smAgeCopy'),byId('smAgeResult').innerText));
    buildTable();
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
    if(slug==='age-table')return;
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
    setupAgeTool();
    enhanceOnce();
    const syncSoon=()=>requestAnimationFrame(()=>syncTextResults());
    app.addEventListener('input',syncSoon,true);
    app.addEventListener('change',syncSoon,true);
    app.addEventListener('click',syncSoon,true);
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();