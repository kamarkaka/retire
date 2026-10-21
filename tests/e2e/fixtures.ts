import { test as base, expect } from '@playwright/test';

// Fresh browsers avoid Chromium's unsupported reuse of incognito contexts with
// the current macOS single-process launch workaround. App workers are real workers.
export const test = base.extend({
  context: async (
    {
      playwright,
      browserName,
      launchOptions,
      channel,
      headless,
      contextOptions,
      baseURL,
      viewport,
      userAgent,
      isMobile,
      hasTouch,
    },
    use,
    info,
  ) => {
    const browser = await playwright[browserName].launch({
      ...launchOptions,
      channel,
      headless,
    });
    const context = await browser.newContext({
      ...contextOptions,
      baseURL,
      viewport,
      userAgent,
      isMobile,
      hasTouch,
    });
    try {
      await use(context);
    } finally {
      await context.close();
      await browser.close();
    }
  },
});
export { expect };
