import noteDrafts from "../server/api/note-drafts.js";

export default async function handler(req, res) {
  return noteDrafts(req, res);
}
