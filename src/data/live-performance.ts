interface LiveVideo {
  title: string;
  videoId: string;
  role?: "鍵盤手" | "keyboard 2";
}

export const concertVideos: Partial<Record<string, LiveVideo[]>> = {
  "present-is-present-2025": [
    { title: "金黃色的", videoId: "J0bPjp2XGWI" },
    { title: "我要的幸福", videoId: "c0sOOMVziDU" },
    { title: "我愛你", videoId: "nfooLE7mTIM" },
  ],
  "jacky-fcy-world-farewell-live": [
    { title: "風靈物語 Jer", videoId: "4NhX5vrqocg", role: "鍵盤手" },
    { title: "戀愛腦之死", videoId: "Nz9dSXVYQWQ", role: "keyboard 2" },
    { title: "有今生沒來世", videoId: "2CnLZawVToQ", role: "keyboard 2" },
    { title: "正當世界告別時", videoId: "rPbpmAUaI90", role: "keyboard 2" },
    { title: "俄羅斯套娃", videoId: "YeZypGd4UGU", role: "keyboard 2" },
    { title: "September Night", videoId: "Ti69Xjatlb0", role: "keyboard 2" },
    { title: "Midnight", videoId: "ugzgCozT9bc", role: "keyboard 2" },
  ],
};

export const otherLiveVideos: LiveVideo[] = [
  { title: "WHYte te 演唱會版本《若是明仔載》", videoId: "yq0equzjNqQ" },
  { title: "大人 Keyboard", videoId: "q4AVHDOKNuk" },
  { title: "PINK / キタニタツヤ Keyboard + Program", videoId: "JIP0Q-JD1rQ" },
  { title: "不在一起就不會分開", videoId: "13Mgn-qjHn4" },
  { title: "壞蛋 Keyboard^2", videoId: "hOaTewrgL5M" },
];
