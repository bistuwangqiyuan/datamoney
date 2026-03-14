import { defineConfig, devices } from '@playwright/test';

// Target: PLAYWRIGHT_BASE_URL or DEPLOY_URL; default Netlify app URL (custom domain asell.icu if reachable)
const baseURL = process.env.PLAYWRIGHT_BASE_URL || process.env.DEPLOY_URL || 'https://datamoney.netlify.app';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  timeout: 30000,
  expect: { timeout: 10000 },
});
