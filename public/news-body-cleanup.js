(()=>{
  const cleanText=(value='')=>String(value)
    .replace(/\s*詳しくはこちら\s*[:：]\s*(?:https?:\/\/\S+|\/\S+)\s*/giu,' ')
    .replace(/\s{2,}/g,' ')
    .trim();

  const clean=()=>{
    document.querySelectorAll('.smn-body').forEach(el=>{
      const before=el.textContent||'';
      const after=cleanText(before);
      if(after!==before) el.textContent=after;
    });
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',clean,{once:true});
  else clean();

  const observer=new MutationObserver(clean);
  observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
})();
