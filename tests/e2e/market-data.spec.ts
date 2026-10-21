import { test, expect } from './fixtures';
import {
  createExampleDraft,
  createControlDraft,
} from '../../src/config/constructors';
import { parseScenario } from '../../src/config/config';
import {
  parseMarketData,
  marketDataHash,
  PUBLIC_MARKET_SOURCES,
  type MarketDataSnapshot,
} from '../../src/reference/market-data';
import { references } from '../../src/reference/bundle';
import { complete, uploadDraft, saveDownload, record } from './helpers';

test('M03 M10 M11: homepage refresh fetches all five live public sources and applies source-backed inputs', async ({
  page,
}, info) => {
  const requests: { url: string; method: string; body: string | null }[] = [];
  page.on('request', (r) =>
    requests.push({ url: r.url(), method: r.method(), body: r.postData() }),
  );
  const d = createExampleDraft();
  d.simulation!.n_paths = 16;
  d.simulation!.max_age = 62;
  d.budget!.annual = 310000;
  d.market!.income_yield_us_stocks = 0.01;
  d.market!.income_yield_us_bonds = 0.03;
  d.market!.fx_sigma = 0.08;
  d.market!.home_cpi_mean = 0.04;
  await page.goto('/');
  await uploadDraft(page, d);
  await page
    .getByRole('button', { name: 'Refresh market data', exact: true })
    .click();
  await expect(page.getByTestId('market-refresh-status')).toContainText(
    'Applied',
    { timeout: 40000 },
  );
  const sourceFile = await saveDownload(
      page,
      'Download market data',
      `${info.project.name}-market-refresh-live-package.json`,
    ),
    data = parseMarketData(sourceFile.text);
  expect(data.sources.map((s) => s.id).sort()).toEqual(
    Object.keys(PUBLIC_MARKET_SOURCES).sort(),
  );
  expect(data.history).toHaveLength(98);
  const configuration = parseScenario(
    (
      await saveDownload(
        page,
        'Download current config',
        `${info.project.name}-market-refresh-live-config.toml`,
      )
    ).text,
  );
  expect(configuration.ok).toBe(true);
  if (!configuration.ok) throw new Error(JSON.stringify(configuration.issues));
  expect(configuration.value.market!.income_yield_us_stocks).toBe(
    data.income_yields.us_stocks.value,
  );
  expect(configuration.value.market!.income_yield_us_bonds).toBe(
    data.income_yields.us_bonds.value,
  );
  expect(configuration.value.market!.fx_spot).toBe(data.latest.usd_cny.value);
  expect(configuration.value.budget!.annual).toBe(310000);
  expect(configuration.value.market!.home_cpi_mean).toBe(0.04);
  expect(configuration.value.market!.fx_sigma).toBe(0.08);
  await complete(page, 16);
  const manifest = JSON.parse(
    (
      await saveDownload(
        page,
        'Download run manifest',
        `${info.project.name}-market-refresh-live-manifest.json`,
      )
    ).text,
  );
  expect(manifest.scientific.reference_hashes.market_data).toBe(data.sha256);
  expect(manifest.market_data).toEqual(data);
  const fetches = requests.filter((r) =>
    new URL(r.url).pathname.endsWith('/api/market-data'),
  );
  expect(fetches).toHaveLength(1);
  expect(fetches[0].method).toBe('GET');
  expect(fetches[0].body).toBeNull();
  expect(new URL(fetches[0].url).search).toBe('');
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
    })),
  ).toEqual({ local: 0, session: 0 });
  await record(`${info.project.name}-market-refresh-live.json`, {
    status: 'PASS',
    method:
      'Live gateway, five fixed public downloads; native production worker after apply; no intercepted refresh response',
    sources: data.sources,
    income_yields: data.income_yields,
    latest: data.latest,
    configuration: configuration.value.market,
    request: fetches[0],
    manifest: manifest.scientific,
  });
});

