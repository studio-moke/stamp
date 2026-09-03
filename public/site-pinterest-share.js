(() => {
  const buildPinterestUrl = () => {
    const canonical = document.querySelector('link[rel="canonical"]')?.href || window.location.href;
    const media = document.querySelector('meta[property="og:image"]')?.content || document.querySelector('meta[name="twitter:image"]')?.content || '';
    const description = document.querySelector('meta[property="og:title"]')?.content || document.title || 'stamp moke';
    const params = new URLSearchParams({ url: canonical, description });
    if (media) params.set('media', media);
    return `https://www.pinterest.com/pin/create/button/?${params.toString()}`;
  };

  const addPinterestButton = (actions) => {
    if (!actions || actions.querySelector('[data-share="pinterest"]')) return;

    const link = document.createElement('a');
    link.className = 'sm-share-button';
    link.dataset.share = 'pinterest';
    link.href = buildPinterestUrl();
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', 'Pinterestで保存');
    link.innerHTML = '<span class="sm-share-icon" aria-hidden="true">P</span><span>Pinterest</span>';

    const copyButton = actions.querySelector('[data-share="copy"]');
    if (copyButton) actions.insertBefore(link, copyButton);
    else actions.appendChild(link);
  };

  const init = (root = document) => {
    root.querySelectorAll?.('.sm-share-actions').forEach(addPinterestButton);
  };

  const start = () => {
    init();
    new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.matches?.('.sm-share-actions')) addPinterestButton(node);
          init(node);
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
