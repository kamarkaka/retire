import { test, expect } from './fixtures';
import { complete, saveDownload, record } from './helpers';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

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
  await complete(page, 200);
  const manifest = JSON.parse(
    (
      await saveDownload(
        page,
        'Download run manifest',
        `${info.project.name}-subpath.json`,
      )
    ).text,
  );
  expect(manifest.scientific.n_paths).toBe(200);
  await page.getByRole('button', { name: 'Year ledger', exact: true }).click();
  await expect(page.getByTestId('ledger-ready')).toBeVisible();
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
  await page.goto('/verification');
  await expect(
    page.getByRole('button', { name: 'Load sample config' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Development verification' }),
  ).toHaveCount(0);
  await record(`${info.project.name}-static-hosting.json`, {
    status: 'PASS',
    mount: '/retire/',
    requests,
    errors,
    manifest,
  });
});

test('M01: development-only literal oracle harness and detached worker probe', async ({
  page,
}, info) => {
  const child = spawn(
    process.execPath,
    [
      resolve('node_modules/vite/bin/vite.js'),
      '--host',
      '127.0.0.1',
      '--port',
      '5175',
      '--strictPort',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
  const ready = new Promise<void>((resolveReady, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Development server startup timed out')),
      15000,
    );
    let output = '';
    child.stdout.on('data', (data) => {
      output += String(data);
      if (output.includes('5175')) {
        clearTimeout(timer);
        resolveReady();
      }
    });
    child.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`Development server exited ${code}`));
    });
    child.once('error', reject);
  });
  try {
    await ready;
    await page.goto('http://127.0.0.1:5175/verification');
    await expect(
      page.getByRole('heading', { name: 'Development verification' }),
    ).toBeVisible();
    await page.locator('select').selectOption('US-7');
    await page.getByRole('button', { name: 'Run case', exact: true }).click();
    await expect(page.locator('pre').nth(1)).toContainText('"status": "PASS"');
    await page
      .getByRole('button', { name: 'Probe transfer', exact: true })
      .click();
    await expect(page.locator('pre').last()).toContainText('"detached":true');
    await expect(page.locator('pre').last()).toContainText('"values":[1,2,3]');
    await record(`${info.project.name}-dev-harness.json`, {
      status: 'PASS',
      case: 'US-7',
      actual: await page.locator('pre').nth(1).textContent(),
      worker_probe: await page.locator('pre').last().textContent(),
    });
  } finally {
    if (child.exitCode === null) {
      const exited = new Promise<void>((resolveExit) =>
        child.once('exit', () => resolveExit()),
      );
      child.kill('SIGTERM');
      await exited;
    }
  }
});
