import { defineConfig, devices } from "@playwright/experimental-ct-react";

const edgeProject = {
  name: "edge",
  use: { ...devices["Desktop Edge"], channel: "msedge" },
};
const projects = [
  edgeProject,
  {
    name: "Google Chrome",
    use: {
      ...devices["Desktop Chrome"],
      channel: "chrome",
      contextOptions: {
        permissions: ["clipboard-read", "clipboard-write"],
      },
    },
  },
];

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./",
  // Glob patterns or regular expressions that match test files.
  testMatch: "*src/**/*.ct-spec.tsx",
  /* The base directory, relative to the config file, for snapshot files created with toMatchSnapshot and toHaveScreenshot. */
  snapshotDir: "./__snapshots__",
  /* Maximum time one test can run for. */
  timeout: 20 * 1000,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? "html" : "list",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    /* Port to use for Playwright component endpoint. */
    ctPort: 3100,
    ctViteConfig: {
      optimizeDeps: {
        include: ["shared-models"],
      },
      build: {
        commonjsOptions: {
          include: [/shared-models/, /node_modules/],
        },
      },
    },
  },

  projects,
});
