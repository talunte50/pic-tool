// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 配置 — pic-tool 冒烟测试
 * 本地跑：npx playwright install && npx playwright test
 * CI（GitHub Actions）：见 .github/workflows/ci.yml
 */
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: 2,
  retries: process.env.CI ? 2 : 1,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    // 跑本地 dev server；CI 里会先用 astro build + preview，或 astro dev
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:4321',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // 移动端验证（国内流量大头）
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],

  webServer: {
    // CI 和本地共用：自动起 dev server
    command: 'npx astro dev --port 4321',
    url: 'http://localhost:4321',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
