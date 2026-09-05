import news from "../server/api/news.js";
import { installInternalUrlNormalization } from "../server/api/_internal-url.js";

export default async function handler(req, res) {
  installInternalUrlNormalization(res);
  return news(req, res);
}
