import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const base = "/manfredsun-personal-page";
for (const colorScheme of ["light", "dark"] as const) {
  for (const width of [375, 768, 1024, 1440]) {
    for (const fontSize of ["100%", "200%"]) {
      test(`Credits at ${width}px with ${fontSize} text in ${colorScheme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
        await page.goto(`${base}/credits/`);
        await page.evaluate((size) => { document.documentElement.style.fontSize = size; }, fontSize);
        await page.addStyleTag({ content: "body { overflow-x: visible !important; }" });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
        await expect(page.locator("main h1")).toBeVisible();
        await expect(page.locator(".credits-table__row").first()).toBeVisible();
        await expect(page.getByLabel("類別")).toBeVisible();
      });
    }
  }
}

test("Works redirects to Credits, which links to case studies", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${base}/works/`);
  await expect(page).toHaveURL(`${base}/credits/`);
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.locator("main")).not.toHaveAttribute("inert", "");
  await page.locator(`a[href="${base}/works/useless-youth/"]`).first().click();
  await expect(page.locator("main h1")).toContainText("我們就是沒有用的年輕人");
  expect((await new AxeBuilder({ page }).analyze()).violations.filter(v => v.impact === "serious" || v.impact === "critical")).toEqual([]);
});
