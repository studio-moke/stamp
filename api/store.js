import store from "../server/api/store-v2.js";
import { installInternalUrlNormalization } from "../server/api/_internal-url.js";

export default async function handler(req, res) {
  installInternalUrlNormalization(res);
  return store(req, res);
}
