import { test, expect } from './fixtures';
import { complete, saveDownload, record } from './helpers';
import { resolve } from 'node:path';
import pkg from '../../package.json' with { type: 'json' };

test('M01 M11: production subdirectory uses static assets and a locally uploaded sample', async ({
  page,
}, info) => {
  const requests: { url: string; method: string; body: string | null }[] = [],
    errors: string[] = [];
  page.on('request', (r) =>
    requests.push({ url: r.url(), method: r.method(), body: r.postData() }),
  );
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/retire/');
  await page
    .getByLabel('Upload configuration file')
    .setInputFiles(resolve('examples/sample.toml'));
  await complete(page, 5000);
  const manifest = JSON.parse(
    (
      await saveDownload(
        page,
        'Download run manifest',
        `${info.project.name}-subpath.json`,
      )
    ).text,
  );
  expect(manifest.scientific.n_paths).toBe(5000);
  await page.getByRole('button', { name: 'Year ledger', exact: true }).click();
  await expect(
    page.getByRole('table', { name: 'Year ledger', exact: true }),
  ).toBeVisible();
  expect(
    requests.every(
      (r) =>
        r.method === 'GET' &&
        r.body === null &&
        (r.url.startsWith('http://127.0.0.1:4173/retire/') ||
          r.url.startsWith('blob:')),
    ),
  ).toBe(true);
  expect(requests.some((r) => r.url.includes('/retire/assets/'))).toBe(true);
  expect(errors).toEqual([]);
  await record(`${info.project.name}-static-hosting.json`, {
    status: 'PASS',
    mount: '/retire/',
    requests,
    errors,
    manifest,
  });
});

test('M01: header version matches the package release and the footer is gone', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('.header-right .version')).toHaveText(
    `v${pkg.version}`,
  );
  await expect(page.locator('footer')).toHaveCount(0);
  const icon = page.locator('link[rel="icon"]');
  await expect(icon).toHaveAttribute('type', 'image/svg+xml');
  await expect(icon).toHaveAttribute('href', /favicon-.*\.svg$/);
  const response = await page.request.get(
    new URL((await icon.getAttribute('href'))!, page.url()).toString(),
  );
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('image/svg+xml');
  const iconBody = await response.text();
  expect(iconBody).toContain('Reflex');
  expect(iconBody).toContain('#1f6259');
});
