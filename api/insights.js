import analytics from "../server/api/analytics.js";
import stickerSeo from "../server/api/sticker-seo.js";
import { installInternalUrlNormalization } from "../server/api/_internal-url.js";

const routes = { analytics, "sticker-seo": stickerSeo };

export default async function handler(req, res) {
  installInternalUrlNormalization(res);
  const route = String(req.query?.route || "analytics");
  const target = routes[route];
  if (!target) return res.status(404).json({ error: "Unknown insights API route" });
  return target(req, res);
}
