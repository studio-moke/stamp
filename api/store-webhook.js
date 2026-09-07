import storeWebhook from "../server/api/store-webhook.js";

export const config = {
  api: { bodyParser: false }
};

export default async function handler(req, res) {
  return storeWebhook(req, res);
}
