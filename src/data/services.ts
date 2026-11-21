import { getCollection } from "astro:content";

export const serviceDetails: Record<string, {
  deliverables: string;
  price?: { label?: string; amount: string };
  example?: { label: string; path: string };
}> = {
  "services/composition": {
    deliverables: "歌詞、旋律或配合影像與舞台的原創音樂",
    price: { label: "旋律＋歌詞", amount: "NT$3,000／首" },
    example: { label: "《日落時》作曲案例", path: "/works/sunset-yuki-law/" },
  },
  "services/arrangement": {
    deliverables: "編曲音檔，所需版本於洽詢時確認",
    price: { amount: "NT$5,000／首" },
    example: { label: "查看音樂作品集", path: "/music-portfolio/" },
  },
  "services/music-production": {
    deliverables: "整合創作、錄音與後製的音樂成品",
    example: { label: "《我們就是沒有用的年輕人》", path: "/works/useless-youth/" },
  },
  "services/theatre-music": {
    deliverables: "配合劇本、場景與演出需求的音樂",
    example: { label: "《南薑．香茅．罌粟花》", path: "/works/galangal-lemongrass-poppies/" },
  },
  "services/sound-design": {
    deliverables: "完成清理、音量平衡或混音的音檔",
    price: { label: "後製混音", amount: "NT$1,000／軌" },
  },
  "services/score-preparation": {
    deliverables: "總譜、分譜、和弦譜或主旋律譜",
    price: { label: "和弦譜、樂器伴奏譜或 Lead Sheet", amount: "NT$500／個" },
    example: { label: "查看樂譜作品", path: "/sheet-music/" },
  },
};

export async function getServices() {
  return (await getCollection("pageCopy"))
    .filter((entry) => entry.id.startsWith("services/") && entry.data.english && entry.data.title)
    .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99));
}
