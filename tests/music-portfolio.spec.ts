import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pagePath = "/manfredsun-personal-page/music-portfolio/";

test("shows the selected works and preserves confirmed roles", async ({ page }) => {
  await page.goto(pagePath);
  const cards = page.locator("[data-music-card]");
  await expect(cards).toHaveCount(18);
  for (const videoId of ["JKG4QMcyjF8", "Wj7UR2HBoCo", "hn-4Oj-WFeo"]) {
    await expect(page.locator(`[data-video-id="${videoId}"]`)).toHaveAttribute("href", `https://youtu.be/${videoId}`);
  }
  await expect(cards.filter({ hasText: "這個世界沒有人會信任悲傷" }).locator(".music-card__role")).toContainText("編曲");
  await expect(cards.filter({ hasText: "2 AM" }).locator(".music-card__role")).toContainText("編曲");
  await expect(cards.filter({ hasText: "2 AM" }).locator(".music-card__role")).not.toContainText("樂手");
  await expect(cards.filter({ hasText: "日落時" }).locator(".music-card__role")).toContainText("作曲");
  await expect(cards.filter({ hasText: "日落時" }).locator(".music-card__role")).not.toContainText("編曲");
  await expect(cards.filter({ hasText: "日落時" }).locator(".music-card__credits")).toContainText("Mochiice／Him Hui");
  await expect(page.getByRole("link", { name: /Jacky Fcy 編曲作品選集/ })).toHaveAttribute("href", "/manfredsun-personal-page/works/jacky-fcy-selected-works/");
  await cards.filter({ hasText: "日落時" }).getByRole("link", { name: "查看作曲與製作名單" }).click();
  const credits = page.getByRole("region", { name: "製作名單" });
  await expect(credits).toHaveAttribute("id", "production-credits");
  await expect(credits.getByRole("listitem").filter({ hasText: "作曲" })).toContainText("申承羲");
  await expect(page.getByRole("link", { name: "洽詢作曲合作" })).toHaveAttribute("href", "/manfredsun-personal-page/contact/#inquiry");
  await page.goBack();
  await expect(cards.filter({ hasText: "我們就是沒有用的年輕人" }).getByRole("link", { name: "YouTube Music ↗" })).toHaveAttribute("href", /music\.youtube\.com\/playlist/);
});

test("loads the selected player on activation and retains the external link", async ({ page }) => {
  await page.goto(pagePath);
  const card = page.locator("[data-music-card]").filter({ hasText: "心之破滅" });
  await expect(page.locator("iframe")).toHaveCount(0);
  await card.getByRole("link", { name: "播放 心之破滅 影片" }).click();
  await expect(card.locator("iframe")).toHaveAttribute("src", "https://www.youtube-nocookie.com/embed/Plezfe5zY1Y?autoplay=1");
  await expect(card.getByRole("link", { name: /YouTube/ })).toHaveAttribute("href", /Plezfe5zY1Y/);
});

for (const width of [375, 768, 1440]) {
  test(`layout and accessibility at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(pagePath);
    await page.addStyleTag({ content: "body { overflow-x: visible !important; }" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const columns = await page.locator(".music-grid").evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
    expect(columns).toBe(width === 375 ? 2 : width === 768 ? 3 : 4);
    const violations = (await new AxeBuilder({ page }).analyze()).violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(violations).toEqual([]);
  });
}
