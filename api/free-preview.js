import { get, list } from "@vercel/blob";

function slugify(value = "") {
  return String(value)
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

async function findBySlug(slug) {
  const path = `free-assets/meta/${slug}.json`;
  const found = await list({ prefix: path, limit: 5 });
  const blob = found.blobs.find((item) => item.pathname === path);
  if (!blob) return null;
  const result = await get(blob.url, { access: "private" });
  return result ? result.json() : null;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).end("Method not allowed");
    return;
  }

  try {
    const slug = slugify(req.query.slug || "");
    const asset = await findBySlug(slug);
    if (!asset || asset.status !== "published" || !asset.previewUrl) {
      res.status(404).end("Not found");
      return;
    }

    const preview = await get(asset.previewUrl, { access: "private" });
    if (!preview) {
      res.status(404).end("Not found");
      return;
    }

    res.setHeader("Content-Type", preview.contentType || "image/png");
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800");
    res.setHeader("X-Content-Type-Options", "nosniff");

    const reader = preview.stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (error) {
    console.error("free-preview error", error);
    res.status(500).end("Internal Server Error");
  }
}
