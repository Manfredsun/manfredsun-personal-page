/** Shared Traditional Chinese interface copy. Names and source credits stay in their owning data. */
export const navigation = [
  { label: "首頁", href: "/" },
  { label: "關於我", href: "/about/" },
  { label: "作品與職務紀錄", href: "/credits/" },
  { label: "音樂作品集", href: "/music-portfolio/" },
  { label: "現場演出", href: "/live-performance/" },
  { label: "樂譜作品", href: "/sheet-music/" },
  { label: "AI 圖像", href: "/ai-images/" },
  { label: "AI 影片", href: "/ai-videos/" },
  { label: "應用程式", href: "/product/" },
  { label: "合作服務", href: "/services/" },
  { label: "聯絡我", href: "/contact/" },
] as const;

export const ui = {
  menu: "選單", closeMenu: "關閉選單", primaryNavigation: "主要導覽", mobileNavigation: "行動版導覽",
  selectedWorks: "精選作品", contact: "聯絡我", requestQuote: "洽詢合作與報價",
  credits: "作品與職務紀錄", productSite: "前往產品網站", repository: "查看 GitHub 原始碼",
  previousImage: "上一張圖片", nextImage: "下一張圖片", closeImage: "關閉圖片",
} as const;

export const categoryLabels = { music: "音樂", theatre: "劇場", live: "現場演出", personal: "個人企劃", archive: "早期紀錄" } as const;

const roleLabels: Record<string, string> = {
  "Music Director": "音樂總監", "Music Design": "音樂設計", "Sound Design": "聲音設計",
  Composition: "作曲", Arrangement: "編曲", "Sound Engineer": "音響工程",
  "曲": "作曲", "詞": "作詞", "編": "編曲", "監": "監製",
};
export function roleLabel(role: string): string {
  return role.split(" · ").map((part) => roleLabels[part] ?? part).join(" · ");
}

export const scoreFormatLabels: Record<string, string> = {
  Leadsheet: "旋律與和弦譜", "Lead Sheet": "旋律與和弦譜", "Chord Chart": "和弦譜",
  "Full Score": "總譜", "Chord Analysis": "和弦分析", "Solo Transcription": "獨奏採譜",
  "Piano Comping": "鋼琴伴奏譜",
};

export const instrumentLabels: Record<string, string> = {
  Vocal: "人聲", Melody: "旋律", "Bass Guitar": "貝斯", Piano: "鋼琴",
  "Acoustic Guitar": "木吉他", Ukulele: "烏克麗麗", Drum: "爵士鼓", "Electric Guitar": "電吉他",
};
