import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const base = "/manfredsun-personal-page";
const routes = ["/", "/about/", "/credits/", "/music-portfolio/", "/live-performance/", "/sheet-music/", "/ai-images/", "/ai-videos/", "/product/", "/services/", "/contact/",
  "/works/useless-youth/", "/works/peninsula-system/", "/works/galangal-lemongrass-poppies/", "/works/jacky-fcy-selected-works/", "/works/sunset-yuki-law/", "/works/duckbill-mission/", "/works/after-swiping-right/", "/404.html"];
const retiredInterface = /\b(?:Selected Works|Selected Practices|Start a conversation|Visit Product Site|Previous Work List|My Role|Creative Tools|Performance Videos|Live Archive|Transcription & Score Preparation)\b/;

test("all public pages have Chinese metadata, controls and headings without exposing drafts", async ({ page }) => {
  for (const route of routes) {
    await page.goto(`${base}${route}`);
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-Hant");
    await expect(page).toHaveTitle(/申承羲 Manfred Sun/);
    const title = await page.title();
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", title);
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description).toMatch(/[\u4e00-\u9fff]/);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", description!);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toContain(`https://manfredsun.github.io${base}/`);
    // The existing collection title is a proper name, not interface copy.
    expect((await page.locator("body").innerText()).replaceAll("Jacky Fcy Selected Works", "")).not.toMatch(retiredInterface);
    await expect(page.locator("[data-empty-slot], [data-preview-controls]")).toHaveCount(0);
    const names = await page.locator("[aria-label]").evaluateAll((elements) => elements.map((el) => el.getAttribute("aria-label")));
    expect(names.join("\n")).not.toMatch(/Primary navigation|Mobile navigation|Professional metadata|Project links|About and services/);
  }
  await page.goto(`${base}/`);
  await expect(page).toHaveTitle("申承羲 Manfred Sun｜作曲、編曲、音樂製作與劇場音樂／聲音設計");
});

test("translated gallery controls support previous, next, Escape and focus restoration", async ({ page }) => {
  await page.goto(`${base}/ai-images/`);
  const first = page.locator("[data-gallery-item]").first();
  await first.click();
  const dialog = page.getByRole("dialog", { name: "圖片放大檢視" });
  await expect(dialog).toBeVisible();
  const original = await dialog.locator("img").getAttribute("src");
  await dialog.getByRole("button", { name: "下一張圖片" }).click();
  await expect(dialog.locator("img")).not.toHaveAttribute("src", original!);
  await dialog.getByRole("button", { name: "上一張圖片" }).click();
  await expect(dialog.locator("img")).toHaveAttribute("src", original!);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(first).toBeFocused();
});

for (const colorScheme of ["light", "dark"] as const) {
  for (const width of [375, 1440]) {
    test(`Chinese pages remain readable in ${colorScheme} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
      for (const route of routes) {
        await page.goto(`${base}${route}`);
        await page.addStyleTag({ content: "body { overflow-x: visible !important; }" });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), route).toBe(true);
        if (width === 375) {
          await page.evaluate(() => document.documentElement.style.fontSize = "200%");
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} at 200%`).toBe(true);
        }
      }
      for (const route of ["/", "/ai-images/", "/credits/", "/services/"]) {
        await page.goto(`${base}${route}`);
        const serious = (await new AxeBuilder({ page }).analyze()).violations.filter(({ impact }) => impact === "critical" || impact === "serious");
        expect(serious, route).toEqual([]);
      }
      await page.goto(`${base}/`);
      await page.screenshot({ path: `test-results/zh-home-${colorScheme}-${width}.png`, fullPage: true });
    });
  }
}
