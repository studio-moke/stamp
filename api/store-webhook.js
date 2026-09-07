import storeWebhook from "../server/api/store-webhook-v2.js";

export const config = {
  api: { bodyParser: false }
};

export default async function handler(req, res) {
  return storeWebhook(req, res);
}
