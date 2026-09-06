(() => {
  const pageData = () => ({
    canonical: document.querySelector('link[rel="canonical"]')?.href || window.location.href,
    media: document.querySelector('meta[property="og:image"]')?.content || document.querySelector('meta[name="twitter:image"]')?.content || '',
    title: document.querySelector('meta[property="og:title"]')?.content || document.title || 'stamp moke'
  });

  const shareUrl = (type) => {
    const { canonical, media, title } = pageData();
    if (type === 'pinterest') {
      const params = new URLSearchParams({ url: canonical, description: title });
      if (media) params.set('media', media);
      return `https://www.pinterest.com/pin/create/button/?${params.toString()}`;
    }
    if (type === 'whatsapp') return `https://wa.me/?text=${encodeURIComponent(`${title} ${canonical}`)}`;
    return `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title}\n${canonical}`)}`;
  };

  const defs = [
    { type:'pinterest', label:'Pinterest', icon:'P', aria:'Pinterestで保存' },
    { type:'whatsapp', label:'WhatsApp', icon:'W', aria:'WhatsAppで共有' },
    { type:'email', label:'Email', icon:'@', aria:'メールで共有' }
  ];

  const addShareButtons = (actions) => {
    if (!actions) return;
    const copyButton = actions.querySelector('[data-share="copy"]');
    defs.forEach(({type,label,icon,aria}) => {
      if (actions.querySelector(`[data-share="${type}"]`)) return;
      const link = document.createElement('a');
      link.className = 'sm-share-button';
      link.dataset.share = type;
      link.href = shareUrl(type);
      link.setAttribute('aria-label', aria);
      if (type !== 'email') { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
      link.innerHTML = `<span class="sm-share-icon" aria-hidden="true">${icon}</span><span>${label}</span>`;
      if (copyButton) actions.insertBefore(link, copyButton); else actions.appendChild(link);
    });
  };

  const init = (root = document) => {
    if (root.matches?.('.sm-share-actions')) addShareButtons(root);
    root.querySelectorAll?.('.sm-share-actions').forEach(addShareButtons);
  };

  const loadOnce = (src, key) => {
    if (document.querySelector(`script[data-sm-consistency="${key}"]`)) return;
    const s = document.createElement('script');
    s.src = src;
    s.dataset.smConsistency = key;
    document.head.appendChild(s);
  };

  const start = () => {
    init();
    loadOnce('/breadcrumb-global.js?v=20260905-2', 'breadcrumb');
    loadOnce('/sticker-promo-global.js?v=20260905-2', 'sticker-promo');
  };

  document.addEventListener('sm:content-ready', (event) => {
    const root = event.detail?.root;
    if (root) init(root);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();