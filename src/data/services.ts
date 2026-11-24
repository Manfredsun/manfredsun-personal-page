import { getCollection } from "astro:content";

export const arrangementServiceId = "services/arrangement";

export const serviceDetails: Record<string, {
  deliverables: string;
  price?: { label?: string; amount: number; unit: string };
  examples?: { label: string; path: string; description?: string }[];
}> = {
  "services/composition": {
    deliverables: "歌詞、旋律或配合影像與舞台的原創音樂",
    price: { label: "旋律＋歌詞", amount: 3000, unit: "首" },
    examples: [{ label: "《日落時》作曲案例", path: "/works/sunset-yuki-law/" }],
  },
  [arrangementServiceId]: {
    deliverables: "編曲音檔",
    price: { amount: 5000, unit: "首" },
    examples: [{ label: "范卓賢 Jacky Fcy 編曲作品選集", path: "/works/jacky-fcy-selected-works/" }],
  },
  "services/music-production": {
    deliverables: "整合創作、錄音與後製的音樂成品",
    examples: [{ label: "《我們就是沒有用的年輕人》", path: "/works/useless-youth/" }],
  },
  "services/theatre-music": {
    deliverables: "配合劇本、場景與演出需求的音樂",
    examples: [
      { label: "《南薑．香茅．罌粟花》音樂設計", path: "/works/galangal-lemongrass-poppies/" },
      { label: "《半島體制》音樂設計", path: "/works/peninsula-system/" },
    ],
  },
  "services/live-sound": {
    deliverables: "演出現場音控與混音，器材配置及分工於洽詢時確認。",
    examples: [{
      label: "《達克比出任務》音場設計",
      path: "/works/duckbill-mission/",
      description: "在這場演出中負責演出音控、音響器材統籌、現場執行及現場混音。",
    }],
  },
  "services/theatre-video": {
    deliverables: "依製作需求提供演出現場影像執行，工作範圍與現場分工於洽詢時確認。",
    examples: [
      { label: "合唱音樂劇《第一市場》", path: "/credits/#credit-first-public-retail-market" },
      { label: "蘭陽戲劇團《新周公法鬥桃花女》", path: "/credits/#credit-new-zhou-gong-fights-peach-blossom-girl" },
    ],
  },
  "services/sound-design": {
    deliverables: "完成清理、音量平衡或混音的音檔",
    price: { label: "後製混音", amount: 1000, unit: "軌" },
  },
  "services/score-preparation": {
    deliverables: "總譜、分譜、和弦譜或主旋律譜",
    price: { label: "和弦譜、樂器伴奏譜或 Lead Sheet", amount: 500, unit: "個" },
    examples: [{ label: "查看樂譜作品", path: "/sheet-music/" }],
  },
};

export async function getServices() {
  return (await getCollection("pageCopy"))
    .filter((entry) => entry.id.startsWith("services/") && entry.data.english && entry.data.title)
    .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99));
}
