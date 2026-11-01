import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://manfredsun.github.io",
  output: "static",
  cacheDir: "./.astro/cache/",
  devToolbar: { enabled: false },
  build: {
    format: "directory",
  },
});
