import { publicProjects } from "./credits";
import type { CollectionEntry } from "astro:content";

export const featuredOrder = [
  "useless-youth",
  "peninsula-system",
  "galangal-lemongrass-poppies",
  "jacky-fcy-selected-works",
] as const;

export { categoryLabels } from "./ui";

export const workInquiryLabels: Record<string, string> = {
  "jacky-fcy-selected-works": "洽詢編曲合作",
  "sunset-yuki-law": "洽詢作曲合作",
  "galangal-lemongrass-poppies": "洽詢劇場音樂設計",
};

export function workYearLabel({ page_type, year, selected_works }: CollectionEntry<"works">["data"]) {
  if (page_type === "selected-works") {
    const years = selected_works.flatMap((item) => item.year === undefined ? [] : [item.year]);
    if (years.length > 0) {
      const first = Math.min(...years);
      const last = Math.max(...years);
      return first === last ? String(first) : `${first}–${last}`;
    }
  }
  return year?.toString();
}

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
