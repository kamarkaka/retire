import { test, expect } from './fixtures';

test('M10: language switcher toggles English and Chinese in real time', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'A clearer view of retirement.' }),
  ).toBeVisible();
  const switcher = page.getByTestId('language-switcher');
  await switcher.getByRole('button', { name: '中文', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
  await expect(
    page.getByRole('heading', { name: '更清晰地看见退休生活。' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: '从示例开始', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: '加载示例配置', exact: false })
    .click();
  await expect(
    page.getByRole('button', { name: '运行模拟', exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: '配置', exact: true }).first(),
  ).toBeVisible();
  await switcher.getByRole('button', { name: 'English', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(
    page.getByRole('button', { name: 'Run simulation', exact: false }),
  ).toBeVisible();
});

test('M10: language choice persists across reload', async ({ page }) => {
  await page.goto('/');
  await page
    .getByTestId('language-switcher')
    .getByRole('button', { name: '中文', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: '更清晰地看见退休生活。' }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
  await expect(
    page.getByRole('heading', { name: '更清晰地看见退休生活。' }),
  ).toBeVisible();
});
