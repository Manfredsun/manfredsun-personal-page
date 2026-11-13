export interface AIVideoProject {
  id: string;
  title: string;
  description: string;
  clips: Array<{ title: string; src: string; poster: string; width: number; height: number }>;
}

export const aiVideoProjects: AIVideoProject[] = [{
  id: "plant-growth",
  title: "植物生成畫面",
  description: "以種子、覆土、澆灌、扎根、發芽及成長的意象，呈現「食農扎根 × 世代共享」。以下收錄本專案的兩段 AI 生成片段。",
  clips: [
    { title: "植物生成畫面｜片段 1", src: "/media/ai-videos/plant-growth-01.mp4", poster: "/images/ai-videos/plant-growth-01.jpg", width: 854, height: 480 },
    { title: "植物生成畫面｜片段 2", src: "/media/ai-videos/plant-growth-02.mp4", poster: "/images/ai-videos/plant-growth-02.jpg", width: 854, height: 480 },
  ],
}];
