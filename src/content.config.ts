import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const assetUrl = z.string().trim().refine((value) => /^\/(?!\/)/.test(value) || /^https?:\/\//.test(value), "請使用 /media/ 路徑或 http(s) 網址");
const optionalAsset = z.union([z.literal(""), assetUrl]).optional();
const works = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/works" }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    category: z.enum(["music", "theatre", "live", "personal", "archive"]),
    roles: z.array(z.string()),
    featured: z.boolean(),
    verification: z.enum(["verified", "needs-verification"]),
    page_type: z.enum(["case-study", "selected-works"]).default("case-study"),
    year: z.number().int().optional(),
    case_study: z.boolean().default(false),
    hero_image: optionalAsset,
    hero_alt: z.string().default(""),
    artist: z.string().optional(),
    company: z.string().optional(),
    cover: optionalAsset,
    cover_alt: z.string().default(""),
    gallery: z.array(z.object({ src: assetUrl, alt: z.string().trim().min(1), caption: z.string().default(""), width: z.number().positive().optional(), height: z.number().positive().optional() })).default([]),
    summary: z.string().optional(),
    concept: z.string().optional(),
    sound_language: z.string().optional(),
    process: z.string().optional(),
    media: z.array(z.object({
      label: z.string().trim().min(1), url: assetUrl,
      type: z.enum(["link", "audio", "video"]).default("link"),
      poster: optionalAsset, captions: optionalAsset,
      transcript: z.string().default(""),
    })).default([]),
    credits: z
      .array(
        z.object({
          role: z.string(),
          artist: z.string().optional(),
          company: z.string().optional(),
          verified: z.boolean(),
        }),
      )
      .default([]),
    runs: z
      .array(
        z.object({
          label: z.string(),
          year: z.number().int().optional(),
          verified: z.boolean(),
        }),
      )
      .default([]),
    external_links: z
      .array(z.object({ label: z.string(), url: z.url() }))
      .default([]),
    selected_works: z
      .array(
        z.object({
          title: z.string(),
          year: z.number().int().optional(),
          role: z.string().optional(),
          url: z.url().optional(),
        }),
      )
      .default([]),
  }),
});

const workCopy = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/work-copy" }),
  schema: z.object({}),
});

const pageCopy = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/page-copy" }),
  schema: z.object({ title: z.string().optional(), english: z.string().optional(), order: z.number().optional() }),
});
const products = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/products" }),
  schema: z.object({
    title: z.string().trim().min(1),
    positioning: z.string().trim().min(1),
    category: z.string().trim().min(1),
    summary: z.string().trim().default(""),
    workflow: z.string().trim().min(1),
    creator_context: z.string().trim().default(""),
    screenshot: z.object({
      src: assetUrl,
      alt: z.string().trim().min(1),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    }).optional(),
    site_url: z.union([z.literal(""), z.url().refine((url) => url.startsWith("https://"), "產品網站請使用 HTTPS 網址")]).default(""),
    repository_url: z.union([z.literal(""), z.url().refine((url) => url.startsWith("https://"), "原始碼連結請使用 HTTPS 網址")]).default(""),
  }),
});

export const collections = { works, workCopy, pageCopy, products };
