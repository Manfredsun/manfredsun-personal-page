import { test, expect } from "@playwright/test";
import { mkdtemp, cp, symlink, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { parse, stringify } from "yaml";

const exec = promisify(execFile);

test("isolated authoring: blanks, Markdown, skeleton, media, contact and production output", async ({ page, request }) => {
  test.setTimeout(150_000);
  const root = process.cwd();
  const fixture = await mkdtemp(path.join(tmpdir(), "portfolio-authoring-"));
  let server: ReturnType<typeof spawn> | undefined;
  let logs = "";
  const url = "http://127.0.0.1:4332/manfredsun-personal-page";
  try {
    for (const name of ["src", "public", "astro.config.mjs", "package.json", "tsconfig.json"]) await cp(path.join(root, name), path.join(fixture, name), { recursive: true });
    await symlink(path.join(root, "node_modules"), path.join(fixture, "node_modules"));
    // Blank-content scenarios must not depend on the user's current authored copy.
    await writeFile(path.join(fixture, "src/content/work-copy/useless-youth/description.md"), "");
    await writeFile(path.join(fixture, "src/content/page-copy/about/background.md"), "");
    const productPath = path.join(fixture, "src/content/products/local-library-manager.md");
    const product = parse((await readFile(productPath, "utf8")).split("---")[1]);
    product.site_url = "";
    delete product.screenshot;
    await writeFile(productPath, `---\n${stringify(product)}---\n`);
    // A genuine, short audio/video pair; fixtures never enter the real website.
    await exec("ffmpeg", ["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "sine=frequency=440:duration=1", path.join(fixture, "public/media/test.wav")]);
    await exec("ffmpeg", ["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "color=c=gray:s=320x180:d=1", "-c:v", "libx264", "-pix_fmt", "yuv420p", path.join(fixture, "public/media/test.mp4")]);
    await cp(path.join(root, "src/assets/hero.avif"), path.join(fixture, "public/media/test.avif"));
    await writeFile(path.join(fixture, "public/media/test.vtt"), "WEBVTT\n\n00:00:00.000 --> 00:00:01.000\n測試字幕\n");
    const cli = path.join(root, "node_modules/astro/bin/astro.mjs");
    server = spawn(process.execPath, [cli, "dev", "--host", "127.0.0.1", "--port", "4332"], { cwd: fixture, env: { ...process.env, ASTRO_DEV_BACKGROUND: "1" }, stdio: ["ignore", "pipe", "pipe"] });
    server.stdout?.on("data", (data) => { logs += data; });
    server.stderr?.on("data", (data) => { logs += data; });
    await expect.poll(async () => { try { return (await request.get(url, { timeout: 1500 })).status(); } catch { return 0; } }, { timeout: 40_000, message: "Isolated preview should start" }).toBe(200);
    await page.goto(`${url}/works/useless-youth/`);
    await expect(page.getByRole("checkbox", { name: "顯示待填區塊" })).not.toBeChecked();
    await expect(page.locator("[data-empty-slot]:visible")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "作品描述", exact: true })).toHaveCount(0);
    await page.getByRole("checkbox", { name: "顯示待填區塊" }).check();
    await expect(page.getByLabel("作品描述：待填", { exact: true })).toBeVisible();
    await page.screenshot({ path: path.join(root, "test-results/v1-skeleton.png"), fullPage: true });
    await page.goto(`${url}/about/`);
    await expect(page.getByRole("checkbox", { name: "顯示待填區塊" })).toBeChecked();
    await expect(page.getByLabel("背景：待填", { exact: true })).toBeVisible();
    await page.getByRole("checkbox", { name: "顯示待填區塊" }).uncheck();

    const description = path.join(fixture, "src/content/work-copy/useless-youth/description.md");
    await writeFile(description, "這是**填寫測試**。\n\n- 保留 Markdown 清單\n");
    await expect.poll(async () => {
      await page.goto(`${url}/works/useless-youth/`);
      return page.locator("main").textContent();
    }, { timeout: 15_000 }).toContain("填寫測試");
    await expect(page.locator("main strong").filter({ hasText: "填寫測試" })).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "作品描述", exact: true })).toBeVisible();
    for (const empty of ["   \n\t\n", ""]) {
      await writeFile(description, empty);
      await expect.poll(async () => {
        await page.goto(`${url}/works/useless-youth/`);
        return page.getByRole("heading", { name: "作品描述", exact: true }).count();
      }, { timeout: 15_000 }).toBe(0);
    }
    const creditsPath = path.join(fixture, "src/data/credits.yaml");
    const creditData = parse(await readFile(creditsPath, "utf8"));
    const galangalCredit = creditData.credits.find((credit: { work_slug: string }) => credit.work_slug === "galangal-lemongrass-poppies");
    galangalCredit.year = 2020;
    creditData.credits.push({ project: "Fixture without a case study", role: "Sound Design", category: "theatre", work_slug: "fixture-no-case", year: 2021, verified: true, source: "test fixture" });
    await writeFile(creditsPath, stringify(creditData));
    await expect.poll(async () => {
      await page.goto(`${url}/credits/`);
      return page.locator("main").textContent();
    }, { timeout: 15_000 }).toContain("Fixture without a case study");
    await expect(page.getByRole("link", { name: "Fixture without a case study" })).toHaveCount(0);
    await page.getByLabel("年份").selectOption("2020");
    await expect(page.locator(".credits-table__row:visible")).toHaveCount(1);
    await expect(page.locator(".credits-table__row:visible")).toContainText("南薑");
    await page.getByLabel("年份").selectOption("2021");
    await expect(page.locator(".credits-table__row:visible").filter({ hasText: "Fixture without a case study" })).toHaveCount(1);
    const settingsPath = path.join(fixture, "src/data/site.yaml");
    const settings = parse(await readFile(settingsPath, "utf8"));
    settings.email = "not-an-email";
    await writeFile(settingsPath, stringify(settings));
    await expect.poll(async () => (await (await request.get(`${url}/contact/`)).text()).includes("noindex, nofollow"), { timeout: 15_000 }).toBe(true);
    await page.goto(`${url}/contact/`);
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
    expect(await (await request.get(`${url}/sitemap.xml`)).text()).not.toContain("/contact/");
    settings.email = "test@example.com";
    settings.socials = [{ label: "Example", url: "https://example.com/" }];
    await writeFile(settingsPath, stringify(settings));
    await expect.poll(async () => {
      await page.goto(`${url}/contact/`);
      return page.locator('a[href="mailto:test@example.com"]').count();
    }, { timeout: 15_000 }).toBe(1);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Example ↗" })).toHaveAttribute("href", "https://example.com/");
    expect(await (await request.get(`${url}/sitemap.xml`)).text()).toContain("/contact/");

    // Product assets and links are edited only in this isolated copy.
    await page.goto(`${url}/product/`);
    await expect(page.getByRole("button", { name: "Visit Product Site" })).toBeDisabled();
    await expect(page.locator("main article").first().locator("[data-product-placeholder]")).toBeVisible();
    const imageSize = await page.evaluate(async (src) => {
      const image = new Image();
      image.src = src;
      await image.decode();
      return { width: image.naturalWidth, height: image.naturalHeight };
    }, `${url}/media/test.avif`);
    product.screenshot = { src: "/media/test.avif", alt: "產品圖片測試", ...imageSize };
    product.site_url = "https://example.com/";
    await writeFile(productPath, `---\n${stringify(product)}---\n`);
    await writeFile(path.join(fixture, "src/content/page-copy/product/intro.md"), "產品簡介填寫測試。\n");
    await expect.poll(async () => {
      await page.goto(`${url}/product/`);
      return page.getByAltText("產品圖片測試").count();
    }, { timeout: 15_000 }).toBe(1);
    await expect(page.locator("main")).toContainText("產品簡介填寫測試");
    await expect(page.getByAltText("產品圖片測試")).toHaveAttribute("loading", "lazy");
    await expect(page.locator("main article").first().locator("[data-product-placeholder]")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Visit Product Site" })).toHaveCount(0);
    const productLink = page.locator("main article").first().getByRole("link", { name: "Visit Product Site" });
    await expect(productLink).toHaveAttribute("href", "https://example.com/");
    await expect(productLink).toHaveAttribute("target", "_blank");
    await expect(productLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(await page.getByAltText("產品圖片測試").evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);

    const workPath = path.join(fixture, "src/content/works/useless-youth.md");
    const work = parse((await readFile(workPath, "utf8")).split("---")[1]);
    work.cover = "/media/test.avif"; work.cover_alt = "測試封面";
    work.hero_image = "/media/test.avif"; work.hero_alt = "測試主圖";
    work.gallery = [{ src: "/media/test.avif", alt: "測試圖集", caption: "圖片說明" }];
    work.media = [
      { type: "audio", label: "測試音訊", url: "/media/test.wav", transcript: "測試音訊說明" },
      { type: "video", label: "測試影片", url: "/media/test.mp4", captions: "/media/test.vtt" },
      { label: "既有外部連結", url: "https://example.com/" },
    ];
    work.runs = [{ label: "Fixture run", year: 2020, verified: true }, { label: "Hidden draft run", verified: false }];
    await writeFile(workPath, `---\n${stringify(work)}---\n`);
    await expect.poll(async () => {
      await page.goto(`${url}/works/useless-youth/`);
      return page.locator("audio").count();
    }, { timeout: 15_000 }).toBe(1);
    await expect(page.getByAltText("測試主圖")).toBeVisible();
    await expect(page.getByAltText("測試圖集")).toHaveAttribute("loading", "lazy");
    await expect(page.getByRole("link", { name: "既有外部連結 ↗" })).toHaveAttribute("href", "https://example.com/");
    await expect(page.locator("main")).not.toContainText("Hidden draft run");
    await page.getByText("文字說明／逐字稿", { exact: true }).click();
    await expect(page.getByText("測試音訊說明", { exact: true })).toBeVisible();
    for (const type of ["audio", "video"]) {
      const player = page.locator(type);
      await expect(player).toHaveAttribute("controls", "");
      await expect(player).not.toHaveAttribute("autoplay", "");
      await player.evaluate((element: HTMLMediaElement) => element.play());
      await expect.poll(() => player.evaluate((element: HTMLMediaElement) => element.currentTime)).toBeGreaterThan(0);
      await player.evaluate((element: HTMLMediaElement) => element.pause());
    }
    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    }
    await page.goto(`${url}/`);
    await expect(page.getByAltText("測試封面")).toHaveCount(1);

    // Stop dev before building to ensure production is genuinely independent.
    server.kill("SIGTERM");
    await new Promise<void>((resolve) => server!.once("close", () => resolve()));
    server = undefined;
    await exec(process.execPath, [cli, "build"], { cwd: fixture, maxBuffer: 4 * 1024 * 1024 });
    const html = await readFile(path.join(fixture, "dist/works/useless-youth/index.html"), "utf8");
    expect(html).toContain("<audio"); expect(html).toContain("<video");
    expect(html).not.toMatch(/data-preview-controls|data-empty-slot|src\/content\/work-copy|顯示待填區塊/);
    const contact = await readFile(path.join(fixture, "dist/contact/index.html"), "utf8");
    expect(contact).toContain("mailto:test@example.com"); expect(contact).not.toContain("noindex");
    expect(await readFile(path.join(fixture, "dist/sitemap.xml"), "utf8")).toContain("/contact/");
    const productHtml = await readFile(path.join(fixture, "dist/product/index.html"), "utf8");
    expect(productHtml).toContain("產品圖片測試");
    expect(productHtml).toContain('href="https://example.com/"');
    expect(productHtml).not.toMatch(/data-preview-controls|data-empty-slot|src\/content\//);
  } catch (error) {
    throw new Error(`${error}\nIsolated server log:\n${logs.slice(-5000)}`);
  } finally {
    if (server && server.exitCode === null) {
      server.kill("SIGTERM");
      await new Promise<void>((resolve) => server!.once("close", () => resolve()));
    }
    await rm(fixture, { recursive: true, force: true });
  }
});
