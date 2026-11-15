import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const navigation = ["首頁", "關於我", "作品與職務紀錄", "音樂作品集", "現場演出", "樂譜作品", "AI 圖像", "AI 影片", "應用程式", "合作服務", "聯絡我"];

test("product discovery links to all three product sites", async ({ page, request }) => {
  await page.goto("/manfredsun-personal-page/product/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("應用程式");
  await expect(page.locator("main article")).toHaveCount(3);
  await expect(page.getByRole("heading", { level: 2 })).toHaveText(["AirDrop Wheel", "Audio File Library", "NTFS Editor for macOS"]);
  await expect(page.locator("main")).toContainText("macOS 原生音效素材庫管理工具");
  await expect(page.locator("main")).toContainText("搜尋 → 預聽 → 拖曳");
  await expect(page.locator("main")).toContainText("由申承羲 Manfred Sun 開發");
  const links = page.getByRole("link", { name: "前往產品網站" });
  await expect(links).toHaveCount(3);
  await expect(links.nth(0)).toHaveAttribute("href", "https://manfredsun.github.io/airdrop-wheel/");
  await expect(links.nth(1)).toHaveAttribute("href", "https://manfredsun.github.io/audio-file-library/zh-hant.html?utm_source=chatgpt.com");
  await expect(links.nth(2)).toHaveAttribute("href", "https://manfredsun.github.io/NTFS-Editor-On-Macos/");
  for (const link of await links.all()) await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  await expect(page.getByAltText(/Audio File Library 標誌/)).toHaveAttribute("src", "/manfredsun-personal-page/media/audio-file-library-logo.png");
  await expect(page.getByAltText(/NTFS Editor 標誌/)).toHaveAttribute("src", "/manfredsun-personal-page/media/ntfs-editor-logo.png");
  await expect(page.locator("[data-preview-controls], [data-empty-slot]")).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://manfredsun.github.io/manfredsun-personal-page/product/");
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", "https://manfredsun.github.io/manfredsun-personal-page/product/");
  expect(await (await request.get("/manfredsun-personal-page/sitemap.xml")).text()).toContain("https://manfredsun.github.io/manfredsun-personal-page/product/");
  for (const route of ["/manfredsun-personal-page/works/", "/manfredsun-personal-page/credits/", "/manfredsun-personal-page/works/useless-youth/"]) {
    await page.goto(route);
    await expect(page.locator("main")).not.toContainText("Audio File Library");
  }
});

test("desktop and mobile navigation preserve order and mark Product current", async ({ page }) => {
  for (const mobile of [false, true]) {
    await page.setViewportSize({ width: mobile ? 375 : 1440, height: 900 });
    await page.goto("/manfredsun-personal-page/product/");
    if (mobile) await page.getByRole("button", { name: "選單", exact: true }).click();
    const nav = page.getByRole("navigation", { name: mobile ? "行動版導覽" : "主要導覽" });
    expect(await nav.locator("a").evaluateAll((links) => links.map((link) => link.textContent?.replace("↗", "").trim()))).toEqual(navigation);
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
    await expect(nav.locator('[aria-current="page"]')).toHaveAttribute("href", "/manfredsun-personal-page/product/");
    if (mobile) {
      await page.keyboard.press("Escape");
      await expect(page.locator("main")).not.toHaveAttribute("inert", "");
    }
  }
});

test("desktop navigation links fit beside the brand", async ({ page }) => {
  for (const width of [1281, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/manfredsun-personal-page/product/");
    const brand = await page.locator(".brand").boundingBox();
    const nav = await page.locator(".desktop-nav").boundingBox();
    expect(brand).not.toBeNull(); expect(nav).not.toBeNull();
    expect(nav!.x).toBeGreaterThanOrEqual(brand!.x + brand!.width);
    expect(nav!.x + nav!.width).toBeLessThanOrEqual(width);
  }
});

for (const colorScheme of ["light", "dark"] as const) {
  for (const width of [375, 768, 1024, 1440]) {
    test(`product layout at ${width}px in ${colorScheme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
      await page.goto("/manfredsun-personal-page/product/");
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
      await expect(page.getByRole("heading", { name: "Audio File Library" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "NTFS Editor for macOS" })).toBeVisible();
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
      expect(errors).toEqual([]);
      if (colorScheme === "light" && [375, 1440].includes(width)) {
        await page.screenshot({ path: `test-results/product-${width}.png`, fullPage: true });
      }
    });
  }
}

test("product remains readable at 200% text with reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await page.goto("/manfredsun-personal-page/product/");
  await page.evaluate(() => document.documentElement.style.fontSize = "200%");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.getByRole("button", { name: "選單", exact: true }).click();
  await page.getByRole("navigation", { name: "行動版導覽" }).getByRole("link", { name: /應用程式/ }).click();
  await expect(page).toHaveURL(/\/product\/$/);
});
