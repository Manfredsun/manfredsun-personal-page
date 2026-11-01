import { publicProjects } from "./credits";
import type { CollectionEntry } from "astro:content";

export const featuredOrder = [
  "useless-youth",
  "peninsula-system",
  "galangal-lemongrass-poppies",
  "jacky-fcy-selected-works",
] as const;

export const categoryLabels = {
  music: "Music",
  theatre: "Theatre",
  live: "Live",
  personal: "Personal",
  archive: "Archive",
} as const;

export function sortWorks(works: CollectionEntry<"works">[]) {
  return [...works].sort((a, b) => {
    const aIndex = featuredOrder.indexOf(a.data.slug as (typeof featuredOrder)[number]);
    const bIndex = featuredOrder.indexOf(b.data.slug as (typeof featuredOrder)[number]);
    if (aIndex < 0 && bIndex < 0) return a.data.title.localeCompare(b.data.title);
    if (aIndex < 0) return 1;
    if (bIndex < 0) return -1;
    return aIndex - bIndex;
  });
}

export function publicRoles(work: CollectionEntry<"works">) {
  if (work.data.verification !== "verified") return [];
  return publicProjects.find((credit) => credit.work_slug === work.data.slug)?.roles ?? [];
}
