import { publicProjects } from "./credits";
import legacySource from "./works.yaml?raw";
import { parse } from "yaml";

// Additional published credits collected for this portfolio preview. Missing
// fields are intentionally omitted pending confirmation from original sources.
const team: Record<string, { role: string; name: string }[]> = {
  "jacky-fcy-heart-destruction": [{ role: "作曲", name: "范卓賢" }, { role: "作詞", name: "JL 李冠傑" }, { role: "編曲", name: "Manfred Sun" }, { role: "監製", name: "范卓賢" }],
  "jacky-fcy-ming-ri-ju-tong": [{ role: "作曲", name: "JT" }, { role: "作詞", name: "范卓賢" }, { role: "編曲", name: "Manfred Sun" }, { role: "監製", name: "范卓賢" }],
  "jacky-fcy-mo-shi-hua-huo": [{ role: "作曲", name: "范卓賢" }, { role: "作詞", name: "許廷鏗" }, { role: "編曲", name: "Manfred Sun" }, { role: "監製", name: "范卓賢" }],
  "jacky-fcy-zheng-dang-shi-jie": [{ role: "作曲", name: "范卓賢" }, { role: "作詞", name: "許廷鏗" }, { role: "編曲", name: "Manfred Sun" }, { role: "監製", name: "范卓賢" }],
  "jacky-fcy-lian-ai-yuan-wu-qu": [{ role: "作曲", name: "范卓賢" }, { role: "作詞", name: "JL 李冠傑" }, { role: "編曲", name: "Manfred Sun" }, { role: "監製", name: "范卓賢" }],
  "jacky-fcy-wo-xi-wang": [{ role: "作曲", name: "范卓賢" }, { role: "編曲", name: "Manfred Sun" }, { role: "監製", name: "范卓賢" }],
  "sunset-yuki-law": [{ role: "作曲", name: "申承羲" }, { role: "作詞", name: "薑檸樂" }, { role: "編曲", name: "Mochiice／Him Hui" }, { role: "監製", name: "Him Hui" }],
};

// https://zh.wikipedia.org/wiki/范卓賢
// https://zh.wikipedia.org/wiki/羅毓儀
// https://www.musichotpot.com/post/音樂火鍋-新湯料-music-hotpot-new-ingredients-24-6-2025
// https://www.musichotpot.com/post/音樂火鍋-新湯料-music-hotpot-new-ingredients-2-12-2024
const roleOverrides: Record<string, string[]> = {
  "pandamontana-bei-shang": ["編曲"],
  "lok-chow-2-am": ["編曲"],
  "sunset-yuki-law": ["作曲"],
};

const selected = new Set([
  "jacky-fcy-heart-destruction", "jacky-fcy-ming-ri-ju-tong", "jacky-fcy-mo-shi-hua-huo",
  "jacky-fcy-zheng-dang-shi-jie", "wo-xiang-chi-xiao-ye", "jacky-fcy-lian-ai-yuan-wu-qu",
  "jacky-fcy-wo-xi-wang", "zhong-tan-yuan-shuai", "mazu-xinrou", "sunset-yuki-law",
  "mu-luo", "pandamontana-bei-shang", "lok-chow-2-am", "lok-chow-yu-ni-dou-qi",
]);

// User-selected videos; legacy metadata supplies titles, not unverified roles.
const addedVideoIds = new Set(["JKG4QMcyjF8", "Wj7UR2HBoCo", "hn-4Oj-WFeo"]);
const legacyWorks = (parse(legacySource) as { works: { title: string; artist: string; youtube: string }[] }).works;
const addedProjects = legacyWorks.filter((work) => addedVideoIds.has(new URL(work.youtube).pathname.slice(1))).map((work) => ({
  project: work.title,
  artist: work.artist === "全半全全半全全" ? undefined : work.artist,
  work_slug: `video-${new URL(work.youtube).pathname.slice(1)}`,
  external_url: work.youtube,
  roles: [] as string[],
}));

export const musicVideos = [...publicProjects.filter((project) => selected.has(project.work_slug)), ...addedProjects].flatMap((project) => {
  if (!project.external_url) return [];
  const url = new URL(project.external_url);
  const videoId = url.hostname === "youtu.be" ? url.pathname.slice(1) : url.hostname === "www.youtube.com" ? url.searchParams.get("v") : null;
  if (!videoId || !/^[\w-]{11}$/.test(videoId)) return [];
  return [{ ...project, videoId, roles: roleOverrides[project.work_slug] ?? project.roles, team: team[project.work_slug] ?? [] }];
});

export const album = publicProjects.find((project) => project.work_slug === "useless-youth")!;
