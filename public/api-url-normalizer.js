(() => {
  // API endpoints are intentionally excluded from the site's trailing-slash rule.
  // Only page URLs returned by APIs are normalized server-side.
  if (window.__stampMokeApiUrlNormalizer) return;
  window.__stampMokeApiUrlNormalizer = true;
})();
