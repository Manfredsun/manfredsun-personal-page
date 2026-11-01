import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const viewports = [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 1000 },
];

for (const colorScheme of ["light", "dark"] as const) {
  for (const viewport of viewports) {
    test(`${colorScheme} homepage at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ colorScheme });
      const consoleErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });

      await page.goto("/manfredsun-personal-page/");
      await expect(page.getByRole("heading", { level: 1 })).toContainText("申承羲");
      await expect(page.locator(".hero").getByText("Hong Kong / Taiwan")).toBeVisible();
      await expect(page.getByRole("link", { name: "Selected Works", exact: true })).toBeVisible();
      await expect(page.locator(".hero").getByRole("link", { name: /Contact/ })).toBeVisible();

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(overflow).toBe(false);
      expect(consoleErrors).toEqual([]);
    });
  }
}

test("homepage has no serious accessibility violations", async ({ page }) => {
  await page.goto("/manfredsun-personal-page/");
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter(({ impact }) => impact === "critical" || impact === "serious");
  expect(serious).toEqual([]);
});

test("mobile menu supports keyboard open and Escape close", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/manfredsun-personal-page/");
  const menuButton = page.getByRole("banner").getByRole("button", { name: "Menu" });
  await menuButton.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menuButton).toHaveAttribute("aria-expanded", "false");
});

for (const width of [375, 768]) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`mobile menu is a solid full-screen panel at ${width}px in ${colorScheme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 812 });
      await page.emulateMedia({ colorScheme });
      await page.goto("/manfredsun-personal-page/credits/");
      await page.getByRole("button", { name: "Menu" }).click();

      const menu = page.locator("#mobile-menu");
      await expect(menu).toBeVisible();
      await expect(menu).toHaveCSS("background-color", "rgb(24, 24, 26)");
      await expect(page.locator("main")).toHaveAttribute("inert", "");
      const bounds = await menu.boundingBox();
      expect(bounds?.width).toBeGreaterThanOrEqual(width - 1);
      expect(bounds?.height).toBeGreaterThanOrEqual(811);
      expect(await page.evaluate(() => {
        const menu = document.querySelector("#mobile-menu");
        const hit = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
        return Boolean(menu && hit && menu.contains(hit));
      })).toBe(true);
      await page.keyboard.press("Escape");
      await expect(menu).toHaveAttribute("aria-hidden", "true");
    });
  }
}

test("navigation and task CTAs resolve", async ({ request }) => {
  for (const path of ["/manfredsun-personal-page/", "/manfredsun-personal-page/works/", "/manfredsun-personal-page/credits/", "/manfredsun-personal-page/about/", "/manfredsun-personal-page/services/", "/manfredsun-personal-page/product/", "/manfredsun-personal-page/contact/"]) {
    const response = await request.get(path);
    expect(response.ok(), `${path} should resolve`).toBe(true);
  }
});

test("reduced preferences and 200% zoom remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await page.goto("/manfredsun-personal-page/");
  await page.evaluate(() => document.documentElement.style.fontSize = "200%");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});

test("enlarged mobile menu remains scrollable and its links are reachable", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/manfredsun-personal-page/credits/");
  await page.evaluate(() => document.documentElement.style.fontSize = "200%");
  await page.getByRole("button", { name: "Menu" }).click();
  const menu = page.locator("#mobile-menu");
  await expect(menu).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await menu.getByRole("link", { name: /Contact/ }).click();
  await expect(page).toHaveURL(/\/contact\/$/);
});
