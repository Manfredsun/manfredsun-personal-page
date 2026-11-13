import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const base = "/manfredsun-personal-page";
const liveIds = ["yq0equzjNqQ", "q4AVHDOKNuk", "JIP0Q-JD1rQ", "13Mgn-qjHn4", "hOaTewrgL5M"];

test("live clips preserve order, external links and independent archive records", async ({ page }) => {
  await page.goto(`${base}/live-performance/`);
  const cards = page.locator("[data-live-video]");
  await expect(cards).toHaveCount(5);
  expect(await page.locator("[data-youtube-id]").evaluateAll((links) => links.map((link) => link.getAttribute("data-youtube-id")))).toEqual(liveIds);
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.locator("[data-live-record]")).toHaveCount(5);
  await expect(page.locator("[data-live-record]").last()).toContainText("Kai & His Friends");
  await expect(page.locator("[data-live-record]").last().locator(".record-year")).toBeEmpty();
  for (let i = 0; i < liveIds.length; i++) {
    await expect(cards.nth(i).getByRole("link", { name: /YouTube/ })).toHaveAttribute("href", `https://youtu.be/${liveIds[i]}`);
  }
  await page.route("https://www.youtube-nocookie.com/**", (route) => route.fulfill({ body: "<html><body>Player test</body></html>", contentType: "text/html" }));
  await cards.first().locator("[data-youtube-id]").focus();
  await page.keyboard.press("Enter");
  await expect(cards.first().locator("iframe")).toHaveAttribute("src", `https://www.youtube-nocookie.com/embed/${liveIds[0]}?autoplay=1`);
  await expect(cards.first().getByRole("link", { name: /YouTube/ })).toBeVisible();
});

test("AI videos load only on demand and both play and seek", async ({ page, request }) => {
  const initialRequests: string[] = [];
  page.on("request", (req) => { if (req.url().includes(".mp4")) initialRequests.push(req.url()); });
  await page.goto(`${base}/ai-videos/`);
  const videos = page.locator("video");
  await expect(videos).toHaveCount(2);
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
    expect(metrics).toMatchObject({ duration: 8, width: 854, height: 480, paused: true });
    expect(metrics.time).toBeGreaterThanOrEqual(4);
    await video.evaluate((element) => (element as HTMLVideoElement).requestFullscreen());
    await expect.poll(() => video.evaluate((element) => document.fullscreenElement === element)).toBe(true);
    await page.evaluate(() => document.exitFullscreen());
  }
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
        await page.getByRole("button", { name: "Menu", exact: true }).click();
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
