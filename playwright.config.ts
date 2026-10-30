import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
        launchOptions: {
          // The current macOS execution host denies Mach-port registration by browser child processes.
          // Still exercises real browser UI, dedicated workers, transfers and downloads.
          args:
            process.env.RETIRE_MULTI_PROCESS === '1'
              ? []
              : ['--single-process', '--in-process-gpu', '--disable-gpu'],
        },
      },
    },
    ...(process.env.RETIRE_TEST_WEBKIT === '1'
      ? [{ name: 'webkit', use: { ...devices['Desktop Safari'] } }]
      : []),
  ],
  webServer: {
    command: 'npm run test:serve',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
});
