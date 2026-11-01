import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
const scores = JSON.parse(readFileSync(new URL("../src/data/sheet-music.json", import.meta.url), "utf8")) as Array<{ id: string; title: string; format: string; url: string }>;

test("all verified products have matching independent product links and no score previews", async ({ page, request }) => {
  await page.goto('/manfredsun-personal-page/sheet-music/');
  await expect(page).toHaveTitle('Sheet Music — Manfred Sun');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://manfredsun.github.io/manfredsun-personal-page/sheet-music/');
  await expect(page.locator('main article')).toHaveCount(34);
  expect(new Set(scores.map(s => s.url)).size).toBe(34);
  for (const score of scores) {
    const card = page.locator(`[data-score-id="${score.id}"]`);
    await expect(card.getByRole('heading')).toHaveText(score.title);
    const link = card.getByRole('link');
    await expect(link).toHaveAttribute('href', score.url);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(score.url).toMatch(/^https:\/\/www\.mymusic5\.com\/manfredsun\/\d+$/);
  }
  await expect(page.locator('main img, main iframe, main object, main embed, main a[href$=".pdf"]')).toHaveCount(0);
  expect((await request.get('/manfredsun-personal-page/images/sheet-music/all-of-me.jpg')).status()).toBe(404);
  for (const format of [...new Set(scores.map(s => s.format))]) {
    await page.getByLabel('樂譜類型').selectOption(format);
    await expect(page.locator('main article:visible')).toHaveCount(scores.filter(s => s.format === format).length);
  }
  await page.getByLabel('樂譜類型').selectOption('all');
  await expect(page.locator('main article:visible')).toHaveCount(34);
});

for (const width of [375, 768, 1440]) test(`layout, navigation and accessibility at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/manfredsun-personal-page/sheet-music/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const cards = page.locator('main article');
  const positions = await cards.evaluateAll((items) => items.slice(0, 4).map((item) => Math.round(item.getBoundingClientRect().top)));
  const expectedColumns = width <= 672 ? 1 : width <= 1024 ? 2 : 3;
  expect(positions.filter((top) => top === positions[0])).toHaveLength(expectedColumns);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sheet Music');
  if (width < 1025) {
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await expect(page.locator('#mobile-menu').getByRole('link', { name: 'Sheet Music' })).toHaveAttribute('aria-current', 'page');
    await page.keyboard.press('Escape');
  } else await expect(page.locator('.desktop-nav').getByRole('link', { name: 'Sheet Music' })).toHaveAttribute('aria-current', 'page');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
