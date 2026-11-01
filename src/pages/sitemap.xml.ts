import { contactReady } from "../data/site";
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const GET: APIRoute = async ({ site }) => {
  const works = await getCollection("works", ({ data }) => data.case_study && data.verification === "verified");
  const paths = ["/", "/sheet-music/", "/ai-images/", "/credits/", "/about/", "/services/", "/product/", ...(contactReady ? ["/contact/"] : []), ...works.map(({ data }) => `/works/${data.slug}/`)];
  const entries = paths.map((path) => `  <url><loc>${new URL(path, site).href}</loc></url>`).join("\n");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
