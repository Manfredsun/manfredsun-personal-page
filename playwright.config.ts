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
    command: "npm run preview -- --host 127.0.0.1 --port 4331 --ignore-lock",
    url: "http://127.0.0.1:4331/manfredsun-personal-page/",
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "ignore",
  },
});
