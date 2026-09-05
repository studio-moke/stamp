(() => {
  if (window.__stampMokeTrailingSlashLinks) return;
  window.__stampMokeTrailingSlashLinks = true;

  const FILE_RE = /\/[^/?#]+\.[a-z0-9]{1,16}$/i;

  function shouldSkip(url) {
    if (url.origin !== location.origin) return true;
    if (url.pathname === "/" || url.pathname.endsWith("/")) return true;
    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) return true;
    if (FILE_RE.test(url.pathname)) return true;
    return false;
  }

  function normalizeAnchor(anchor) {
    const raw = anchor.getAttribute("href");
    if (!raw || raw.startsWith("#") || /^(?:mailto:|tel:|javascript:|data:)/i.test(raw)) return;
    let url;
    try { url = new URL(raw, location.href); } catch { return; }
    if (shouldSkip(url)) return;
    url.pathname += "/";
    anchor.setAttribute("href", `${url.pathname}${url.search}${url.hash}`);
  }

  function normalize(root = document) {
    if (root.nodeType === 1 && root.matches?.("a[href]")) normalizeAnchor(root);
    root.querySelectorAll?.("a[href]").forEach(normalizeAnchor);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => normalize(), { once: true });
  } else {
    normalize();
  }

  new MutationObserver(records => {
    for (const record of records) {
      record.addedNodes.forEach(node => {
        if (node.nodeType === 1) normalize(node);
      });
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
