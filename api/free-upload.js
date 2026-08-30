import { handleUpload } from "@vercel/blob/client";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

function adminTokenValid(value) {
  const expected = process.env.FREE_ADMIN_TOKEN;
  return Boolean(expected && value && value === expected);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = req.body;
    const response = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let payload = {};
        try {
          payload = JSON.parse(clientPayload || "{}");
        } catch {
          throw new Error("Invalid upload payload");
        }

        if (!adminTokenValid(payload.adminToken)) throw new Error("Unauthorized");
        if (!pathname.startsWith("free-assets/originals/") && !pathname.startsWith("free-assets/previews/")) {
          throw new Error("Invalid upload path");
        }

        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ role: payload.role || "asset" }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("free asset blob uploaded", blob.pathname);
      },
    });

    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
}
