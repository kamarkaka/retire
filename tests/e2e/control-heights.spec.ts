import { test, expect } from './fixtures';
import type { Locator, Page } from '@playwright/test';
import { complete, record } from './helpers';

async function rowHeights(locators: Locator[]): Promise<number[]> {
  const boxes = await Promise.all(locators.map((l) => l.boundingBox()));
  return boxes.map((b) => {
    if (!b) throw new Error('Expected a visible control with a bounding box');
    return b.height;
  });
}
async function expectSameRow(
  page: Page,
  label: string,
  locators: Locator[],
): Promise<number[]> {
  const heights = await rowHeights(locators);
  expect(
    Math.max(...heights) - Math.min(...heights),
    `${label} heights ${heights.join(',')}`,
  ).toBeLessThanOrEqual(1);
  await expect(locators[0]).toBeVisible();
  return heights;
}

test('M02 M03 M10: buttons and inputs sharing a row render at one height', async ({
  page,
}, info) => {
  const measured: Record<string, number[]> = {};
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Load sample config', exact: false })
    .click();
  const workspace = page.locator('.workspace-toolbar');
  const back = workspace.getByRole('button', {
    name: '← Back to start',
    exact: true,
  });
  await expect(back).toBeVisible();
  await expect(
    workspace.getByRole('button', { name: 'New blank', exact: true }),
  ).toHaveCount(0);
  measured.workspace_toolbar = await rowHeights([back]);
  await page.getByRole('button', { name: 'Simulation', exact: true }).click();
  const seed = page.locator('.seed-control').first();
  measured.seed_row = await expectSameRow(page, 'simulation seed row', [
    seed.locator('input'),
    seed.getByRole('button'),
  ]);
  await complete(page, 200);
  const exports = page.locator('.export-toolbar');
  measured.export_toolbar = await expectSameRow(
    page,
    'results export toolbar',
    [
      exports.getByRole('button', { name: 'Pin completed run', exact: true }),
      exports.getByRole('button', { name: 'Download run config', exact: true }),
      exports.getByRole('button', {
        name: 'Download run manifest',
        exact: true,
      }),
    ],
  );
  await page.getByRole('button', { name: 'Year ledger', exact: true }).click();
  await expect(page.getByTestId('ledger-ready')).toContainText('active years');
  const ledger = page.locator('.ledger-panel');
  measured.ledger_path_row = await expectSameRow(page, 'ledger path row', [
    ledger.getByRole('button', { name: 'Worst', exact: true }),
    ledger.getByRole('button', { name: '10th path', exact: true }),
    ledger.getByRole('button', { name: 'Median', exact: true }),
    ledger.getByLabel('Replay path ID', { exact: true }),
  ]);
  const ledgerToolbar = page.locator('.ledger-toolbar');
  measured.ledger_toolbar = await expectSameRow(page, 'ledger toolbar', [
    ledgerToolbar.getByRole('button', {
      name: 'Last active year',
      exact: true,
    }),
    ledgerToolbar.getByRole('button', {
      name: 'Download ledger CSV',
      exact: true,
    }),
    ledgerToolbar.getByRole('button', {
      name: 'Download path provenance',
      exact: true,
    }),
  ]);
  await page.getByRole('button', { name: 'Results', exact: true }).click();
  await page
    .getByRole('button', { name: 'Pin completed run', exact: true })
    .click();
  await complete(page, 200);
  await page.getByRole('button', { name: 'Compare', exact: true }).click();
  await expect(page.getByTestId('comparison-compatibility')).toContainText(':');
  const compare = page.getByRole('button', {
    name: 'Download baseline config',
    exact: true,
  });
  measured.compare_row = await expectSameRow(page, 'compare downloads', [
    compare,
    page.getByRole('button', { name: 'Show baseline ledger', exact: true }),
  ]);
  await record(`${info.project.name}-control-heights.json`, {
    status: 'PASS',
    method:
      'Bounding-box heights of same-row buttons and inputs; spread at most 1px',
    rows: measured,
  });
});
test('M10: hero copy renders on a single line at desktop width', async ({
  page,
}) => {
  await page.goto('/');
  const box = await page.locator('.hero-copy').boundingBox();
  if (!box) throw new Error('Expected a visible hero copy paragraph');
  expect(box.height).toBeLessThan(40);
});
