(() => {
  if (window.__stampMokeApiUrlNormalizer) return;
  window.__stampMokeApiUrlNormalizer = true;

  function normalizeApiUrl(value) {
    const raw = String(value);
    const absoluteInput = /^https?:\/\//i.test(raw);
    let url;
    try { url = new URL(raw, location.href); } catch { return value; }
    if (url.origin !== location.origin) return value;
    if (!(url.pathname === "/api" || url.pathname.startsWith("/api/"))) return value;
    if (url.pathname === "/api/" || url.pathname.endsWith("/")) return value;
    url.pathname += "/";
    return absoluteInput ? url.href : `${url.pathname}${url.search}${url.hash}`;
  }

  const originalFetch = window.fetch?.bind(window);
  if (originalFetch) {
    window.fetch = (input, init) => {
      if (input instanceof Request) {
        const normalized = normalizeApiUrl(input.url);
        if (normalized !== input.url) input = new Request(normalized, input);
      } else if (typeof input === "string" || input instanceof URL) {
        input = normalizeApiUrl(input);
      }
      return originalFetch(input, init);
    };
  }

  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    return originalOpen.call(this, method, normalizeApiUrl(url), ...rest);
  };

  if (navigator.sendBeacon) {
    const originalSendBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = (url, data) => originalSendBeacon(normalizeApiUrl(url), data);
  }
})();
