import { r2GetBuffer, r2GetJson } from "./_r2.js";

function slugify(value = "") {
  return String(value).normalize("NFKC").toLowerCase().trim().replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end("Method not allowed");
  try {
    const slug = slugify(req.query.slug || "");
    const asset = await r2GetJson(`free-assets/meta/${slug}.json`, null);
    if (!asset || asset.status !== "published" || !asset.previewKey) return res.status(404).end("Not found");
    const preview = await r2GetBuffer(asset.previewKey);
    if (!preview) return res.status(404).end("Not found");
    res.setHeader("Content-Type", preview.contentType || "image/png");
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.status(200).end(preview.buffer);
  } catch (error) {
    console.error("free-preview error", error);
    res.status(500).end("Internal Server Error");
  }
}
