import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { parseScenario, exportScenario } from '../../src/config/config';
import {
  createExampleDraft,
  createControlDraft,
  createHouseholdDraft,
} from '../../src/config/constructors';
import { hashObject } from '../../src/model/canonical';
import { LEDGER_FIELDS, LI } from '../../src/model/layout';
import { saveDownload, complete, record } from './helpers';
test('M03 M04 M10: production worker and ledger use observed NYU/FRED returns', async ({
  page,
}, info) => {
  const d = createControlDraft();
  d.simulation = { ...d.simulation, max_age: 70, n_paths: 1, seed: 42 };
  for (const id of ['A', 'B'] as const) d.people![id]!.birth_year = 1956;
  Object.assign(d.market!, {
    home_cpi_mean: 0,
    home_cpi_start: 0,
    home_cpi_sigma: 0,
    home_cpi_phi: 0,
    fx_spot: 1,
    fx_fair_value: 1,
    fx_sigma: 0,
    fx_drift: 0,
    fx_spread: 0,
    income_yield_us_stocks: 0,
    income_yield_us_bonds: 0,
  });
  d.budget = { annual: 10000, included_health: 0 };
  d.accounts = [
    { ...d.accounts![0], balance: 0 },
    {
      name: 'after_tax',
      type: 'after_tax',
      balance: 100000,
      allocation: { us_stocks: 0.4, us_bonds: 0.6, usd_cash: 0 },
    },
    { ...d.accounts![2], balance: 0 },
  ];
  await page.goto('/');
  await expect(page.locator('.market-data')).toContainText(
    'NYU/FRED historical US market data',
  );
  await page.getByLabel('Upload configuration file').setInputFiles({
    name: 'historical-data-control.toml',
    mimeType: 'text/plain',
    buffer: Buffer.from(exportScenario(d)),
  });
  await complete(page, 1);
  const manifest = JSON.parse(
    (
      await saveDownload(
        page,
        'Download run manifest',
        `${info.project.name}-historical-data-manifest.json`,
      )
    ).text,
  );
  expect(manifest.scientific.reference_versions.history).toBe(
    'nyu-fred-1928-2025-v1',
  );
  expect(manifest.scientific.reference_hashes.history).toBe(
    '21662bee599ee61635a30fd81c3467a8c08bee6b7ff4a4d537e7a7f1327a1c1f',
  );
  await page.getByRole('button', { name: 'Assumptions', exact: true }).click();
  await expect(
    page.getByText('The model does not impose a 3% planning return.', {
      exact: false,
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Year ledger', exact: true }).click();
  await expect(page.getByTestId('ledger-ready')).toContainText(
    '1 active years',
  );
  // Frozen M00 seed vector starts the bootstrap at row floor((2406593643+.5)/2^32*98)=54, year 1982.
  const receipt = JSON.parse(
    readFileSync(
      resolve(
        'verification/sources/nyu-historical-returns-1928-2025/independent-acceptance.json',
      ),
      'utf8',
    ),
  );
  const source = receipt.independent_rows.find(
      (r: { year: number }) => r.year === 1982,
    ),
    expectedReturn = 0.4 * source.us_stocks + 0.6 * source.us_bonds;
  const text = (
    await saveDownload(
      page,
      'Download ledger CSV',
      `${info.project.name}-historical-data-ledger.csv`,
    )
  ).text;
  const rows = text
      .split('\n')
      .filter((l) => l && !l.startsWith('#'))
      .map((l) => l.split(',')),
    header = rows[0],
    data = rows[1];
  const annualReturn = Number(data[header.indexOf('annual_investment_return')]),
    ending = Number(data[header.indexOf('liquid_usd')]);
  expect(annualReturn).toBeCloseTo(expectedReturn, 12);
  expect(ending).toBeCloseTo(90000 * (1 + expectedReturn), 8);
  await record(`${info.project.name}-historical-data-worker.json`, {
    status: 'PASS',
    method:
      'Actual production worker / qualified Roth / first-year source fixed by independent M00 RNG vector; returns checked against independent BIFF reader; Float64 ledger CSV',
    source_year: 1982,
    source,
    expected_return: expectedReturn,
    actual_return: annualReturn,
    ending_usd: ending,
    manifest,
  });
});
test('M02 M08 M10: all configs share calculations and legacy kinds are rejected', async ({
  page,
}, info) => {
  const draft = createExampleDraft();
  draft.simulation!.n_paths = 16;
  const text = exportScenario(draft),
    rejected: string[] = [];
  await page.goto('/');
  for (const label of ['example', 'control', 'household']) {
    const localText = text.replace(
      '[simulation]',
      `[simulation]\nkind = "${label}"\nassumptions = ["Old free-text note"]\nunresolved_inputs = ["Old checklist entry"]\nlegal_rules_verified = true\nverification_note = "Old verification text"`,
    );
    await page.getByLabel('Upload configuration file').setInputFiles({
      name: 'legacy-local.toml',
      mimeType: 'text/plain',
      buffer: Buffer.from(localText),
    });
    await expect(page.getByText('Import could not be applied')).toBeVisible();
    await expect(page.getByText('simulation.kind').first()).toBeVisible();
    rejected.push(label);
  }
  await page.getByLabel('Upload configuration file').setInputFiles({
    name: 'current.toml',
    mimeType: 'text/plain',
    buffer: Buffer.from(text),
  });
  await page
    .getByRole('button', { name: 'Configuration', exact: true })
    .click();
  await expect(page.getByLabel('simulation.kind', { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByLabel('simulation.assumptions', { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Run simulation', exact: false }),
  ).toBeEnabled();
  const config = await saveDownload(
    page,
    'Download current config',
    `${info.project.name}-unified-current.toml`,
  );
  expect(config.text).not.toMatch(
    /^(kind|assumptions|unresolved_inputs|legal_rules_verified|verification_note)\s*=/m,
  );
  await complete(page, 16);
  const manifest = JSON.parse(
    (
      await saveDownload(
        page,
        'Download run manifest',
        `${info.project.name}-unified-current.json`,
      )
    ).text,
  );
  expect(manifest.scientific).not.toHaveProperty('scenario_kind');
  expect(manifest.scientific).not.toHaveProperty('assumptions');
  await record(`${info.project.name}-unified-configurations.json`, {
    status: 'PASS',
    paths: 16,
    rejected_legacy_kinds: rejected,
    comparison:
      'Legacy kind tags are rejected as unknown keys; the current config runs with no kind metadata.',
  });
});
test('M02 M09 M10: sample builder → worker run → ledger/export → reload/upload reproduces immutable results', async ({
  page,
}, info) => {
  const errors: string[] = [],
    requests: { url: string; method: string; body: string | null }[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) =>
    requests.push({ url: r.url(), method: r.method(), body: r.postData() }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Load sample config' }).click();
  await expect(
    page.getByRole('button', { name: 'Run simulation', exact: false }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Properties', exact: true }).click();
  await page
    .getByLabel('properties[0].id', { exact: true })
    .fill('Test-only local note 南京 🏡');
  const draft = await saveDownload(
    page,
    'Download current config',
    `${info.project.name}-sample-draft.toml`,
  );
  expect(draft.text).toContain('Test-only local note 南京 🏡');
  await complete(page, 200);
  await expect(
    page.getByRole('img', { name: 'Household wealth percentile chart' }),
  ).toBeVisible();
  const first = await saveDownload(
      page,
      'Download run manifest',
      `${info.project.name}-sample-manifest.json`,
    ),
    a = JSON.parse(first.text);
  expect(a.scientific.n_paths).toBe(200);
  expect(a.scientific.horizon).toBe(70);
  expect(a.aggregate.retained_bytes).toBe(423800);
  expect(a.aggregate.success_probability).toBeGreaterThanOrEqual(0);
  const config = await saveDownload(
    page,
    'Download run config',
    `${info.project.name}-sample-run.toml`,
  );
  const parsed = parseScenario(config.text);
  expect(parsed.ok).toBe(true);
  if (parsed.ok)
    expect(hashObject(parsed.value)).toBe(a.scientific.scenario_sha256);
  await page.getByRole('button', { name: 'Year ledger', exact: true }).click();
  await page.getByLabel('Replay path ID').fill('17');
  await expect(page.getByTestId('ledger-ready')).toContainText('Path 17');
  const csv = await saveDownload(
    page,
    'Download ledger CSV',
    `${info.project.name}-sample-path17.csv`,
  );
  expect(csv.text).toContain('# path_id=17');
  expect(csv.text).toContain('net_worth_cny_real');
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Load sample config' }),
  ).toBeVisible();
  await page.getByLabel('Upload configuration file').setInputFiles(config.path);
  await complete(page, 200);
  const second = await saveDownload(
      page,
      'Download run manifest',
      `${info.project.name}-sample-reimport.json`,
    ),
    b = JSON.parse(second.text);
  expect(b.scientific).toEqual(a.scientific);
  expect(b.aggregate).toEqual(a.aggregate);
  expect(errors).toEqual([]);
  expect(requests.every((r) => r.method === 'GET' && r.body === null)).toBe(
    true,
  );
  expect(
    requests.every(
      (r) =>
        r.url.startsWith('http://127.0.0.1:4173/') || r.url.startsWith('blob:'),
    ),
  ).toBe(true);
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
    })),
  ).toEqual({ local: 0, session: 0 });
  await page.screenshot({
    path: resolve(`verification/records/e2e/${info.project.name}-results.png`),
    fullPage: true,
  });
});
test('M08: a 50-year planning config uses historical returns and integer money display', async ({
  page,
}, info) => {
  await page.goto('/');
  await page
    .getByLabel('Upload configuration file')
    .setInputFiles(resolve('verification/fixtures/control-pv.toml'));
  await complete(page, 1);
  const manifest = JSON.parse(
    (
      await saveDownload(
        page,
        'Download run manifest',
        `${info.project.name}-control-manifest.json`,
      )
    ).text,
  );
  expect(manifest.scientific.horizon).toBe(50);
  await page.getByRole('button', { name: 'Year ledger', exact: true }).click();
  await expect(page.getByTestId('ledger-ready')).toContainText(
    '50 active years',
  );
  for (const label of [
    'Starting liquid USD',
    'Starting net worth CNY',
    'Spend CNY (excluding medical)',
    'Medical CNY',
    'Overall annual investment return',
  ])
    await expect(
      page.getByRole('columnheader', { name: label, exact: true }),
    ).toBeVisible();
  const firstRow = page
    .getByRole('table', { name: 'Year ledger', exact: true })
    .locator('tbody tr')
    .first();
  await expect(
    firstRow.locator('[data-field=spend_excluding_medical_cny]'),
  ).toHaveText('212,000');
  await expect(firstRow.locator('[data-field=medical_total_cny]')).toHaveText(
    '38,000',
  );
  await expect(
    firstRow.locator('[data-field=annual_investment_return]'),
  ).toHaveText('11.09%');
  await expect(firstRow.locator('[data-field=starting_liquid_usd]')).toHaveText(
    '2,390,573',
  );
  await expect(firstRow.locator('[data-field=fx]')).toHaveText('6.69');
  await page.getByRole('button', { name: 'Last active year' }).click();
  await expect(page.getByTestId('year-provenance')).toContainText(
    '"after_tax_assets_cny"',
  );
  const csv = (
      await saveDownload(
        page,
        'Download ledger CSV',
        `${info.project.name}-control.csv`,
      )
    ).text
      .split('\n')
      .filter((l) => l && !l.startsWith('#')),
    headers = csv[0].split(','),
    rows = csv.slice(1).map((l) => l.split(','));
  expect(headers).toHaveLength(42);
  expect(headers).not.toContain('firpta_withheld_usd');
  expect(rows).toHaveLength(50);
  expect(Number(rows[0][headers.indexOf('withdraw_usd')])).toBeCloseTo(
    37369.20777279521,
    8,
  );
  expect(Number(rows[0][headers.indexOf('starting_liquid_usd')])).toBe(
    2390572.9770677146,
  );
  expect(
    Number(rows[0][headers.indexOf('starting_net_worth_cny')]),
  ).toBeCloseTo(2390572.9770677146 * 6.69, 8);
  expect(
    Number(rows[0][headers.indexOf('spend_excluding_medical_cny')]),
  ).toBeCloseTo(212000, 6);
  expect(Number(rows[0][headers.indexOf('medical_total_cny')])).toBeCloseTo(
    38000,
    6,
  );
  expect(
    Number(rows[0][headers.indexOf('annual_investment_return')]),
  ).toBeCloseTo(0.1109, 12);
  expect(Number(rows[1][headers.indexOf('starting_liquid_usd')])).toBe(
    Number(rows[0][headers.indexOf('liquid_usd')]),
  );
  expect(Number(rows[49][headers.indexOf('age_A')])).toBe(89);
  expect(Number.isFinite(Number(rows[49][headers.indexOf('liquid_usd')]))).toBe(
    true,
  );
  expect(rows.at(-1)?.[headers.indexOf('age_B')]).toBe('89');
});
test('M02 M06: invalid upload preserves draft and actual missing inputs block any configuration', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Load sample config' }).click();
  await page.getByRole('button', { name: 'Assumptions', exact: true }).click();
  const hash = await page.getByTestId('draft-hash').textContent();
  await page.getByLabel('Upload configuration file').setInputFiles({
    name: 'bad.toml',
    mimeType: 'text/plain',
    buffer: Buffer.from('schema_version=1\n[market]\nunknown=3'),
  });
  await expect(page.getByRole('alert')).toContainText(
    'Unknown configuration key',
  );
  expect(await page.getByTestId('draft-hash').textContent()).toBe(hash);
  await page
    .getByRole('button', { name: 'Configuration', exact: true })
    .click();
  await page.getByLabel('simulation.start_year', { exact: true }).fill('');
  await expect(
    page.getByRole('button', { name: 'Run simulation', exact: false }),
  ).toBeDisabled();
  await page.reload();
  await page.getByLabel('Upload configuration file').setInputFiles({
    name: 'household.toml',
    mimeType: 'text/plain',
    buffer: Buffer.from(exportScenario(createHouseholdDraft())),
  });
  await expect(
    page.getByRole('button', { name: 'Run simulation', exact: false }),
  ).toBeDisabled();
  await expect(page.getByText('Validation and open gates')).toBeVisible();
  await expect(page.locator('.validation')).toContainText(
    'Resolve income residency',
  );
  await expect(page.locator('.validation')).toContainText(
    'Brokerage basis is required',
  );
  await expect(page.getByLabel('simulation.kind', { exact: true })).toHaveCount(
    0,
  );
  await expect(page.locator('.validation')).not.toContainText(
    'Primary legal sources are unverified',
  );
});
test('M06 M08: shipped example and a property-sale/securities-loss case complete and export', async ({
  page,
}, info) => {
  await page.goto('/');
  await page
    .getByLabel('Upload configuration file')
    .setInputFiles(resolve('examples/sample.toml'));
  await complete(page, 200);
  const d = createExampleDraft();
  d.simulation!.n_paths = 16;
  d.simulation!.max_age = 62;
  d.properties![0].strategy = 'sell_year';
  d.properties![0].sell_year = 2027;
  d.one_time = [
    {
      name: 'loss_realization_regression',
      year: 2027,
      amount: 100000,
      currency: 'USD',
    },
  ];
  await page.getByLabel('Upload configuration file').setInputFiles({
    name: 'property-gain-regression.toml',
    mimeType: 'text/plain',
    buffer: Buffer.from(exportScenario(d)),
  });
  await complete(page, 16);
  await page.getByRole('button', { name: 'Year ledger', exact: true }).click();
  await page.getByLabel('Replay path ID').fill('0');
  await expect(page.getByTestId('ledger-ready')).toContainText('Path 0');
  const first = JSON.parse(
    (await page.getByTestId('year-provenance').textContent())!,
  );
  expect(first.income.A.cap_gain).toBeCloseTo(4591.749007397338, 6);
  expect(first.income.A.ltcg_property).toBe(198000);
  expect(first.tax_detail.A.lt_gain).toBeCloseTo(202591.74900739733, 6);
  expect(first.tax_detail.A.carry).toBe(0);
  const csv = await saveDownload(
    page,
    'Download ledger CSV',
    `${info.project.name}-property-gain-regression.csv`,
  );
  expect(csv.text).toContain('tax_us_A');
  await record(`${info.project.name}-property-gain-regression.json`, {
    status: 'PASS',
    shipped_example_paths: 200,
    forced_sale_and_loss_paths: 16,
    first_year: first.income.A,
    first_year_tax: first.tax_detail.A,
  });
});
test('M02 M08 M10: fixed younger-age horizon, removed Social Security inputs and integer ledger money', async ({
  page,
}, info) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Load sample config' }).click();
  await expect(
    page.getByRole('button', { name: 'Recurring spending', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Spending flexibility', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Social Security', exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Markets, inflation & FX', exact: true })
    .click();
  for (const [group, paths] of [
    [
      'Markets',
      [
        'market.sample_start',
        'market.sample_end',
        'market.block_mean_years',
        'market.income_yield_us_stocks',
        'market.income_yield_us_bonds',
      ],
    ],
    [
      'Inflation',
      [
        'market.home_cpi_mean',
        'market.home_cpi_phi',
        'market.home_cpi_sigma',
        'market.home_cpi_start',
        'market.medical_excess_inflation',
      ],
    ],
    [
      'FX',
      [
        'market.fx_spot',
        'market.fx_fair_value',
        'market.fx_adjust_speed',
        'market.fx_sigma',
        'market.fx_real_trend',
        'market.fx_mode',
        'market.fx_drift',
        'market.fx_spread',
        'market.fx_quota_usd_per_person',
      ],
    ],
  ] as const) {
    const section = page.getByRole('region', { name: group, exact: true });
    await expect(
      section.getByRole('heading', { name: group, exact: true }),
    ).toBeVisible();
    for (const path of paths) {
      await expect(section.getByLabel(path, { exact: true })).toBeVisible();
      await expect(page.getByLabel(path, { exact: true })).toHaveCount(1);
    }
  }
  await expect(
    page
      .getByRole('region', { name: 'FX', exact: true })
      .getByRole('button', { name: 'Add market.fx_stress', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'People', exact: true }).click();
  await expect(page.getByLabel('people.domicile', { exact: true })).toHaveValue(
    'China',
  );
  expect(
    await page
      .getByLabel('people.domicile', { exact: true })
      .locator('option')
      .evaluateAll((els) => els.map((e) => (e as HTMLOptionElement).value)),
  ).toEqual(['', 'US', 'China']);
  await expect(
    page.getByRole('button', { name: 'Two people', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  for (const id of ['A', 'B']) {
    await expect(
      page.getByLabel(`people.${id}.birth_year`, { exact: true }),
    ).toHaveValue('1986');
    await expect(
      page.getByLabel(`people.${id}.sex`, { exact: true }),
    ).toHaveValue(id === 'A' ? 'F' : 'M');
    await expect(
      page.getByLabel(`people.${id}.domicile`, { exact: true }),
    ).toHaveCount(0);
    if (id === 'A')
      await expect(
        page.getByLabel(`people.${id}.us_citizen`, { exact: true }),
      ).toBeChecked();
    else
      await expect(
        page.getByLabel(`people.${id}.us_citizen`, { exact: true }),
      ).not.toBeChecked();
    for (const key of [
      'gompertz_mode',
      'gompertz_dispersion',
      'death_age',
      'ss_survivor_monthly_usd',
    ])
      await expect(
        page.getByLabel(`people.${id}.${key}`, { exact: true }),
      ).toHaveCount(0);
    await expect(
      page.getByLabel(`people.${id}.medical_base_cny`, { exact: true }),
    ).toHaveCount(0);
    for (const key of ['ss_monthly_usd', 'ss_claim_age', 'ss_payable_abroad'])
      await expect(
        page.getByLabel(`people.${id}.${key}`, { exact: true }),
      ).toHaveCount(0);
  }
  await page.getByLabel('people.A.birth_year', { exact: true }).fill('1966');
  await page.getByLabel('people.B.birth_year', { exact: true }).fill('1968');
  await page.getByRole('button', { name: 'Budget', exact: true }).click();
  await page
    .getByLabel('medical.late_life_care.enabled', { exact: true })
    .check();
  await page
    .getByLabel('medical.late_life_care.start_age', { exact: true })
    .fill('63');
  await page
    .getByLabel('medical.late_life_care.monthly', { exact: true })
    .fill('1000');
  await expect(
    page.getByLabel('medical.late_life_care.end_age', { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByLabel('medical.late_life_care.budget_scope', { exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Simulation', exact: true }).click();
  await page.getByLabel('simulation.max_age', { exact: true }).fill('62');
  await page.getByLabel('simulation.n_paths', { exact: true }).fill('16');
  const exported = await saveDownload(
      page,
      'Download current config',
      `${info.project.name}-fixed-horizon.toml`,
    ),
    parsed = parseScenario(exported.text);
  expect(parsed.ok).toBe(true);
  if (parsed.ok) {
    expect(parsed.value).not.toHaveProperty('social_security');
    expect(parsed.value.people!.A!).not.toHaveProperty('ss_monthly_usd');
  }
  expect(exported.text).not.toMatch(
    /^\[(spending_rule|spending|social_security)\]/m,
  );
  if (parsed.ok) {
    expect(parsed.value.medical!.late_life_care!.start_age).toBe(63);
    expect(parsed.value.medical!.late_life_care!.monthly).toBe(1000);
    expect(parsed.value.medical!.late_life_care).not.toHaveProperty('end_age');
    expect(parsed.value.medical!.late_life_care).not.toHaveProperty(
      'budget_scope',
    );
  }
  await complete(page, 16);
  await page.getByRole('button', { name: 'Year ledger', exact: true }).click();
  await page.getByLabel('Replay path ID').fill('0');
  await expect(page.getByTestId('ledger-ready')).toContainText(
    '4 active years',
  );
  await page.getByLabel('All 42 columns', { exact: true }).check();
  const rows = page
    .getByRole('table', { name: 'Year ledger', exact: true })
    .locator('tbody tr');
  await expect(rows).toHaveCount(4);
  for (let t = 0; t < 4; t++) {
    for (const key of [
      'starting_liquid_usd',
      'starting_net_worth_cny',
      'spend_excluding_medical_cny',
      'medical_total_cny',
      'tax_us_A',
      'tax_cn_A',
      'liquid_usd',
      'net_worth_cny_real',
    ])
      await expect(rows.nth(t).locator(`[data-field=${key}]`)).toHaveText(
        /^-?\d{1,3}(,\d{3})*$/,
      );
    for (const key of ['alive_A', 'alive_B'])
      await expect(rows.nth(t).locator(`[data-field=${key}]`)).toHaveText('1');
    await expect(rows.nth(t).locator('[data-field=estate_tax]')).toHaveCount(0);
    await expect(rows.nth(t).locator('[data-field=ss_usd]')).toHaveCount(0);
  }
  await expect(rows.last().locator('[data-field=age_A]')).toHaveText('64');
  await expect(rows.last().locator('[data-field=age_B]')).toHaveText('62');
  const provenance = JSON.parse(
    (
      await saveDownload(
        page,
        'Download path provenance',
        `${info.project.name}-fixed-horizon-provenance.json`,
      )
    ).text,
  );
  for (let t = 0; t < 4; t++) {
    const detail = provenance.replay.years[t].medical_detail,
      amount = detail.late_life_care_cny;
    if (t < 2) expect(amount).toBe(0);
    else expect(amount).toBeGreaterThan(0);
    const value = (field: keyof typeof LI) =>
      provenance.replay.ledger[t * LEDGER_FIELDS.length + LI[field]];
    expect(value('additional_consumption_cny')).toBeCloseTo(
      detail.shock_cny + amount,
      6,
    );
    expect(value('included_consumption_cny')).toBeCloseTo(
      value('spend_cny') + detail.base_cny,
      6,
    );
    expect(value('medical_cny')).toBeCloseTo(
      detail.base_cny + detail.shock_cny + amount,
      6,
    );
  }
  await page.getByRole('button', { name: 'Results', exact: true }).click();
  const manifest = JSON.parse(
    (
      await saveDownload(
        page,
        'Download run manifest',
        `${info.project.name}-fixed-horizon-manifest.json`,
      )
    ).text,
  );
  expect(manifest.scientific.horizon).toBe(4);
  expect(manifest.scientific.longevity_policy).toBe(
    'both-alive-to-younger-max-age',
  );
  await record(`${info.project.name}-fixed-horizon.json`, {
    status: 'PASS',
    paths: 16,
    years: 4,
    final_ages: { A: 64, B: 62 },
    both_alive_every_year: true,
    example_people: {
      domicile: 'China',
      A: { birth_year: 1986, sex: 'F', us_citizen: true },
      B: { birth_year: 1986, sex: 'M', us_citizen: false },
    },
    market_groups: ['Markets', 'Inflation', 'FX'],
    disabled_ss_fields_hidden: true,
    personal_ss_inputs_preserved: true,
    single_budget_medical_base: true,
    recurring_spending_removed: true,
    care_start_age: 63,
    care_runs_through_horizon: true,
    care_budget_treatment: 'always additional',
    money_display: 'integer',
    csv_precision: 'Float64',
  });
});
test('M02 M10: household size toggles the second person and keeps one domicile', async ({
  page,
}, info) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Load sample config' }).click();
  await page.getByRole('button', { name: 'People', exact: true }).click();
  await expect(
    page.getByLabel('people.B.birth_year', { exact: true }),
  ).toHaveValue('1986');
  await page.getByRole('button', { name: 'One person', exact: true }).click();
  await expect(
    page.getByLabel('people.B.birth_year', { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel('people.domicile', { exact: true })).toHaveValue(
    'China',
  );
  const exported = await saveDownload(
      page,
      'Download current config',
      `${info.project.name}-single-person.toml`,
    ),
    parsed = parseScenario(exported.text);
  expect(parsed.ok).toBe(true);
  if (parsed.ok) {
    expect(parsed.value.people).not.toHaveProperty('B');
    expect(parsed.value.people!.domicile).toBe('China');
  }
  await page.getByRole('button', { name: 'Two people', exact: true }).click();
  await expect(
    page.getByLabel('people.B.birth_year', { exact: true }),
  ).toHaveValue('');
  await record(`${info.project.name}-household-size.json`, {
    status: 'PASS',
    single_hides_B: true,
    export_omits_B: true,
    domicile_kept: true,
  });
});
test('M02 M10: decimal rate typing survives edits, export and a run', async ({
  page,
}, info) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Load sample config' }).click();
  await page.getByLabel('simulation.n_paths', { exact: true }).fill('16');
  await page.getByRole('button', { name: 'People', exact: true }).click();
  for (const id of ['A', 'B'])
    for (const key of ['ss_monthly_usd', 'ss_claim_age', 'ss_payable_abroad'])
      await expect(
        page.getByLabel(`people.${id}.${key}`, { exact: true }),
      ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Markets, inflation & FX', exact: true })
    .click();
  const keys = ['income_yield_us_stocks', 'income_yield_us_bonds'] as const;
  for (const key of ['cny_cash_real_rate', 'cny_cash_floor'])
    await expect(page.getByLabel(`market.${key}`, { exact: true })).toHaveCount(
      0,
    );
  await expect(page.getByTestId('cny-cash-interest-note')).toHaveCount(0);
  for (const key of keys) {
    const field = page.getByLabel(`market.${key}`, { exact: true });
    await field.fill('');
    await field.pressSequentially('0.003');
    await expect(field).toHaveValue('0.003');
  }
  const signed = page.getByLabel('market.fx_drift', { exact: true });
  await signed.fill('');
  await signed.pressSequentially('-');
  await expect(
    page.getByRole('button', { name: 'Run simulation', exact: false }),
  ).toBeDisabled();
  await signed.pressSequentially('0.003');
  await expect(signed).toHaveValue('-0.003');
  await signed.fill('0');
  const saved = await saveDownload(
      page,
      'Download current config',
      `${info.project.name}-decimal-rates.toml`,
    ),
    parsed = parseScenario(saved.text);
  expect(parsed.ok).toBe(true);
  expect(saved.text).not.toMatch(/cny_cash_real_rate|cny_cash_floor/);
  if (parsed.ok)
    for (const key of keys) expect(parsed.value.market![key]).toBe(0.003);
  await page.getByRole('button', { name: 'Budget', exact: true }).click();
  await page
    .getByRole('button', { name: 'Markets, inflation & FX', exact: true })
    .click();
  for (const key of keys)
    await expect(page.getByLabel(`market.${key}`, { exact: true })).toHaveValue(
      '0.003',
    );
  await complete(page, 16);
  const run = await saveDownload(
      page,
      'Download run config',
      `${info.project.name}-decimal-rates-run.toml`,
    ),
    runParsed = parseScenario(run.text);
  expect(runParsed.ok).toBe(true);
  if (runParsed.ok)
    for (const key of keys) expect(runParsed.value.market![key]).toBe(0.003);
  await page
    .getByLabel('Upload configuration file')
    .setInputFiles(resolve('examples/control-50year.toml'));
  await page
    .getByRole('button', { name: 'Markets, inflation & FX', exact: true })
    .click();
  await expect(page.getByLabel('market.fx_drift', { exact: true })).toHaveValue(
    '0',
  );
  await record(`${info.project.name}-decimal-rates.json`, {
    status: 'PASS',
    typed_sequentially: '0.003',
    paths: 16,
    fields: keys,
    negative_decimal_accepted: true,
    incomplete_number_blocks_run: true,
    export_and_run_precision: 'Float64',
    external_config_updates_input: true,
    social_security_removed: true,
    cny_cash_interest: 'intentionally omitted',
    cny_cash_inputs_removed: true,
  });
});
test('M09 M11: cancel/discard, restart and fresh offline computation with local upload/replay', async ({
  page,
  context,
}, info) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Load sample config' }).click();
  await page.getByLabel('simulation.n_paths', { exact: true }).fill('20000');
  await page
    .getByRole('button', { name: 'Run simulation', exact: false })
    .click();
  await page.getByRole('button', { name: 'Cancel run', exact: true }).click();
  await expect(page.getByTestId('run-status')).toContainText('Run canceled');
  await expect(page.getByTestId('success-probability')).toHaveCount(0);
  await page.getByLabel('simulation.n_paths', { exact: true }).fill('32');
  await page.getByLabel('simulation.seed', { exact: true }).fill('43');
  await complete(page, 32);
  const config = await saveDownload(
    page,
    'Download run config',
    `${info.project.name}-offline.toml`,
  );
  await context.setOffline(true);
  await page
    .getByRole('button', { name: 'Configuration', exact: true })
    .click();
  await page.getByRole('button', { name: 'Simulation', exact: true }).click();
  await page.getByLabel('simulation.seed', { exact: true }).fill('44');
  await complete(page, 32);
  await page.getByRole('button', { name: 'Year ledger', exact: true }).click();
  await expect(page.getByTestId('ledger-ready')).toBeVisible();
  await page.getByLabel('Upload configuration file').setInputFiles(config.path);
  await page.getByRole('button', { name: 'Simulation', exact: true }).click();
  await page.getByLabel('simulation.seed', { exact: true }).fill('45');
  await complete(page, 32);
  await saveDownload(
    page,
    'Download run manifest',
    `${info.project.name}-offline-manifest.json`,
  );
  await context.setOffline(false);
});

test('M02 M10: random seed button covers both range endpoints and preserves completed inputs', async ({
  page,
}, info) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Load sample config' }).click();
  const restore = await page.evaluateHandle(() => {
    const native = crypto.getRandomValues.bind(crypto),
      endpoints = [0, 4294967295];
    Object.defineProperty(crypto, 'getRandomValues', {
      configurable: true,
      value: (array: ArrayBufferView) => {
        if (
          array instanceof Uint32Array &&
          array.length === 1 &&
          endpoints.length
        ) {
          array[0] = endpoints.shift()!;
          return array;
        }
        return native(array);
      },
    });
    return () => {
      Object.defineProperty(crypto, 'getRandomValues', {
        configurable: true,
        value: native,
      });
    };
  });
  await page
    .getByRole('button', {
      name: 'Generate random simulation seed',
      exact: true,
    })
    .click();
  await expect(page.getByLabel('simulation.seed', { exact: true })).toHaveValue(
    '0',
  );
  await page
    .getByRole('button', {
      name: 'Generate random simulation seed',
      exact: true,
    })
    .click();
  await expect(page.getByLabel('simulation.seed', { exact: true })).toHaveValue(
    '4294967295',
  );
  await restore.evaluate((fn) => fn());
  await restore.dispose();
  await page.getByLabel('simulation.n_paths', { exact: true }).fill('16');
  await complete(page, 16);
  const before = JSON.parse(
    (
      await saveDownload(
        page,
        'Download run manifest',
        `${info.project.name}-seed-max-manifest.json`,
      )
    ).text,
  );
  expect(before.scientific.seed).toBe(4294967295);
  await page
    .getByRole('button', { name: 'Configuration', exact: true })
    .click();
  await page
    .getByRole('button', {
      name: 'Generate random simulation seed',
      exact: true,
    })
    .click();
  const seed = Number(
    await page.getByLabel('simulation.seed', { exact: true }).inputValue(),
  );
  expect(Number.isInteger(seed)).toBe(true);
  expect(seed).toBeGreaterThanOrEqual(0);
  expect(seed).toBeLessThanOrEqual(4294967295);
  const current = await saveDownload(
      page,
      'Download current config',
      `${info.project.name}-random-seed.toml`,
    ),
    parsed = parseScenario(current.text);
  expect(parsed.ok && parsed.value.simulation?.seed).toBe(seed);
  await page.getByRole('button', { name: 'Results', exact: true }).click();
  const after = JSON.parse(
    (
      await saveDownload(
        page,
        'Download run manifest',
        `${info.project.name}-seed-immutable-manifest.json`,
      )
    ).text,
  );
  expect(after.scientific).toEqual(before.scientific);
  await page
    .getByRole('button', { name: 'Configuration', exact: true })
    .click();
  await page.setViewportSize({ width: 375, height: 812 });
  const input = await page
      .getByLabel('simulation.seed', { exact: true })
      .boundingBox(),
    button = await page
      .getByRole('button', {
        name: 'Generate random simulation seed',
        exact: true,
      })
      .boundingBox();
  expect(input && button).toBeTruthy();
  if (input && button) {
    expect(button.x).toBeGreaterThanOrEqual(input.x + input.width - 1);
    expect(
      Math.abs(input.y + input.height / 2 - (button.y + button.height / 2)),
    ).toBeLessThan(5);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await record(`${info.project.name}-random-seed.json`, {
    status: 'PASS',
    range: [0, 4294967295],
    tested_endpoints: [0, 4294967295],
    native_random_seed: seed,
    completed_seed: before.scientific.seed,
    controls_synchronized: true,
    mobile_width: 375,
  });
});
test('M02 M10: start page stays reachable after loading and preserves the draft', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Load sample config' }).click();
  await page
    .getByRole('button', { name: 'Back to start', exact: true })
    .click();
  await expect(page.getByLabel('Start a configuration')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Start with an example' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Bring your own plan' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Guided setup' }),
  ).toBeVisible();
  const entry = await page.getByLabel('Start a configuration').boundingBox();
  const market = await page.getByLabel('Market data').boundingBox();
  if (!entry || !market) throw new Error('Expected visible start sections');
  expect(entry.y + entry.height).toBeLessThanOrEqual(market.y);
  await page
    .getByRole('button', { name: 'Back to configuration', exact: true })
    .click();
  await expect(page.locator('.workspace-toolbar')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Back to start', exact: true }),
  ).toBeVisible();
});
