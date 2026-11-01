import { parse } from "yaml";
import raw from "./site.yaml?raw";
import { z } from "astro/zod";

const schema = z.object({
  email: z.string().default(""),
  socials: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
  social_image: z.string().default(""), social_image_alt: z.string().default(""),
  name: z.string(), alternate_name: z.string(), location: z.string(),
  roles: z.string(), theatre_role: z.string(), practice: z.string(), selected_roles: z.string(),
});
export const site = schema.parse(parse(raw));
export const contactEmail = z.email().safeParse(site.email.trim()).success ? site.email.trim() : "";
export const socialLinks = site.socials.filter(({ label, url }) => label.trim() && /^https?:\/\//.test(url) && z.url().safeParse(url).success);
export const contactReady = Boolean(contactEmail);
