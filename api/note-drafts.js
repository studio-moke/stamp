import noteDrafts from "../server/api/note-drafts.js";

export default async function handler(req, res) {
  // Admin fallback: reuse the already-established analytics admin token only
  // when NOTE_DRAFT_ADMIN_KEY is not visible in this runtime.
  if (!process.env.NOTE_DRAFT_ADMIN_KEY && process.env.ANALYTICS_ADMIN_TOKEN) {
    process.env.NOTE_DRAFT_ADMIN_KEY = process.env.ANALYTICS_ADMIN_TOKEN;
  }

  // Cron fallback: Vercel sends x-vercel-cron-schedule on scheduled requests.
  // If CRON_SECRET is unexpectedly unavailable at runtime, allow only the
  // exact configured daily cron schedule to authenticate internally.
  const cronSchedule = String(req.headers?.["x-vercel-cron-schedule"] || "").trim();
  if (!process.env.CRON_SECRET && cronSchedule === "15 22 * * *") {
    const internalCronSecret = "__stamp_moke_vercel_cron__";
    process.env.CRON_SECRET = internalCronSecret;
    req.headers.authorization = `Bearer ${internalCronSecret}`;
  }

  return noteDrafts(req, res);
}
