(()=>{
  const path=location.pathname.replace(/^\/(en|zh-tw|th|id)(?=\/)/,'');
  if(!/^\/tools\/postal-code\/?$/.test(path))return;

  const esc=(s)=>String(s??'').replace(/[&<>\"]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
  const normalize=(s)=>String(s||'').normalize('NFKC')
    .replace(/^〒?\s*\d{3}[-ー]?\d{4}\s*/,'')
    .replace(/[‐‑‒–—−ー－]/g,'-')
    .replace(/[　\t]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();

  const makeCandidates=(raw)=>{
    const q=normalize(raw);
    if(!q)return [];
    const list=[];
    const add=(v)=>{v=normalize(v);if(v&&v.length>=2&&!list.includes(v))list.push(v)};

    add(q);

    // 番地の後ろに空白＋建物名がある一般的なコピペ住所。
    const buildingCut=q.match(/^(.+?(?:\d+丁目)?\d+(?:-\d+){1,3})\s+.+$/);
    if(buildingCut)add(buildingCut[1]);

    // APIは空白の有無で結果が変わる場合があるため両方を試す。
    add(q.replace(/\s/g,''));
    if(buildingCut)add(buildingCut[1].replace(/\s/g,''));

    const bases=[...list];
    for(const base of bases){
      // 「若宮5丁目17-1」→「若宮5丁目」
      if(/\d+丁目/.test(base))add(base.replace(/(\d+丁目).*$/,'$1'));
      // 「若宮5丁目17-1」→「若宮」
      if(/\d+丁目/.test(base))add(base.replace(/\d+丁目.*$/,''));
      // 「西新宿2-8-1」→「西新宿」
      add(base.replace(/\d+(?:-\d+){1,3}.*$/,''));
      // 「1番2号」「17番地1」などを町名まで縮める。
      add(base.replace(/\d+(?:番地?|番|号).*$/,''));
    }
    return list.filter(Boolean);
  };

  const fetchAddress=async(q)=>{
    const r=await fetch(`https://postcode.teraren.com/postcodes.json?s=${encodeURIComponent(q)}&per=20`);
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    const data=await r.json();
    return Array.isArray(data)?data:[];
  };

  const render=(rows,used,original)=>{
    const result=document.getElementById('result');
    if(!result)return;
    if(!rows.length){result.textContent='該当する郵便番号が見つかりませんでした。';return}
    const seen=new Set();
    const unique=rows.filter((x)=>{
      const key=`${x.new||x.postcode||''}|${x.prefecture||''}|${x.city||''}|${x.suburb||x.town||''}`;
      if(seen.has(key))return false;seen.add(key);return true;
    });
    const fallback=normalize(used)!==normalize(original);
    result.innerHTML=`${fallback?`<div style="margin-bottom:12px;font-size:12px;color:#6f5b61;font-weight:700">番地・建物名を自動で除いて検索しました：${esc(used)}</div>`:''}<div class="results-list">${unique.map((x)=>`<div class="result-item"><b>〒${esc(x.new||x.postcode||'')}</b>${esc(x.prefecture||'')}${esc(x.city||'')}${esc(x.suburb||x.town||'')}</div>`).join('')}</div>`;
  };

  const setup=()=>{
    const input=document.getElementById('addr');
    const btn=document.getElementById('addrrun');
    const result=document.getElementById('result');
    if(!input||!btn||!result||btn.dataset.smPostalFallback==='1')return false;
    btn.dataset.smPostalFallback='1';
    input.placeholder='例 福岡市東区若宮5丁目17-1 マーキス若宮';

    btn.onclick=async()=>{
      const original=input.value.trim();
      if(!original){result.textContent='住所を入力してください。';return}
      result.textContent='検索中…';
      const candidates=makeCandidates(original);
      let networkError=false;
      for(const q of candidates){
        try{
          const rows=await fetchAddress(q);
          if(rows.length){render(rows,q,original);return}
        }catch(e){networkError=true}
      }
      result.textContent=networkError?'検索に失敗しました。時間をおいてもう一度お試しください。':'該当する郵便番号が見つかりませんでした。';
    };
    input.addEventListener('keydown',(e)=>{if(e.key==='Enter'){e.preventDefault();btn.click()}});
    return true;
  };

  const boot=()=>{
    if(setup())return;
    let tries=0;
    const timer=setInterval(()=>{tries++;if(setup()||tries>=30)clearInterval(timer)},100);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0),{once:true});else setTimeout(boot,0);
})();
