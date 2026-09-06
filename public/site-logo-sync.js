(() => {
  const LOGO_SRC = '/favicon.svg?v=20260906-2';

  function replaceLogo(node) {
    if (!(node instanceof Element)) return;

    if (node.matches?.('svg.sm-site-logo')) {
      const img = document.createElement('img');
      img.className = node.getAttribute('class') || 'sm-site-logo';
      img.src = LOGO_SRC;
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      img.decoding = 'async';
      node.replaceWith(img);
      return;
    }

    node.querySelectorAll?.('svg.sm-site-logo').forEach(replaceLogo);

    node.querySelectorAll?.('img.sm-site-logo').forEach((img) => {
      if (img.getAttribute('src') !== LOGO_SRC) img.setAttribute('src', LOGO_SRC);
    });
  }

  function sync() {
    document.querySelectorAll('svg.sm-site-logo').forEach(replaceLogo);
    document.querySelectorAll('img.sm-site-logo').forEach((img) => {
      if (img.getAttribute('src') !== LOGO_SRC) img.setAttribute('src', LOGO_SRC);
    });
  }

  function start() {
    sync();
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) replaceLogo(node);
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
