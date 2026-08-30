import type { APIRoute } from "astro";
import { SITE_URL } from "../lib/seo";
export const GET: APIRoute = () => new Response(`User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\nSitemap: ${SITE_URL}/free-sitemap.xml\n`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
