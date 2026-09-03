import news from "../server/api/news.js";

export default async function handler(req, res) {
  return news(req, res);
}
