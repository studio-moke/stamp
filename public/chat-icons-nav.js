(()=>{
  const labels={
    ja:{nav:'Slack・Teams・Discord',mobile:'Slack・Teams・Discord 無料絵文字',kicker:'FREE CUSTOM EMOJI',title:'Slack・Teams・Discordで使える無料絵文字',desc:'仕事のチャットやコミュニティで使える、正方形の透過PNGカスタム絵文字・リアクションアイコンを無料配布しています。',button:'無料絵文字を見る →'},
    en:{nav:'Slack・Teams・Discord',mobile:'Free Slack・Teams・Discord Emoji',kicker:'FREE CUSTOM EMOJI',title:'Free custom emoji for Slack, Teams & Discord',desc:'Square transparent PNG reaction icons for work chats, teams and online communities.',button:'Browse free emoji →'},
    'zh-tw':{nav:'Slack・Teams・Discord',mobile:'Slack・Teams・Discord 免費表情',kicker:'FREE CUSTOM EMOJI',title:'Slack・Teams・Discord 免費自訂表情',desc:'適合工作聊天、團隊溝通與社群使用的正方形透明 PNG 表情與反應圖示。',button:'查看免費表情 →'},
    th:{nav:'Slack・Teams・Discord',mobile:'อีโมจิ Slack・Teams・Discord ฟรี',kicker:'FREE CUSTOM EMOJI',title:'อีโมจิฟรีสำหรับ Slack, Teams และ Discord',desc:'ไอคอนรีแอ็กชัน PNG พื้นหลังโปร่งใสทรงสี่เหลี่ยมสำหรับงาน แชตทีม และคอมมูนิตี้',button:'ดูอีโมจิฟรี →'},
    id:{nav:'Slack・Teams・Discord',mobile:'Emoji Gratis Slack・Teams・Discord',kicker:'FREE CUSTOM EMOJI',title:'Emoji gratis untuk Slack, Teams & Discord',desc:'Ikon reaksi PNG transparan berbentuk persegi untuk chat kerja, tim, dan komunitas online.',button:'Lihat emoji gratis →'}
  };
  function locale(){const l=(document.documentElement.lang||'ja').toLowerCase();if(l.startsWith('zh'))return'zh-tw';if(l.startsWith('en'))return'en';if(l.startsWith('th'))return'th';if(l.startsWith('id'))return'id';return'ja'}
  function isHome(){return ['/', '/en/', '/zh-tw/', '/th/', '/id/'].includes(location.pathname)}
  function addHeader(){
    const h=document.querySelector('.sm-site-header, header.header, header.site-header');if(!h)return false;
    const nav=h.querySelector('.sm-site-actions,.header-actions,nav');if(!nav)return false;
    if(!nav.querySelector('a[data-sm-chat-icons]')){
      const a=document.createElement('a');a.href='/chat-icons/';a.dataset.smChatIcons='1';a.className='sm-chat-icons-nav';a.textContent=labels[locale()].nav;
      const lang=nav.querySelector('.sm-language,.language-switcher,.language');nav.insertBefore(a,lang||nav.querySelector('form')||nav.lastElementChild||null);
    }
    const mobile=h.querySelector('.sm-mobile-menu-nav,.mobile-menu nav,.mobile-nav');
    if(mobile&&!mobile.querySelector('a[data-sm-chat-icons]')){
      const a=document.createElement('a');a.href='/chat-icons/';a.dataset.smChatIcons='1';a.className='sm-chat-icons-mobile';a.innerHTML=`<strong>${labels[locale()].mobile}</strong><span>→</span>`;
      const tools=mobile.querySelector('.sm-mobile-tools');if(tools)tools.insertAdjacentElement('afterend',a);else mobile.prepend(a);
    }
    return true;
  }
  function addPromo(){
    if(!isHome()||document.querySelector('.sm-chat-icons-promo'))return;
    const hero=document.querySelector('main .hero,.hero');if(!hero)return;
    const t=labels[locale()];const s=document.createElement('section');s.className='sm-chat-icons-promo';
    s.innerHTML=`<a href="/chat-icons/" class="sm-chat-icons-promo-link"><span class="sm-chat-icons-promo-icon" aria-hidden="true">☺</span><span class="sm-chat-icons-promo-copy"><small>${t.kicker}</small><strong>${t.title}</strong><span>${t.desc}</span></span><span class="sm-chat-icons-promo-button">${t.button}</span></a>`;
    const existing=document.querySelector('.sm-color-promo');
    if(existing)existing.insertAdjacentElement('afterend',s);else hero.insertAdjacentElement('afterend',s);
  }
  function style(){if(document.getElementById('sm-chat-icons-nav-style'))return;const s=document.createElement('style');s.id='sm-chat-icons-nav-style';s.textContent=`
.sm-chat-icons-nav{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border:1px solid #d9d8d4;border-radius:999px;background:#fff;color:#161616!important;text-decoration:none!important;font-size:11px;font-weight:900;white-space:nowrap}.sm-chat-icons-nav:hover{background:#f4f3ef}.sm-chat-icons-mobile{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:16px 4px!important;border-bottom:1px solid #efeee9!important;color:#171717!important;text-decoration:none!important;font-size:14px!important}.sm-chat-icons-mobile strong{font-weight:900}.sm-chat-icons-promo{max-width:1180px;margin:-34px auto 68px}.sm-chat-icons-promo-link{display:grid;grid-template-columns:76px minmax(0,1fr) auto;align-items:center;gap:22px;padding:24px 28px;border:1px solid #deddd8;border-radius:24px;background:#fff;color:#161616;text-decoration:none;box-shadow:0 14px 36px rgba(42,40,32,.055);transition:.2s}.sm-chat-icons-promo-link:hover{transform:translateY(-3px);box-shadow:0 18px 42px rgba(42,40,32,.09)}.sm-chat-icons-promo-icon{width:68px;height:68px;display:grid;place-items:center;border-radius:18px;background:#171717;color:#fff;font-size:37px;font-weight:900}.sm-chat-icons-promo-copy{display:block;min-width:0}.sm-chat-icons-promo-copy small{display:block;margin-bottom:6px;font-size:9px;font-weight:900;letter-spacing:.18em;color:#888}.sm-chat-icons-promo-copy strong{display:block;font-size:clamp(20px,2.5vw,30px);line-height:1.25}.sm-chat-icons-promo-copy>span{display:block;margin-top:7px;color:#777;font-size:11px;line-height:1.7}.sm-chat-icons-promo-button{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:10px 17px;border-radius:999px;background:#161616;color:#fff;font-size:11px;font-weight:900;white-space:nowrap}@media(max-width:1050px){.sm-chat-icons-nav{padding:0 10px;font-size:10px}}@media(max-width:820px){.sm-chat-icons-nav{display:none}}@media(max-width:680px){.sm-chat-icons-promo{margin:-10px auto 45px}.sm-chat-icons-promo-link{grid-template-columns:56px 1fr;padding:18px;gap:14px;border-radius:18px}.sm-chat-icons-promo-icon{width:54px;height:54px;border-radius:14px;font-size:29px}.sm-chat-icons-promo-button{grid-column:1/-1;justify-self:start}}
`;document.head.appendChild(s)}
  function run(){style();addHeader();addPromo()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  let n=0;const timer=setInterval(()=>{run();if(++n>=12)clearInterval(timer)},250);
  new MutationObserver(()=>{addHeader();addPromo()}).observe(document.documentElement,{childList:true,subtree:true});
})();
