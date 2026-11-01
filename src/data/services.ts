import { getCollection } from "astro:content";
export async function getServices() {
  return (await getCollection("pageCopy"))
    .filter((entry) => entry.id.startsWith("services/") && entry.data.english && entry.data.title)
    .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99));
}