test('M03 M10: refreshing references cannot alter a completed or pinned ledger; exported data reproduce a new run', async ({
  page,
}, info) => {
  // Deliberately changed public-package fixture tests a provider revision; this is not live-source evidence.
  const updated = structuredClone(
    references.market_data!,
  ) as MarketDataSnapshot;
  updated.history.find((r) => r.year === 1982)!.us_stocks = -0.2;
  updated.income_yields.us_bonds.value = 0.055;
  updated.sources.find((s) => s.id === 'DGS10')!.sha256 = '1'.repeat(64);
  updated.sources.find((s) => s.id === 'NYU')!.sha256 = '2'.repeat(64);
  updated.sha256 = marketDataHash(updated);
  const d = createControlDraft();
  d.simulation = { ...d.simulation, n_paths: 1, max_age: 70 };
  for (const id of ['A', 'B'] as const) d.people![id]!.birth_year = 1956;
  Object.assign(d.market!, {
    home_cpi_mean: 0,
    home_cpi_start: 0,
    fx_spot: 1,
    fx_fair_value: 1,
    fx_spread: 0,
  });
  d.budget = { annual: 10000, included_health: 0 };
  d.accounts = [
    {
      name: 'revision_roth',
      type: 'after_tax',
      owner: 'A',
      share_A: 1,
      balance: 100000,
      allocation: { us_stocks: 0.4, us_bonds: 0.6 },
    },
    { ...d.accounts![0], balance: 0 },
  ];
  await page.goto('/');
  await uploadDraft(page, d);
  await complete(page, 1);
  const before = JSON.parse(
    (
      await saveDownload(
        page,
        'Download run manifest',
        `${info.project.name}-market-refresh-original-manifest.json`,
      )
    ).text,
  );
  await page
    .getByRole('button', { name: 'Pin completed run', exact: true })
    .click();
  await page.getByRole('button', { name: 'Year ledger', exact: true }).click();
  await expect(page.getByTestId('ledger-ready')).toContainText(
    '1 active years',
  );
  const originalCsv = (
    await saveDownload(
      page,
      'Download ledger CSV',
      `${info.project.name}-market-refresh-original.csv`,
    )
  ).text;
  await page.route('**/api/market-data', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(updated),
    }),
  );
  await page
    .getByRole('button', { name: 'Refresh market data', exact: true })
    .click();
  await expect(page.getByTestId('market-refresh-status')).toContainText(
    'Applied',
  );
  await expect(
    page.locator('.snapshot-note').filter({ hasText: 'Showing completed run' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Results', exact: true }).click();
  const unchanged = JSON.parse(
    (
      await saveDownload(
        page,
        'Download run manifest',
        `${info.project.name}-market-refresh-retained-manifest.json`,
      )
    ).text,
  );
  expect(unchanged).toEqual(before);
  await page.getByRole('button', { name: 'Year ledger', exact: true }).click();
  await expect(page.getByTestId('ledger-ready')).toContainText(
    '1 active years',
  );
  expect(
    (
      await saveDownload(
        page,
        'Download ledger CSV',
        `${info.project.name}-market-refresh-retained.csv`,
      )
    ).text,
  ).toBe(originalCsv);
  await complete(page, 1);
  const after = JSON.parse(
    (
      await saveDownload(
        page,
        'Download run manifest',
        `${info.project.name}-market-refresh-revised-manifest.json`,
      )
    ).text,
  );
  expect(after.scientific.reference_hashes.market_data).toBe(updated.sha256);
  expect(after.aggregate).not.toEqual(before.aggregate);
  const config = await saveDownload(
      page,
      'Download run config',
      `${info.project.name}-market-refresh-revised.toml`,
    ),
    data = await saveDownload(
      page,
      'Download run market data',
      `${info.project.name}-market-refresh-revised-data.json`,
    );
  await page.getByRole('button', { name: 'Compare', exact: true }).click();
  await expect(page.getByTestId('comparison-compatibility')).toContainText(
    'Unpaired:',
  );
  await page
    .getByRole('button', { name: 'Show baseline ledger', exact: true })
    .click();
  await expect(page.getByTestId('ledger-ready')).toContainText(
    '1 active years',
  );
  expect(
    (
      await saveDownload(
        page,
        'Download ledger CSV',
        `${info.project.name}-market-refresh-pinned.csv`,
      )
    ).text,
  ).toBe(originalCsv);
  await page.reload();
  await page
    .getByLabel('Upload market data file', { exact: true })
    .setInputFiles(data.path);
  await page
    .getByLabel('Upload configuration file', { exact: true })
    .setInputFiles(config.path);
  await complete(page, 1);
  const reproduced = JSON.parse(
    (
      await saveDownload(
        page,
        'Download run manifest',
        `${info.project.name}-market-refresh-reproduced.json`,
      )
    ).text,
  );
  expect(reproduced.scientific).toEqual(after.scientific);
  expect(reproduced.aggregate).toEqual(after.aggregate);
  await record(`${info.project.name}-market-refresh-snapshots.json`, {
    status: 'PASS',
    method:
      'Controlled provider-revision package; production workers and file exports; original and pinned CSV byte identity, package/config reload reproduces scientific inputs and aggregates',
    original_hash: before.scientific.reference_hashes.market_data,
    updated_hash: updated.sha256,
    reproduced: reproduced.scientific,
  });
});

test('M03 M10: failed, malformed and canceled refreshes preserve data and the editable configuration', async ({
  page,
}, info) => {
  await page.goto('/retire/');
  await page
    .getByRole('button', { name: 'Load sample config', exact: false })
    .click();
  const initial = (
      await saveDownload(
        page,
        'Download current config',
        `${info.project.name}-market-refresh-failure-before.toml`,
      )
    ).text,
    originalData = (
      await saveDownload(
        page,
        'Download market data',
        `${info.project.name}-market-refresh-failure-before.json`,
      )
    ).text;
  let mode: 'failed' | 'malformed' | 'held' = 'failed',
    release = () => {};
  await page.route('**/api/market-data', async (route) => {
    if (mode === 'failed') {
      await route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'FRED unavailable' }),
      });
      return;
    }
    if (mode === 'malformed') {
      const changed = JSON.parse(originalData);
      changed.income_yields.us_bonds.value = 0.02;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(changed),
      });
      return;
    }
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    try {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: originalData,
      });
    } catch {}
  });
  await page
    .getByRole('button', { name: 'Refresh market data', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText('FRED unavailable');
  mode = 'malformed';
  await page
    .getByRole('button', { name: 'Refresh market data', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText('SHA-256');
  mode = 'held';
  const requested = page.waitForRequest('**/api/market-data');
  await page
    .getByRole('button', { name: 'Refresh market data', exact: true })
    .click();
  await requested;
  await page
    .getByRole('button', { name: 'Cancel refresh', exact: true })
    .click();
  release();
  await expect(page.getByTestId('market-refresh-status')).toContainText(
    'Refresh canceled',
  );
  await expect(
    page.getByRole('button', { name: 'Refresh market data', exact: true }),
  ).toBeEnabled();
  expect(
    (
      await saveDownload(
        page,
        'Download current config',
        `${info.project.name}-market-refresh-failure-after.toml`,
      )
    ).text,
  ).toBe(initial);
  expect(
    (
      await saveDownload(
        page,
        'Download market data',
        `${info.project.name}-market-refresh-failure-after.json`,
      )
    ).text,
  ).toBe(originalData);
  await record(`${info.project.name}-market-refresh-errors.json`, {
    status: 'PASS',
    mount: '/retire/',
    cases: [
      'HTTP 502',
      'mismatched package hash',
      'explicit cancellation before response',
    ],
    configuration_and_data_unchanged: true,
  });
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
  d.accounts = [
    { ...d.accounts![0], balance: 0 },
    {
      name: 'cny',
      type: 'cash_cny',
      owner: 'joint',
      share_A: 0.5,
      balance: 500000,
    },
  ];

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
    250000, 250000, 250000, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ]);
  await page.getByRole('button', { name: 'Year ledger', exact: true }).click();
  await expect(page.getByTestId('ledger-ready')).toContainText(
    '2 active years',
  );
  await expect(page.getByTestId('path-stop')).toContainText('Stopped in 2027');
  await expect(
    page
      .getByRole('table', { name: 'Year ledger', exact: true })
      .locator('tbody tr'),
  ).toHaveCount(2);
  const csv = (
    await saveDownload(
      page,
      'Download ledger CSV',
      `${info.project.name}-net-asset-stop.csv`,
    )
  ).text;
  expect(
    csv.split('\n').filter((row) => row && !row.startsWith('#')),
  ).toHaveLength(3);
  expect(csv).toContain('# active_years=2');
  d.accounts![1].balance = 0;
  await uploadDraft(page, d);
  await complete(page, 1);
  await page.getByRole('button', { name: 'Year ledger', exact: true }).click();
  await expect(page.getByTestId('ledger-ready')).toContainText(
    '0 active years',
  );
  await expect(page.getByTestId('path-stop')).toContainText(
    'before the first year',
  );
  await expect(
    page.getByRole('button', { name: 'Last active year', exact: true }),
  ).toBeDisabled();
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
      'Actual production worker; zero-interest Cash CNY runs out after two fully funded years; zero initial net assets have zero annual rows with no Social Security benefits',
    planned_horizon: 4,
    first_active_years: 2,
    zero_start_active_years: 0,
    csv_only_simulated_years: true,
    whole_cohort_zero_padding: true,
  });
});
