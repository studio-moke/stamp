import chatStamps from "../server/api/chat-stamps.js";
import lineAuthor from "../server/api/line-author.js";
import siteSearch from "../server/api/site-search.js";

const routes = { "chat-stamps": chatStamps, "line-author": lineAuthor, "site-search": siteSearch };

export default async function handler(req, res) {
  const route = String(req.query?.route || "");
  const target = routes[route];
  if (!target) return res.status(404).json({ error: "Unknown tools API route" });
  return target(req, res);
}
