import { expect } from './fixtures';
import type { Page } from '@playwright/test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { exportScenario } from '../../src/config/config';
import type { DraftScenario } from '../../src/model/types';

// Evidence and downloads land in Playwright's git-ignored output folder.
export const OUT = resolve('test-results/e2e');
export async function record(name: string, value: unknown) {
  await mkdir(OUT, { recursive: true });
  await writeFile(resolve(OUT, name), JSON.stringify(value, null, 2) + '\n');
}
export async function saveDownload(page: Page, button: string, name: string) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: button, exact: true }).click();
  const download = await pending,
    path = resolve(OUT, name);
  await mkdir(OUT, { recursive: true });
  await download.saveAs(path);
  return { path, text: await readFile(path, 'utf8') };
}
export async function saveDraftText(page: Page, name: string) {
  await page
    .getByRole('button', { name: 'Configuration', exact: true })
    .click();
  const text = (await page.locator('.toml-panel pre').textContent()) ?? '',
    path = resolve(OUT, name);
  await mkdir(OUT, { recursive: true });
  await writeFile(path, text);
  return { path, text };
}
export async function complete(page: Page, paths: number, timeout = 60_000) {
  await page
    .getByRole('button', { name: 'Run simulation', exact: false })
    .click();
  await expect(page.getByTestId('run-status')).toContainText(
    `Completed ${paths.toLocaleString()} paths`,
    { timeout },
  );
}
export async function uploadDraft(page: Page, draft: DraftScenario) {
  await page.getByLabel('Upload configuration file').setInputFiles({
    name: 'local-test.toml',
    mimeType: 'text/plain',
    buffer: Buffer.from(exportScenario(draft)),
  });
}
