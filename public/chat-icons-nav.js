(()=>{
  const labels={
    ja:{nav:'Slack・Teams・Discord',mobile:'Slack・Teams・Discord 無料絵文字',kicker:'FREE CUSTOM EMOJI',title:'Slack・Teams・Discord',sub:'で使える無料絵文字',desc:'仕事やコミュニティで使える、シンプルでかわいい透過PNG絵文字を無料配布。',button:'無料絵文字を見る →'},
    en:{nav:'Slack・Teams・Discord',mobile:'Free Slack・Teams・Discord Emoji',kicker:'FREE CUSTOM EMOJI',title:'Slack · Teams · Discord',sub:'Free custom emoji',desc:'Simple transparent PNG emoji for work chats, teams and communities.',button:'Browse free emoji →'},
    'zh-tw':{nav:'Slack・Teams・Discord',mobile:'Slack・Teams・Discord 免費表情',kicker:'FREE CUSTOM EMOJI',title:'Slack・Teams・Discord',sub:'免費自訂表情',desc:'適合工作聊天、團隊與社群使用的簡潔透明PNG表情。',button:'查看免費表情 →'},
    'zh-cn':{nav:'Slack・Teams・Discord',mobile:'Slack・Teams・Discord 免费表情',kicker:'FREE CUSTOM EMOJI',title:'Slack・Teams・Discord',sub:'免费自定义表情',desc:'适合工作聊天、团队和社区使用的简洁透明PNG表情。',button:'查看免费表情 →'},
    ko:{nav:'Slack・Teams・Discord',mobile:'Slack・Teams・Discord 무료 이모지',kicker:'FREE CUSTOM EMOJI',title:'Slack · Teams · Discord',sub:'무료 커스텀 이모지',desc:'업무 채팅과 커뮤니티에서 쓰기 좋은 심플한 투명 PNG 이모지입니다.',button:'무료 이모지 보기 →'},
    th:{nav:'Slack・Teams・Discord',mobile:'อีโมจิ Slack・Teams・Discord ฟรี',kicker:'FREE CUSTOM EMOJI',title:'Slack · Teams · Discord',sub:'อีโมจิแบบกำหนดเองฟรี',desc:'อีโมจิ PNG พื้นหลังโปร่งใสแบบเรียบง่ายสำหรับงานและคอมมูนิตี้',button:'ดูอีโมจิฟรี →'},
    id:{nav:'Slack・Teams・Discord',mobile:'Emoji Gratis Slack・Teams・Discord',kicker:'FREE CUSTOM EMOJI',title:'Slack · Teams · Discord',sub:'Emoji kustom gratis',desc:'Emoji PNG transparan yang simpel untuk chat kerja, tim, dan komunitas.',button:'Lihat emoji gratis →'}
  };
  const supported=['en','zh-tw','zh-cn','ko','th','id'];
  function locale(){const first=(location.pathname||'/').split('/').filter(Boolean)[0];if(supported.includes(first))return first;const l=(document.documentElement.lang||'ja').toLowerCase();if(l.startsWith('zh-hans'))return'zh-cn';if(l.startsWith('zh'))return'zh-tw';if(l.startsWith('ko'))return'ko';if(l.startsWith('en'))return'en';if(l.startsWith('th'))return'th';if(l.startsWith('id'))return'id';return'ja'}
  function prefix(loc){return loc==='ja'?'':`/${loc}`}
  function localized(loc,path){return `${prefix(loc)}${path}`||'/'}
  function isHome(){const loc=locale(),pre=prefix(loc),p=location.pathname||'/';return p==='/'||p===pre||p===`${pre}/`}
  function addHeader(){
    const loc=locale(),t=labels[loc]||labels.ja;
    const h=document.querySelector('.sm-site-header, header.header, header.site-header');if(!h)return false;
    const nav=h.querySelector('.sm-site-actions,.header-actions,nav');if(!nav)return false;
    let a=nav.querySelector('a[data-sm-chat-icons]');
    if(!a){a=document.createElement('a');a.dataset.smChatIcons='1';a.className='sm-chat-icons-nav';const lang=nav.querySelector('.sm-language,.language-switcher,.language');nav.insertBefore(a,lang||nav.querySelector('form')||nav.lastElementChild||null)}
    a.href=localized(loc,'/chat-icons/');a.textContent=t.nav;
    const mobile=h.querySelector('.sm-mobile-menu-nav,.mobile-menu nav,.mobile-nav');
    if(mobile){
      let m=mobile.querySelector('a[data-sm-chat-icons]');
      if(!m){m=document.createElement('a');m.dataset.smChatIcons='1';m.className='sm-chat-icons-mobile';const tools=mobile.querySelector('.sm-mobile-tools');if(tools)tools.insertAdjacentElement('afterend',m);else mobile.prepend(m)}
      m.href=localized(loc,'/chat-icons/');m.innerHTML=`<strong>${t.mobile}</strong><span>→</span>`;
    }
    return true;
  }
  function addPromo(){
    if(!isHome())return;
    const news=document.querySelector('.sm-news-home');if(!news)return;
    let wrap=document.querySelector('.sm-home-feature-grid');
    if(!wrap){wrap=document.createElement('div');wrap.className='sm-home-feature-grid';news.parentNode.insertBefore(wrap,news);wrap.appendChild(news)}
    if(wrap.querySelector('.sm-chat-icons-promo'))return;
    const loc=locale(),t=labels[loc]||labels.ja;
    const s=document.createElement('section');s.className='sm-chat-icons-promo';
    s.innerHTML=`<a href="${localized(loc,'/chat-icons/')}" class="sm-chat-icons-promo-link"><span class="sm-chat-icons-k">${t.kicker}</span><strong class="sm-chat-icons-title">${t.title}</strong><strong class="sm-chat-icons-sub">${t.sub}</strong><p class="sm-chat-icons-desc">${t.desc}</p><span class="sm-chat-icons-promo-button">${t.button}</span><span class="sm-chat-icons-platforms"><span>Slack</span><span>Teams</span><span>Discord</span></span></a>`;
    wrap.appendChild(s);
    document.dispatchEvent(new CustomEvent('sm:content-ready',{detail:{root:s}}));
  }
  function style(){
    if(document.getElementById('sm-chat-icons-nav-style'))return;
    const s=document.createElement('style');s.id='sm-chat-icons-nav-style';s.textContent=`
      .sm-chat-icons-nav{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border:1px solid #d9d8d4;border-radius:999px;background:#fff;color:#161616!important;text-decoration:none!important;font-size:11px;font-weight:900;white-space:nowrap}.sm-chat-icons-nav:hover{background:#f4f3ef}
      .sm-chat-icons-mobile{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:16px 4px!important;border-bottom:1px solid #efeee9!important;color:#171717!important;text-decoration:none!important;font-size:14px!important}.sm-chat-icons-mobile strong{font-weight:900}
      .sm-chat-icons-promo{min-width:0}.sm-chat-icons-promo-link{display:flex;flex-direction:column;height:100%;min-height:100%;padding:30px;border:1px solid #deddd8;border-radius:24px;background:#fff;color:#161616!important;text-decoration:none!important;box-shadow:0 12px 35px rgba(42,40,32,.04);transition:.2s}.sm-chat-icons-promo-link:hover{transform:translateY(-2px);box-shadow:0 17px 40px rgba(42,40,32,.08)}
      .sm-chat-icons-k{display:block;margin-bottom:9px;color:#26935b;font-size:9px;font-weight:900;letter-spacing:.18em}.sm-chat-icons-title{display:block;font-size:clamp(25px,2.6vw,37px);line-height:1.08;letter-spacing:-.03em;word-break:keep-all}.sm-chat-icons-sub{display:block;margin-top:4px;font-size:clamp(22px,2.2vw,31px);line-height:1.1;letter-spacing:-.03em;word-break:keep-all}.sm-chat-icons-desc{max-width:420px;margin:18px 0 0;color:#6e6d68;font-size:12px;line-height:1.75}.sm-chat-icons-promo-button{display:inline-flex;align-items:center;justify-content:center;align-self:flex-start;min-height:46px;margin-top:22px;padding:0 19px;border-radius:999px;background:#171717;color:#fff;font-size:11px;font-weight:900;white-space:nowrap}.sm-chat-icons-platforms{display:flex;flex-wrap:wrap;gap:8px;margin-top:auto;padding-top:22px}.sm-chat-icons-platforms span{display:inline-flex;align-items:center;justify-content:center;min-height:32px;padding:0 12px;border:1px solid #e2e0da;border-radius:999px;background:#faf9f6;color:#4d4d49;font-size:10px;font-weight:800}
      @media(max-width:1050px){.sm-chat-icons-nav{padding:0 10px;font-size:10px}}
      @media(max-width:820px){.sm-chat-icons-nav{display:none}}
      @media(max-width:640px){.sm-chat-icons-promo-link{padding:22px;border-radius:20px}.sm-chat-icons-title{font-size:29px}.sm-chat-icons-sub{font-size:24px}.sm-chat-icons-desc{font-size:11px}.sm-chat-icons-platforms{margin-top:0}}
    `;document.head.appendChild(s)
  }
  function run(){style();addHeader();addPromo()}
  document.addEventListener('sm:news-ready',addPromo);
  document.addEventListener('sm:header-ready',addHeader);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();