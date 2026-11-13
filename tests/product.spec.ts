import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const navigation = ["Home", "About", "Previous Work List", "Music Portfolio", "Live Performance", "Sheet Music", "AI Images", "AI Videos", "Apps", "Services", "Contact"];

test("product discovery links to both product sites", async ({ page, request }) => {
  await page.goto("/manfredsun-personal-page/product/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Apps");
  await expect(page.locator("main article")).toHaveCount(2);
  await expect(page.getByRole("heading", { level: 2 })).toHaveText(["Audio File Library", "NTFS Editor for macOS"]);
  await expect(page.locator("main")).toContainText("Native macOS Sound Library Manager");
  await expect(page.locator("main")).toContainText("Search → Preview → Drag");
  await expect(page.locator("main")).toContainText("Built by 申承羲 Manfred Sun");
  const links = page.getByRole("link", { name: "Visit Product Site" });
  await expect(links).toHaveCount(2);
  await expect(links.nth(0)).toHaveAttribute("href", "https://manfredsun.github.io/audio-file-library/zh-hant.html?utm_source=chatgpt.com");
  await expect(links.nth(1)).toHaveAttribute("href", "https://manfredsun.github.io/NTFS-Editor-On-Macos/");
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
    if (mobile) await page.getByRole("button", { name: "Menu", exact: true }).click();
    const nav = page.getByRole("navigation", { name: mobile ? "Mobile navigation" : "Primary navigation" });
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
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: /Apps/ }).click();
  await expect(page).toHaveURL(/\/product\/$/);
});
