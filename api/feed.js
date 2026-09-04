import feed from "../server/api/feed.js";

export default async function handler(req, res) {
  return feed(req, res);
}
