import { expect, test, type Page } from "@playwright/test";

async function expectLayoutFits(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  const layout = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    overflow: [...document.querySelectorAll<HTMLElement>(
      ".works-hero .display, .selected-work__number, .selected-work__content, .selected-work__meta, .selected-work h2, .selected-work__description, .selected-work__aside",
    )].flatMap((element) => {
      const bounds = element.getBoundingClientRect();
      return element.scrollWidth > element.clientWidth + 1 || bounds.right > innerWidth + 1 || bounds.left < -1
        ? [{ element: element.className || element.tagName, text: element.textContent, width: element.clientWidth, scrollWidth: element.scrollWidth }]
        : [];
    }),
  }));
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewport);
  expect(layout.overflow).toEqual([]);
}

for (const colorScheme of ["light", "dark"] as const) {
  for (const width of [375, 768, 1024, 1440]) {
    for (const fontSize of ["100%", "200%"]) {
      test(`Works at ${width}px with ${fontSize} text in ${colorScheme}`, async ({ page }, testInfo) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
        await page.goto("/works/");
        await page.evaluate((size) => { document.documentElement.style.fontSize = size; }, fontSize);
        await expectLayoutFits(page);

        // Content must fit even when the site's global clipping is disabled.
        const unclipped = await page.addStyleTag({ content: "body { overflow-x: visible !important; }" });
        await expectLayoutFits(page);

        for (const card of await page.locator(".selected-work").all()) {
          const text = (await card.locator(".selected-work__content").boundingBox())!;
          const media = (await card.locator(".selected-work__aside").boundingBox())!;
          if (width <= 768) expect(media.y).toBeGreaterThanOrEqual(text.y + text.height);
          else expect(media.x).toBeGreaterThanOrEqual(text.x + text.width);
          const image = card.locator("img");
          await image.scrollIntoViewIfNeeded();
          await image.evaluate((element: HTMLImageElement) => element.decode());
        }
        await expectLayoutFits(page);
        await unclipped.evaluate((element) => { element.parentNode?.removeChild(element); });

        if (colorScheme === "light" && (fontSize === "100%" || width === 375)) {
          await page.evaluate(() => window.scrollTo(0, 0));
          await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
          const screenshot = testInfo.outputPath(`works-${width}-${fontSize.replace("%", "")}.png`);
          await page.screenshot({ path: screenshot, fullPage: true });
          await testInfo.attach("Works layout", { path: screenshot, contentType: "image/png" });
        }
      });
    }
  }
}

test("enlarged Works stays usable through mobile menu and case study navigation", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const slugs = ["useless-youth", "peninsula-system", "galangal-lemongrass-poppies"];
  for (const slug of slugs) {
    await page.goto("/works/");
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    await page.addStyleTag({ content: "body { overflow-x: visible !important; }" });
    await expectLayoutFits(page);
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
    await expectLayoutFits(page);
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(page.locator("main")).not.toHaveAttribute("inert", "");
    await expectLayoutFits(page);
    const link = page.locator(`.selected-work__link[href="/works/${slug}/"]`);
    await link.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`/works/${slug}/$`));
    await expect(page.locator("main h1")).toBeVisible();
  }
});
