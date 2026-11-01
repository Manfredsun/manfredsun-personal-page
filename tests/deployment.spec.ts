import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const base = "/manfredsun-personal-page";
const origin = "https://manfredsun.github.io";

for (const viewport of [{ width: 1440, height: 900 }, { width: 375, height: 812 }]) {
  test(`audio controls and playback at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const slug of ["peninsula-system", "after-swiping-right"]) {
      await page.goto(`${base}/works/${slug}/`);
      const players = page.locator("audio");
      expect(await players.count()).toBeGreaterThan(0);
      for (const player of await players.all()) {
        await expect(player).toHaveAttribute("controls", "");
        await expect(player).toHaveAttribute("controlslist", "nodownload");
      }
      const player = players.first();
      await player.scrollIntoViewIfNeeded();
      await expect(player).toBeVisible();
      await player.click();
      await player.evaluate((element: HTMLAudioElement) => element.play());
      await expect.poll(() => player.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThan(0);
      await player.evaluate((element: HTMLAudioElement) => { element.currentTime = 1; element.pause(); });
      await expect.poll(() => player.evaluate((element: HTMLAudioElement) => element.paused)).toBe(true);
      expect(await player.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThanOrEqual(1);
    }
  });
}

test("subpath navigation, metadata, image and audio resolve", async ({ page, request }) => {
  await page.goto(`${base}/`);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${origin}${base}/`);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", `${origin}${base}/`);
  const structured = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent() || "{}");
  expect(structured.url).toBe(`${origin}${base}/`);
  const hero = page.locator(".hero img");
  await expect.poll(() => hero.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", new RegExp(`^${origin}${base}/`));
  await page.goto(`${base}/works/peninsula-system/`);
  const media = page.locator("audio").first();
  const src = await media.getAttribute("src");
  expect(src).toMatch(new RegExp(`^${base}/media/`));
  const response = await request.get(src!, { headers: { Range: "bytes=0-1023" } });
  expect([200, 206]).toContain(response.status());
  expect(response.headers()["content-type"]).toContain("audio/");
  const gallery = page.locator(".project-gallery img").first();
  expect(await gallery.getAttribute("src")).toMatch(new RegExp(`^${base}/images/`));
  expect((await request.get((await gallery.getAttribute("src"))!)).ok()).toBe(true);
  expect(await (await request.get(`${base}/robots.txt`)).text()).toContain(`${origin}${base}/sitemap.xml`);
  expect(await (await request.get(`${base}/sitemap.xml`)).text()).toContain(`${origin}${base}/works/peninsula-system/`);
});

for (const colorScheme of ["light", "dark"] as const) test(`home accessibility in ${colorScheme}`, async ({ page }) => {
  await page.emulateMedia({ colorScheme });
  await page.goto(`${base}/`);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(v => v.impact === "critical" || v.impact === "serious")).toEqual([]);
});
