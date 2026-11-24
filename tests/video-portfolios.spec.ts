import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const base = "/manfredsun-personal-page";
const liveGroups = {
  "videos-present-is-present-2025": ["J0bPjp2XGWI", "c0sOOMVziDU", "nfooLE7mTIM"],
  "videos-jacky-fcy-world-farewell-live": ["4NhX5vrqocg", "Nz9dSXVYQWQ", "2CnLZawVToQ", "rPbpmAUaI90", "YeZypGd4UGU", "Ti69Xjatlb0", "ugzgCozT9bc"],
  "videos-other": ["yq0equzjNqQ", "q4AVHDOKNuk", "JIP0Q-JD1rQ", "13Mgn-qjHn4", "hOaTewrgL5M"],
};

test("live recordings show the selected 15 clips and connect both concerts to their credits", async ({ page }) => {
  await page.goto(`${base}/about/`);
  await page.getByRole("link", { name: "查看演奏履歷" }).click();
  await expect(page).toHaveURL(`${base}/live-performance/#performance-records`);
  await expect(page.locator("[data-live-video]")).toHaveCount(15);
  await expect(page.getByText("15 段影片", { exact: true })).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.locator("[data-live-record]")).toHaveCount(7);
  await expect(page.locator('[data-live-record="wang-dao-ming-graduation-2026"]')).toContainText("音響 · 樂手");
  await expect(page.locator("[data-live-record]").last()).toContainText("Kai & His Friends");
  await expect(page.locator("[data-live-record]").last().locator(".record-year")).toBeEmpty();

  const present = page.locator('[data-live-record="present-is-present-2025"]');
  await expect(present.locator("time")).toHaveAttribute("datetime", "2025-11-29");
  await expect(present.locator("time")).toHaveText("2025年11月29日");
  await expect(present.getByText("鍵盤手", { exact: true })).toBeVisible();
  await expect(present.getByRole("link", { name: /觀看演出影片/ })).toHaveAttribute("href", "#videos-present-is-present-2025");
  const jacky = page.locator('[data-live-record="jacky-fcy-world-farewell-live"]');
  await expect(jacky.locator(".record-year")).toHaveText("2025");
  await expect(jacky.getByText("鍵盤手", { exact: true })).toBeVisible();
  await jacky.getByRole("link", { name: /觀看演出影片/ }).click();
  await expect(page).toHaveURL(`${base}/live-performance/#videos-jacky-fcy-world-farewell-live`);
  await expect(page.locator("#videos-jacky-fcy-world-farewell-live").getByText("keyboard 2", { exact: true })).toHaveCount(6);
  for (const id of ["hsGobVtd54M", "zEp-2UBg_qA", "L7v5kUNnysA", "P0BaSgjNJiY", "q2lbxjT_-I8", "PLiZ7WjNpF4H4AxUbHKn1Q2FCJ35mAIjXs"]) {
    await expect(page.locator(`a[href*="${id}"]`)).toHaveCount(0);
  }

  await page.route("https://www.youtube-nocookie.com/**", (route) => route.fulfill({ body: "<html><body>Player test</body></html>", contentType: "text/html" }));
  for (const [groupId, videoIds] of Object.entries(liveGroups)) {
    const group = page.locator(`#${groupId}`);
    const cards = group.locator("[data-live-video]");
    const previews = group.locator("[data-youtube-id]");
    expect(await previews.evaluateAll((links) => links.map((link) => link.getAttribute("data-youtube-id")))).toEqual(videoIds);
    for (const [index, videoId] of videoIds.entries()) {
      await expect(cards.nth(index).getByRole("link", { name: /YouTube/ })).toHaveAttribute("href", `https://youtu.be/${videoId}`);
    }
    await previews.first().focus();
    await page.keyboard.press("Enter");
    await expect(cards.first().locator("iframe")).toHaveAttribute("src", `https://www.youtube-nocookie.com/embed/${videoIds[0]}?autoplay=1`);
    await expect(cards.first().getByRole("link", { name: /YouTube/ })).toBeVisible();
  }
});

