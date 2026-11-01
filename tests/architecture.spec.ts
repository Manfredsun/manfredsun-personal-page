import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { z } from "astro/zod";

const configuredEmail = parse(readFileSync("src/data/site.yaml", "utf8")).email.trim();
const contactReady = z.email().safeParse(configuredEmail).success;

const routes = ["/", "/works/", "/credits/", "/about/", "/services/", "/product/", "/contact/", "/works/galangal-lemongrass-poppies/", "/works/duckbill-mission/", "/works/useless-youth/", "/works/sunset-yuki-law/", "/404.html"];

test("every internal link, fragment, image and button target is valid", async ({ page, request }) => {
  const checked = new Set<string>();
  const external = new Set<string>();
  for (const route of routes) {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(route);
    await expect(page.locator("[data-preview-controls], [data-empty-slot]")).toHaveCount(0);
    const links = await page.locator("a").evaluateAll((anchors) => anchors.map((a) => ({ href: a.getAttribute("href"), target: a.getAttribute("target"), rel: a.getAttribute("rel") })));
    for (const { href, target, rel } of links) {
      expect(href, `${route} has an empty link`).toBeTruthy();
      expect(href, `${route} has a placeholder link`).not.toBe("#");
      expect(href).not.toMatch(/^javascript:/i);
      if (target === "_blank") expect(rel).toContain("noopener");
      const url = new URL(href!, page.url());
      if (url.origin !== new URL(page.url()).origin) {
        if (url.protocol === "https:" || url.protocol === "http:") external.add(url.href);
        continue;
      }
      if (!checked.has(url.pathname)) {
        expect((await request.get(url.pathname)).ok(), url.href).toBe(true);
        checked.add(url.pathname);
      }
      if (url.hash) {
        const response = await request.get(url.pathname);
        expect(await response.text(), url.href).toContain(`id="${decodeURIComponent(url.hash.slice(1))}"`);
      }
    }
    for (const img of await page.locator("img").all()) {
      expect(await img.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    }
    for (const button of await page.locator("button").all()) {
      // Product site actions remain disabled until a real URL is supplied.
      const recognized = await button.evaluate((element) => element.hasAttribute("data-filter") || element.hasAttribute("aria-controls") || element.hasAttribute("data-menu-close") || (element.hasAttribute("data-product-cta") && (element as HTMLButtonElement).disabled));
      expect(recognized, await button.textContent() || route).toBe(true);
    }
    expect(errors).toEqual([]);
  }
  for (const url of external) {
    const response = await request.get(url, { timeout: 20_000 });
    expect(response.ok(), `External link: ${url}`).toBe(true);
  }
});

test("selected works have reachable case study links", async ({ page, request }) => {
  await page.goto("/works/");
  const links = page.locator(".selected-work__link");
  await expect(links).toHaveCount(3);
  for (const link of await links.all()) {
    await expect(link).toBeVisible();
    expect((await request.get((await link.getAttribute("href"))!)).ok()).toBe(true);
  }
});

test("desktop navigation and each mobile navigation link work", async ({ page }) => {
  for (const mobile of [false, true]) {
    await page.setViewportSize({ width: mobile ? 375 : 1440, height: 900 });
    for (const path of ["/", "/works/", "/credits/", "/about/", "/services/", "/product/", "/contact/"]) {
      await page.goto("/");
      if (mobile) await page.getByRole("button", { name: "Menu", exact: true }).click();
      const nav = mobile ? page.getByRole("navigation", { name: "Mobile navigation" }) : page.getByRole("banner");
      await nav.locator(`a[href="${path}"]`).filter({ visible: true }).first().click();
      await expect(page).toHaveURL(new RegExp(path === "/" ? "/$" : `${path}$`));
      await expect(page.locator("main h1")).toBeVisible();
    }
  }
});

test("every credit role and category option filters the matching records", async ({ page }) => {
  await page.goto("/credits/");
  for (const field of ["category", "role"]) {
    const select = page.locator(`select[data-field="${field}"]`);
    const values = await select.locator("option").evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value));
    for (const value of values) {
      await select.selectOption(value);
      for (const row of await page.locator(".credits-table__row:visible").all()) {
        if (value !== "all") expect((await row.getAttribute(field === "role" ? "data-roles" : "data-category"))!.split("|")).toContain(value);
      }
    }
    await select.selectOption("all");
  }
});

test("contact follows configured email and 404 offers working routes", async ({ page }) => {
  await page.goto("/contact/");
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(contactReady ? 1 : 0);
  if (contactReady) {
    await expect(page.locator('a[href^="mailto:"]')).toHaveAttribute("href", `mailto:${configuredEmail}`);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  } else {
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  }
  await page.goto("/404.html");
  await page.getByRole("link", { name: "瀏覽作品", exact: true }).click();
  await expect(page).toHaveURL(/\/works\/$/);
});

test("all remaining pages pass accessibility and responsive checks", async ({ page }) => {
  for (const route of ["/about/", "/services/", "/product/", "/contact/", "/works/useless-youth/", "/404.html"]) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(({ impact }) => impact === "critical" || impact === "serious"), route).toEqual([]);
    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), `${route} at ${width}`).toBe(false);
    }
  }
});


test("mobile close button restores page interaction", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/works/");
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.locator("main")).not.toHaveAttribute("inert", "");
  await page.locator(".selected-work__link").first().click();
  await expect(page).toHaveURL(/\/works\/useless-youth\/$/);
  await expect(page.locator("main h1")).toContainText("我們就是沒有用的年輕人");
});


test("capture completed desktop and mobile layouts", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.screenshot({ path: "test-results/v1-home-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/works/");
  await page.screenshot({ path: "test-results/v1-works-mobile.png", fullPage: true });
});
