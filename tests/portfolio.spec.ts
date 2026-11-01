import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { z } from "astro/zod";

const contactReady = z.email().safeParse(parse(readFileSync("src/data/site.yaml", "utf8")).email.trim()).success;

test("Useless Youth has one public credit and one role everywhere", async ({ page }) => {
  for (const path of ["/", "/works/"]) {
    await page.goto(path);
    await expect(page.locator("#useless-youth")).toContainText("Music Director");
    await expect(page.locator("#useless-youth")).not.toContainText(/Music Direction|Arrangement|Production/);
  }
  await page.goto("/credits/");
  await expect(page.locator(".credits-table__row").filter({ hasText: "我們就是沒有用的年輕人" })).toHaveCount(1);
  await expect(page.locator(".credits-table__row").filter({ hasText: "我們就是沒有用的年輕人" })).toContainText("Music Director");
  await page.goto("/works/useless-youth/");
  await expect(page.locator("main")).toContainText("Music Director");
  await expect(page.locator("main")).not.toContainText(/Music Direction|Arrangement|Production/);
});

test("public pages do not expose internal verification or scaffolding", async ({ page }) => {
  for (const path of ["/", "/works/", "/credits/", "/works/useless-youth/"]) {
    await page.goto(path);
    await expect(page.locator("main")).not.toContainText(/Needs verification|Role pending|Planned|Data layer|Verified credits connected/);
  }
  await page.goto("/credits/");
  await expect(page.locator("main")).not.toContainText("Jacky Fcy Selected Works");
  await expect(page.locator("main")).not.toContainText("日落時 — Yuki Law — Yuki Law");
});

test("selected works preserve the curated order and project introductions", async ({ page }) => {
  await page.goto("/works/");
  await expect(page.locator(".selected-work h2")).toHaveText([
    "我們就是沒有用的年輕人", "半島體制", "南薑．香茅．罌粟花",
  ]);
  await expect(page.locator(".selected-work__number")).toHaveText(["01", "02", "03"]);
  for (const description of await page.locator(".selected-work__description").all()) {
    await expect(description).not.toBeEmpty();
  }
});

test("credits filters only retain matching rows", async ({ page }) => {
  await page.goto("/credits/");
  await expect(page.locator(".credits-table__row:visible")).toHaveCount(4);
  await page.getByLabel("類別").selectOption("theatre");
  await expect(page.locator(".credits-table__row:visible")).toHaveCount(2);
  await page.locator('select[data-field="role"]').selectOption("Music Director");
  await expect(page.getByText("沒有符合條件的作品。")).toBeVisible();
  await page.getByLabel("類別").selectOption("all");
  await expect(page.locator(".credits-table__row:visible")).toHaveCount(1);
});

test("four verified case studies and SEO endpoints resolve", async ({ request }) => {
  for (const path of ["/works/galangal-lemongrass-poppies/", "/works/duckbill-mission/", "/works/useless-youth/", "/works/sunset-yuki-law/"]) {
    const response = await request.get(path);
    expect(response.ok(), path).toBe(true);
    expect(await response.text()).not.toContain("noindex");
  }
  expect((await request.get("/works/jacky-fcy-selected-works/")).status()).toBe(404);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("https://manfredsun.github.io/works/useless-youth/");
  expect(sitemap.includes("https://manfredsun.github.io/contact/")).toBe(contactReady);
  expect((await request.get("/robots.txt")).ok()).toBe(true);
});

test("works and credits have no serious accessibility issues", async ({ page }) => {
  for (const path of ["/works/", "/credits/"]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
  }
});

for (const width of [375, 768, 1024, 1440]) {
  test(`core pages do not overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/works/", "/credits/", "/about/", "/services/", "/works/useless-youth/"]) {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), path).toBe(false);
    }
  });
}

test("core pages remain usable with enlarged text and reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  for (const path of ["/works/", "/credits/", "/about/", "/services/", "/contact/", "/works/useless-youth/"]) {
    await page.goto(path);
    await page.evaluate(() => document.documentElement.style.fontSize = "200%");
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), path).toBe(false);
    await expect(page.locator("main h1")).toBeVisible();
  }
});
