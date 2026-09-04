// Automatic publication of generated tool images as free assets has been retired.
// Keep this endpoint as a hard stop so stale clients/caches cannot publish anything.
function json(res, status, payload) { res.status(status).json(payload); }

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  return json(res, 410, {
    error: "Automatic free-asset publication has been disabled.",
    code: "AUTO_FREE_ASSET_PUBLICATION_DISABLED"
  });
}
