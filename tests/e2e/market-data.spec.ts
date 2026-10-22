import { test, expect } from './fixtures';
import {
  complete,
  uploadDraft,
  saveDownload,
  record,
  saveDraftText,
} from './helpers';
import {
  createControlDraft,
  createExampleDraft,
} from '../../src/config/constructors';
import { parseScenario } from '../../src/config/config';
import { references } from '../../src/reference/bundle';
import { marketDataHash } from '../../src/reference/market-data';
import type { MarketDataSnapshot } from '../../src/reference/market-data';

test('M03 M11: the app loads server market data with a parameter-free public-data GET', async ({
  page,
}) => {
  const requests: {
    method: string;
    url: string;
    body: string | null;
    contentType: string | null;
  }[] = [];
  await page.route('**/api/market-data', async (route, request) => {
    const response = await route.fetch();
    requests.push({
      method: request.method(),
      url: request.url(),
      body: request.postData(),
      contentType: response.headers()['content-type'] ?? null,
    });
    await route.fulfill({ response });
  });
  await page.goto('/');
  await expect(page.getByTestId('market-refresh-status')).toContainText(
    'Applied 98 historical US years',
    { timeout: 30000 },
  );
  expect(requests).toHaveLength(1);
  expect(requests[0].method).toBe('GET');
  expect(requests[0].body).toBeNull();
  expect(new URL(requests[0].url).search).toBe('');
  expect(requests[0].contentType).toContain('application/json');
  await record('m03.live-requests', requests);
  const d = createExampleDraft();
  d.simulation!.n_paths = 2;
  await uploadDraft(page, d);
  const data = references.market_data!;
  const after = parseScenario((await saveDraftText(page, 'live.toml')).text);
  expect(after.ok).toBe(true);
  if (!after.ok) throw new Error(JSON.stringify(after.issues));
  expect(after.value.market!.income_yield_us_stocks).toBe(
    data.income_yields.us_stocks.value,
  );
  expect(after.value.market!.income_yield_us_bonds).toBe(
    data.income_yields.us_bonds.value,
  );
  expect(after.value.market!.fx_spot).toBe(data.latest.usd_cny.value);
  await complete(page, 2);
  await page.getByRole('button', { name: 'Year ledger', exact: true }).click();
  await expect(
    page.getByRole('table', { name: 'Year ledger', exact: true }),
  ).toBeVisible();
  const storage = await page.evaluate(() => ({
    local: Object.keys(localStorage).sort(),
    session: sessionStorage.length,
  }));
  expect(storage.session).toBe(0);
  expect(storage.local).toEqual(['retire.language']);
});

