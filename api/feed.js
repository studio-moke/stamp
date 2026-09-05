import feed from "../server/api/feed.js";
import { installInternalUrlNormalization } from "../server/api/_internal-url.js";

export default async function handler(req, res) {
  installInternalUrlNormalization(res);
  return feed(req, res);
}
