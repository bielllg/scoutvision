import { defineConfig } from "@playwright/test";

const existingServer = process.env.SCOUTVISION_TEST_URL;
const localServer = "http://127.0.0.1:3131";

export default defineConfig({
  testDir: "./tests/browser",
  use: {
    baseURL: existingServer || localServer,
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  },
  webServer: existingServer ? undefined : {
    command: "npm run start -- --hostname 127.0.0.1 --port 3131",
    url: localServer,
  },
});
