import { sitePath } from "../utils/paths";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ site }) => new Response(
  `User-agent: *\nAllow: /\nSitemap: ${new URL(sitePath("/sitemap.xml"), site).href}\n`,
  { headers: { "Content-Type": "text/plain; charset=utf-8" } },
);
