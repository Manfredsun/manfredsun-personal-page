import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:4331",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "python3 -m http.server 4331 --bind 127.0.0.1 --directory dist",
    url: "http://127.0.0.1:4331",
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "ignore",
  },
});