test("AI videos load only on demand and both play and seek", async ({ page, request }) => {
  const initialRequests: string[] = [];
  page.on("request", (req) => { if (req.url().includes(".mp4")) initialRequests.push(req.url()); });
  await page.goto(`${base}/ai-videos/`);
  const videos = page.locator("video");
  await expect(videos).toHaveCount(3);
  await expect(page.getByText("食農扎根 × 世代共享", { exact: false })).toBeVisible();
  expect(initialRequests).toEqual([]);
  for (const video of await videos.all()) {
    await expect(video).toHaveAttribute("preload", "none");
    await expect(video).not.toHaveAttribute("autoplay", "");
    const poster = await video.getAttribute("poster");
    expect((await request.get(poster!)).ok()).toBe(true);
    const metrics = await video.evaluate(async (element) => {
      const v = element as HTMLVideoElement;
      await v.play();
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("seek timed out")), 8000);
        v.addEventListener("seeked", () => { clearTimeout(timer); resolve(); }, { once: true });
        v.currentTime = 4;
      });
      v.pause();
      return { duration: v.duration, width: v.videoWidth, height: v.videoHeight, time: v.currentTime, paused: v.paused };
    });
    if (await video.getAttribute("class") === "portrait") {
      expect(metrics).toMatchObject({ width: 1080, height: 1920, paused: true });
      expect(metrics.duration).toBeCloseTo(20.667, 1);
    } else {
      expect(metrics).toMatchObject({ duration: 8, width: 854, height: 480, paused: true });
    }
    expect(metrics.time).toBeGreaterThanOrEqual(4);
    await video.evaluate((element) => (element as HTMLVideoElement).requestFullscreen());
    await expect.poll(() => video.evaluate((element) => document.fullscreenElement === element)).toBe(true);
    await page.evaluate(() => document.exitFullscreen());
  }
});

test("AI YouTube work loads on activation and keeps its external link", async ({ page }) => {
  await page.goto(`${base}/ai-videos/`);
  const project = page.locator(".ai-project").filter({ has: page.getByRole("heading", { name: "2973 公里 MV", level: 2 }) });
  await expect(project.locator("iframe")).toHaveCount(0);
  await expect(project.locator(".silent-note")).toHaveCount(0);
  await expect(project.getByRole("link", { name: /YouTube/ })).toHaveAttribute("href", "https://youtu.be/XhzLFlL5tqs");
  await page.route("https://www.youtube-nocookie.com/**", (route) => route.fulfill({ body: "<html><body>Player test</body></html>", contentType: "text/html" }));
  await project.getByRole("link", { name: "播放 2973 公里 MV 影片" }).click();
  await expect(project.locator("iframe")).toHaveAttribute("src", "https://www.youtube-nocookie.com/embed/XhzLFlL5tqs?autoplay=1");
});

test("AI playback errors retain a usable fallback", async ({ page }) => {
  await page.route("**/media/ai-videos/*.mp4", (route) => route.abort());
  await page.goto(`${base}/ai-videos/`);
  await page.locator("video").first().evaluate((video) => (video as HTMLVideoElement).load());
  await expect(page.locator("[data-playback-error]").first()).toBeVisible();
  await expect(page.locator("[data-ai-clip]").first().getByRole("link", { name: /開啟影片/ })).toHaveAttribute("href", `${base}/media/ai-videos/plant-growth-01.mp4`);
});

for (const route of ["live-performance", "ai-videos"]) {
  for (const width of [375, 768, 1440]) {
    test(`${route} responsive navigation and accessibility at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${base}/${route}/`);
      await page.addStyleTag({ content: "body { overflow-x: visible !important; }" });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const violations = (await new AxeBuilder({ page }).analyze()).violations.filter(({ impact }) => impact === "serious" || impact === "critical");
      expect(violations).toEqual([]);
      if (width !== 768) await page.screenshot({ path: `test-results/${route}-${width}.png`, fullPage: true });
      if (width < 1281) {
        await page.getByRole("button", { name: "選單", exact: true }).click();
        await expect(page.locator("#mobile-menu [aria-current=page]")).toHaveAttribute("href", `${base}/${route}/`);
        await page.keyboard.press("Escape");
        await expect(page.locator("main")).not.toHaveAttribute("inert", "");
      } else {
        await expect(page.locator(".desktop-nav [aria-current=page]")).toHaveAttribute("href", `${base}/${route}/`);
      }
    });
  }
}

test("new routes appear in the subpath sitemap", async ({ request }) => {
  const xml = await (await request.get(`${base}/sitemap.xml`)).text();
  for (const route of ["live-performance", "ai-videos"]) expect(xml).toContain(`https://manfredsun.github.io${base}/${route}/`);
});