test('M03 M11: completed runs pin their market data; new server data affects only new runs', async ({
  page,
}) => {
  const requests: string[] = [];
  await page.route('**/api/market-data', async (route, request) => {
    requests.push(request.url());
    await route.continue();
  });
  await page.goto('/');
  await expect(page.getByTestId('market-refresh-status')).toContainText(
    'Applied 98 historical US years',
    { timeout: 30000 },
  );
  const d = createExampleDraft();
  d.simulation!.n_paths = 2;
  await uploadDraft(page, d);
  await complete(page, 2);
  const oldManifest = JSON.parse(
    (
      await saveDownload(
        page,
        'Download run manifest',
        'before-refresh-manifest.json',
      )
    ).text,
  );
  expect(oldManifest.scientific.reference_hashes.market_data).toBe(
    references.market_data!.sha256,
  );
  await page.getByRole('button', { name: 'Year ledger', exact: true }).click();
  await expect(
    page.getByRole('table', { name: 'Year ledger', exact: true }),
  ).toBeVisible();
  const oldLedger = (
    await saveDownload(page, 'Download ledger CSV', 'before-refresh.csv')
  ).text;
  expect(oldLedger).toContain('annual_investment_return');

  let updated: MarketDataSnapshot | null = null;
  await page.unrouteAll({ behavior: 'wait' });
  await page.route('**/api/market-data', async (route, request) => {
    requests.push(request.url());
    const response = await route.fetch();
    const data = (await response.json()) as MarketDataSnapshot;
    updated = {
      ...data,
      income_yields: {
        us_stocks: {
          ...data.income_yields.us_stocks,
          value: 0.02,
          numerator: 120,
          denominator: 6000,
        },
        us_bonds: { ...data.income_yields.us_bonds, value: 0.06 },
      },
      latest: {
        ...data.latest,
        usd_cny: { ...data.latest.usd_cny, value: 7.5 },
        cn_cpi: { ...data.latest.cn_cpi, value: 0.025 },
        us_cpi: { ...data.latest.us_cpi, value: 0.031 },
      },
    };
    updated.sha256 = marketDataHash(updated);
    await route.fulfill({ response, json: updated });
  });
  await page.reload();
  await expect(page.getByTestId('market-refresh-status')).toContainText(
    'Applied 98 historical US years',
    { timeout: 30000 },
  );
  // The re-uploaded draft picks up the new server data on load.
  await uploadDraft(page, d);
  const after = parseScenario((await saveDraftText(page, 'live.toml')).text);
  expect(after.ok).toBe(true);
  if (!after.ok) throw new Error(JSON.stringify(after.issues));
  expect(after.value.market!.income_yield_us_stocks).toBe(0.02);
  expect(after.value.market!.income_yield_us_bonds).toBe(0.06);
  expect(after.value.market!.fx_spot).toBe(7.5);
  await complete(page, 2);
  const newManifest = JSON.parse(
    (
      await saveDownload(
        page,
        'Download run manifest',
        'after-refresh-manifest.json',
      )
    ).text,
  );
  expect(newManifest.scientific.reference_hashes.market_data).toBe(
    updated!.sha256,
  );
  expect(newManifest.market_data).toEqual(updated);
  expect(newManifest.scientific.reference_hashes.market_data).not.toBe(
    oldManifest.scientific.reference_hashes.market_data,
  );
  expect(requests.length).toBeGreaterThanOrEqual(2);
  await record('m03.refresh-rerun', {
    before: oldManifest.scientific.reference_hashes.market_data,
    after: newManifest.scientific.reference_hashes.market_data,
  });
});

test('M03 M10: failed and malformed server data preserve data and the editable configuration', async ({
  page,
}, info) => {
  let mode: 'failed' | 'malformed' = 'failed';
  await page.route('**/api/market-data', async (route) => {
    if (mode === 'failed') {
      await route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'FRED unavailable' }),
      });
      return;
    }
    const changed = structuredClone(references.market_data!);
    changed.income_yields.us_bonds.value = 0.02;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(changed),
    });
  });
  await page.goto('/retire/');
  await expect(page.getByRole('alert')).toContainText('FRED unavailable');
  await expect(page.getByTestId('market-refresh-status')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Load sample config', exact: false })
    .click();
  const initial = (
    await saveDraftText(
      page,
      `${info.project.name}-market-refresh-failure-before.toml`,
    )
  ).text;
  const originalHash = await page.getByTestId('market-data-hash').textContent();
  mode = 'malformed';
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('SHA-256');
  await page
    .getByRole('button', { name: 'Load sample config', exact: false })
    .click();
  expect(
    (
      await saveDraftText(
        page,
        `${info.project.name}-market-refresh-failure-after.toml`,
      )
    ).text,
  ).toBe(initial);
  await expect(page.getByTestId('market-data-hash')).toHaveText(originalHash!);
  await expect(
    page.getByRole('button', { name: 'Refresh market data', exact: true }),
  ).toHaveCount(0);
  await record(`${info.project.name}-market-refresh-errors.json`, {
    status: 'PASS',
    mount: '/retire/',
    cases: ['HTTP 502', 'mismatched package hash'],
    configuration_and_data_unchanged: true,
  });
});

