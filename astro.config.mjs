import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://manfredsun.github.io",
  base: "/manfredsun-personal-page",
  output: "static",
  cacheDir: "./.astro/cache/",
  devToolbar: { enabled: false },
  build: {
    format: "directory",
  },
});
