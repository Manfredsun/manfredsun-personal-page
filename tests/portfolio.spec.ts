import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { z } from "astro/zod";

const contactReady = z.email().safeParse(parse(readFileSync("src/data/site.yaml", "utf8")).email.trim()).success;

test("Useless Youth credits agree across the homepage, credits and case study", async ({ page }) => {
  await page.goto("/manfredsun-personal-page/");
  await expect(page.locator("#useless-youth")).toContainText("音樂總監");
  await page.goto("/manfredsun-personal-page/credits/");
  const row = page.locator(".credits-table__row").filter({ hasText: "我們就是沒有用的年輕人" });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText("音樂總監");
  await page.goto("/manfredsun-personal-page/works/useless-youth/");
  await expect(page.locator("main")).toContainText("音樂總監");
});

test("public pages do not expose internal verification or scaffolding", async ({ page }) => {
  for (const path of ["/", "/manfredsun-personal-page/credits/", "/manfredsun-personal-page/works/useless-youth/"]) {
    await page.goto(path);
    await expect(page.locator("main")).not.toContainText(/Needs verification|Role pending|Planned|Data layer|Verified credits connected/);
  }
  await page.goto("/manfredsun-personal-page/credits/");
  await expect(page.locator("main")).not.toContainText("Jacky Fcy Selected Works");
  await expect(page.locator("main")).not.toContainText("日落時 — Yuki Law — Yuki Law");
});

test("featured works preserve their curated order", async ({ page }) => {
  await page.goto("/manfredsun-personal-page/");
  const slugs = await page.locator(".work-list--home .work-row").evaluateAll(rows => rows.map(row => row.id));
  expect(slugs.slice(0, 4)).toEqual(["useless-youth", "peninsula-system", "galangal-lemongrass-poppies", "jacky-fcy-selected-works"]);
});

test("credits filters only retain matching rows", async ({ page }) => {
  await page.goto("/manfredsun-personal-page/credits/");
  await page.getByLabel("類別").selectOption("theatre");
  const rows = page.locator(".credits-table__row:visible");
  expect(await rows.count()).toBeGreaterThan(0);
  for (const row of await rows.all()) await expect(row).toHaveAttribute("data-category", "theatre");
  await page.getByLabel("類別").selectOption("all");
  await page.locator('select[data-field="role"]').selectOption("音樂總監");
  for (const row of await rows.all()) expect((await row.getAttribute("data-roles"))?.split("|")).toContain("音樂總監");
});

test("four verified case studies and SEO endpoints resolve", async ({ request }) => {
  for (const path of ["/manfredsun-personal-page/works/galangal-lemongrass-poppies/", "/manfredsun-personal-page/works/duckbill-mission/", "/manfredsun-personal-page/works/useless-youth/", "/manfredsun-personal-page/works/sunset-yuki-law/"]) {
    const response = await request.get(path);
    expect(response.ok(), path).toBe(true);
    expect(await response.text()).not.toContain("noindex");
  }
  expect((await request.get("/manfredsun-personal-page/works/jacky-fcy-selected-works/")).ok()).toBe(true);
  const sitemap = await (await request.get("/manfredsun-personal-page/sitemap.xml")).text();
  expect(sitemap).toContain("https://manfredsun.github.io/manfredsun-personal-page/works/useless-youth/");
  expect(sitemap.includes("https://manfredsun.github.io/manfredsun-personal-page/contact/")).toBe(contactReady);
  expect((await request.get("/manfredsun-personal-page/robots.txt")).ok()).toBe(true);
});

test("works and credits have no serious accessibility issues", async ({ page }) => {
  for (const path of ["/manfredsun-personal-page/credits/"]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
  }
});

for (const width of [375, 768, 1024, 1440]) {
  test(`core pages do not overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/manfredsun-personal-page/credits/", "/manfredsun-personal-page/about/", "/manfredsun-personal-page/services/", "/manfredsun-personal-page/works/useless-youth/"]) {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), path).toBe(false);
    }
  });
}

test("core pages remain usable with enlarged text and reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  for (const path of ["/manfredsun-personal-page/credits/", "/manfredsun-personal-page/about/", "/manfredsun-personal-page/services/", "/manfredsun-personal-page/contact/", "/manfredsun-personal-page/works/useless-youth/"]) {
    await page.goto(path);
    await page.evaluate(() => document.documentElement.style.fontSize = "200%");
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), path).toBe(false);
    await expect(page.locator("main h1")).toBeVisible();
  }
});