test('M03: the refresh gateway accepts only a parameter-free public-data GET', async ({
  request,
  baseURL,
}) => {
  const post = await request.post(`${baseURL}/api/market-data`, {
    data: { seed: 1 },
  });
  expect(post.status()).toBe(405);
  const params = await request.get(`${baseURL}/api/market-data?seed=1`);
  expect(params.status()).toBe(400);
  const put = await request.put(`${baseURL}/api/market-data`);
  expect(put.status()).toBe(405);
  const port = new URL(baseURL!).port || '4173';
  for (const base of [
    `http://127.0.0.1:${port}/`,
    `http://127.0.0.1:${port}/retire/`,
  ]) {
    const ok = await request.get(`${base}api/market-data`);
    expect(ok.status()).toBe(200);
    expect(ok.headers()['content-type']).toContain('application/json');
    const data = (await ok.json()) as MarketDataSnapshot;
    expect(data.format_version).toBe('retire-market-data-v1');
    expect(data.history).toHaveLength(98);
    expect(
      new Date(data.sources[0].retrieved_at).getTime(),
    ).toBeLessThanOrEqual(new Date(data.fetched_at).getTime());
  }
  await record('m03.gateway-shape', { ok: true });
});

test('M03: the gateway serves the maintained package, not live providers', async ({
  request,
  baseURL,
}) => {
  const first = (await (
    await request.get(`${baseURL}/api/market-data`)
  ).json()) as MarketDataSnapshot;
  const second = (await (
    await request.get(`${baseURL}/api/market-data`)
  ).json()) as MarketDataSnapshot;
  // A file-backed gateway returns identical snapshots across calls.
  expect(second).toEqual(first);
  expect(first.sha256).toBe(references.market_data!.sha256);
  await record('m03.gateway-stable', { sha256: first.sha256 });
});

test('M08 M09 M10: native worker stops at zero net assets and ledger/CSV contain only simulated years', async ({
  page,
}, info) => {
  const d = createControlDraft();
  d.simulation = { ...d.simulation, n_paths: 1, max_age: 43 };
  Object.assign(d.market!, {
    home_cpi_mean: 0,
    home_cpi_start: 0,
    fx_spot: 1,
    fx_fair_value: 1,
  });
  d.budget = { annual: 250000, included_health: 0 };
  d.accounts![0].balance = 500000;

  await page.goto('/');
  await uploadDraft(page, d);
  await complete(page, 1);
  await expect(page.getByTestId('success-probability')).toHaveText('0.0%');
  const manifest = JSON.parse(
    (
      await saveDownload(
        page,
        'Download run manifest',
        `${info.project.name}-net-asset-stop-manifest.json`,
      )
    ).text,
  );
  expect(manifest.scientific.horizon).toBe(4);
  expect(manifest.scientific.stopping_policy).toBe(
    'younger-max-age-or-nonpositive-net-worth',
  );
  expect(manifest.aggregate.nominal_bands).toEqual([
    272180, 272180, 272180, 23768.087890625, 23768.087890625, 23768.087890625,
    0, 0, 0, 0, 0, 0,
  ]);
  await page.getByRole('button', { name: 'Year ledger', exact: true }).click();
  await expect(
    page
      .getByRole('table', { name: 'Year ledger', exact: true })
      .locator('tbody tr'),
  ).toHaveCount(3);
  const csv = (
    await saveDownload(
      page,
      'Download ledger CSV',
      `${info.project.name}-net-asset-stop.csv`,
    )
  ).text;
  expect(
    csv.split('\n').filter((row) => row && !row.startsWith('#')),
  ).toHaveLength(4);
  expect(csv).toContain('# active_years=3');
  expect(csv).toContain('"year":2028');
  d.accounts![0].balance = 0;
  await uploadDraft(page, d);
  await complete(page, 1);
  await page.getByRole('button', { name: 'Year ledger', exact: true }).click();
  await expect(
    page
      .getByRole('table', { name: 'Year ledger', exact: true })
      .locator('tbody tr'),
  ).toHaveCount(0);
  const empty = (
    await saveDownload(
      page,
      'Download ledger CSV',
      `${info.project.name}-zero-start.csv`,
    )
  ).text;
  expect(
    empty.split('\n').filter((row) => row && !row.startsWith('#')),
  ).toHaveLength(1);
  await record(`${info.project.name}-net-asset-stop.json`, {
    status: 'PASS',
    method:
      'Actual production worker; brokerage T-bill cash depletes in the third year; zero initial net assets have zero annual rows with no Social Security benefits',
    planned_horizon: 4,
    first_active_years: 3,
    zero_start_active_years: 0,
    csv_only_simulated_years: true,
    whole_cohort_zero_padding: true,
  });
});
