import { test, expect } from './fixtures';
import {
  complete,
  record,
  saveDownload,
  uploadDraft,
  saveDraftText,
} from './helpers';
import { createExampleDraft } from '../../src/config/constructors';
import type { DraftScenario } from '../../src/model/types';
import { parseScenario } from '../../src/config/config';
import inventory from '../../verification/config-fields.json' with { type: 'json' };

test('M02 M10: every configuration input has plain-English hover/focus help, including conditional fields and list cells', async ({
  page,
}, info) => {
  const draft = createExampleDraft();
  draft.medical!.late_life_care = {
    enabled: true,
    start_age: 85,
    monthly: 1000,
    real_growth: 0,
  };
  draft.one_time = [
    {
      name: 'move',
      year: 2028,
      amount: 1000,
      currency: 'CNY',
    },
  ];
  // Fixed account identities are not rendered; allocation cells are concise
  // inputs without hover help. The era dropdown is a UI shortcut for the
  // sampling window, not a config field; its help is asserted separately.
  // Tax status is derived from citizenship, sex is retired, property share
  // is derived from household size, the property id is internal, the
  // property label and the one-time name live in their list headers, sale
  // proceeds always land in Non-retirement liquid assets, and the schema
  // version tab is hidden. The one-time currency is a dropdown prefix on
  // the amount input: it maps to its field but has no field of its own,
  // so it skips the hover-help shape checks below.
  const hidden = new Set([
      'accounts[].name',
      'accounts[].type',
      'people.A.sex',
      'people.B.sex',
      'people.A.us_income_tax_status',
      'people.B.us_income_tax_status',
      'one_time[].name',
      'properties[].id',
      'properties[].label',
      'properties[].proceeds_account',
      'properties[].share_A',
      'schema_version',
    ]),
    prefixed = new Set(['one_time[].currency']),
    concise = new Set([
      'accounts[].allocation.us_stocks',
      'accounts[].allocation.us_bonds',
      'accounts[].allocation.usd_cash',
    ]),
    shortcuts = new Set(['market.era']);
  await page.goto('/');
  await uploadDraft(page, draft);
  await expect(
    page.getByRole('button', { name: 'Holding profiles', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Tax treatment', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Tax overrides', exact: true }),
  ).toHaveCount(0);
  const paths = new Set<string>(),
    counts: Record<string, number> = {};
  for (const section of [
    'Simulation',
    'Markets, inflation & FX',
    'People',
    'Budget',
    'Accounts',
    'Properties',
  ]) {
    await page.getByRole('button', { name: section, exact: true }).click();
    await page
      .locator('.builder-section details')
      .evaluateAll((elements) =>
        elements.forEach(
          (element) => ((element as HTMLDetailsElement).open = true),
        ),
      );
    const controls = await page
      .locator(
        '.builder-section input,.builder-section select,.builder-section textarea',
      )
      .evaluateAll((elements) =>
        elements.map((element) => {
          const input = element as HTMLInputElement,
            field = input.closest('[data-config-field]'),
            helpId = input.getAttribute('aria-describedby');
          return {
            path: input.getAttribute('aria-label'),
            description: helpId
              ? document.getElementById(helpId)?.textContent
              : null,
            info: field
              ?.querySelector('button.field-info')
              ?.getAttribute('aria-label'),
            label: field?.querySelector('label')?.getAttribute('for'),
            id: input.id,
          };
        }),
      );
    expect(controls.length).toBeGreaterThan(0);
    counts[section] = controls.length;
    for (const control of controls) {
      expect(control.path).toBeTruthy();
      if (shortcuts.has(control.path!)) {
        expect(control.description).toContain('sampling window');
        continue;
      }
      let path = control.path!.replace(/\[\d+\]/g, '[]');
      if (!inventory.fields.some((f) => f.path === path))
        path = path.replace(/(?:\[\])+$/, '');
      const field = inventory.fields.find((f) => f.path === path);
      expect(field, `Unmapped input ${control.path}`).toBeDefined();
      if (prefixed.has(path)) {
        paths.add(path);
        continue;
      }
      if (!concise.has(path)) {
        expect(control.info).toBe(`About ${control.path}`);
        expect(control.label).toBe(control.id);
        expect(control.description).toContain(field!.description);
      }
      paths.add(path);
    }
  }
  expect([...paths].sort()).toEqual(
    inventory.fields
      .filter((f) => f.type !== 'object[]' && !hidden.has(f.path))
      .map((f) => f.path)
      .sort(),
  );
  await page
    .getByRole('button', { name: 'Markets, inflation & FX', exact: true })
    .click();
  // Advanced FX options start open; the spread help below lives there.
  await expect(
    page.locator('section[aria-labelledby="market-group-fx"] details'),
  ).toHaveJSProperty('open', true);
  const spreadInfo = page.getByRole('button', {
    name: 'About market.fx_spread',
    exact: true,
  });
  await spreadInfo.hover();
  await expect(page.getByRole('tooltip')).toBeVisible();
  await expect(page.getByRole('tooltip')).toContainText('0.003 means 0.3%');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await spreadInfo.focus();
  await expect(page.getByRole('tooltip')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(spreadInfo).toBeFocused();
  await spreadInfo.click();
  await expect(page.getByRole('tooltip')).toBeVisible();
  await page.mouse.move(1, 1);
  await expect(page.getByRole('tooltip')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await page.setViewportSize({ width: 375, height: 640 });
  await spreadInfo.hover();
  const bounds = await page.getByRole('tooltip').boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(11);
  expect(bounds!.y).toBeGreaterThanOrEqual(11);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(364);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(629);
  await page.keyboard.press('Escape');
  await page.getByText('Portable TOML configuration', { exact: true }).click();
  await page
    .getByRole('button', { name: 'About TOML editor', exact: true })
    .focus();
  await expect(page.getByRole('tooltip')).toContainText(
    'Editing this text alone does not change the draft',
  );
  await record(`${info.project.name}-configuration-help.json`, {
    status: 'PASS',
    field_definitions: inventory.fields.length,
    leaf_definitions: paths.size,
    controls_by_section: counts,
    hover: true,
    keyboard_focus_and_escape: true,
    click_to_pin: true,
    mobile_bounds: bounds,
  });
});

test('M02 M10: wheel cannot step focused decimal inputs, including account allocation and property cells', async ({
  page,
}, info) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Load sample config' }).click();
  const checked: string[] = [];
  const check = async (path: string, value: string) => {
    const input = page.getByLabel(path, { exact: true });
    await input.fill(value);
    await input.hover();
    await input.focus();
    await page.mouse.wheel(0, 320);
    await page.mouse.wheel(0, -320);
    await expect(input).toHaveValue(value);
    await expect(input).toBeFocused();
    await input.press('End');
    await input.press('Backspace');
    await input.press(value.at(-1)!);
    await expect(input).toHaveValue(value);
    checked.push(path);
    await page.keyboard.press('Escape');
  };
  await page
    .getByRole('button', { name: 'Markets, inflation & FX', exact: true })
    .click();
  await expect(
    page.locator('section[aria-labelledby="market-group-fx"] details'),
  ).toHaveJSProperty('open', true);
  for (const path of [
    'market.fx_spread',
    'market.income_yield_us_stocks',
    'market.income_yield_us_bonds',
  ])
    await check(path, '0.003');
  await check('market.fx_real_trend', '-0.003');
  await page.getByRole('button', { name: 'Accounts', exact: true }).click();
  await check('accounts[1].allocation.us_stocks', '0.003');
  await page.getByRole('button', { name: 'Properties', exact: true }).click();
  await check('properties[0].maintenance_annual', '0.003');
  const exported = await saveDraftText(
      page,
      `${info.project.name}-wheel-config.toml`,
    ),
    parsed = parseScenario(exported.text);
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) throw new Error(JSON.stringify(parsed.issues));
  expect(parsed.value.market!.fx_spread).toBe(0.003);
  expect(parsed.value.market!.fx_real_trend).toBe(-0.003);
  expect(parsed.value.properties![0].maintenance_annual).toBe(0.003);
  await record(`${info.project.name}-decimal-wheel.json`, {
    status: 'PASS',
    checked,
    focused_wheel_unchanged: true,
    keyboard_editing_preserved: true,
    exported_decimal_values_preserved: true,
  });
});

test('M02 M05 M09 M10: fixed three accounts, export/run/reload, and legacy holdings are rejected', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const draft = createExampleDraft();
  draft.simulation!.n_paths = 3;
  draft.simulation!.max_age = 41;
  await page.goto('/');
  await uploadDraft(page, draft);
  await page.getByRole('button', { name: 'Accounts', exact: true }).click();
  // No free editing: no add/remove/reorder controls and no name/type inputs.
  await expect(
    page.getByRole('button', { name: 'Add accounts', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Remove', exact: true }),
  ).toHaveCount(0);
  for (const index of [0, 1, 2])
    for (const field of ['name', 'type', 'owner', 'share_A', 'interest_rate'])
      await expect(
        page.getByLabel(`accounts[${index}].${field}`, { exact: true }),
      ).toHaveCount(0);
  await expect(page.getByText('Withdrawn 1 of 3')).toBeVisible();
  await expect(page.getByText('Withdrawn 2 of 3')).toBeVisible();
  await expect(page.getByText('Withdrawn 3 of 3')).toBeVisible();
  await expect(
    page.getByText('Owned evenly by both people').first(),
  ).toBeVisible();
  const balance = page.getByLabel('accounts[0].balance', { exact: true });
  await expect(
    page.locator('[data-config-field="accounts[0].balance"] .currency-symbol'),
  ).toHaveText('$');
  await balance.fill('1300000');
  await expect(balance).toHaveValue('1300000');
  for (const [key, value] of [
    ['us_stocks', '0.5'],
    ['us_bonds', '0.3'],
    ['usd_cash', '0.2'],
  ]) {
    const cell = page.getByLabel(`accounts[0].allocation.${key}`, {
      exact: true,
    });
    await cell.fill(value);
    await expect(cell).toHaveValue(value);
  }
  await expect(
    page.locator('.builder-section [aria-label*="holdings"]'),
  ).toHaveCount(0);
  await expect(
    page.getByLabel('accounts[0].cost_basis', { exact: true }),
  ).toHaveCount(0);
  const validation = (await page.locator('.validation').allTextContents()).join(
    '\n',
  );
  await expect(
    page.getByRole('button', { name: 'Run simulation', exact: false }),
    validation || 'Run readiness',
  ).toBeEnabled();
  const config = await saveDraftText(
    page,
    `${info.project.name}-simplified-accounts.toml`,
  );
  expect(config.text).not.toContain('holdings');
  expect(config.text).not.toContain('holding_profiles');
  expect(config.text).not.toContain('surplus_account');
  expect(config.text).not.toContain('owner =');
  const parsed = parseScenario(config.text);
  if (!parsed.ok) throw new Error(JSON.stringify(parsed.issues));
  expect(parsed.value.accounts!.map((a) => a.name)).toEqual([
    'brokerage',
    'after_tax',
    'pre_tax',
  ]);
  expect(parsed.value.accounts![0].balance).toBe(1300000);
  expect(parsed.value.accounts![0].allocation).toEqual({
    us_stocks: 0.5,
    us_bonds: 0.3,
    usd_cash: 0.2,
  });
  await complete(page, 3);
  const first = JSON.parse(
    (
      await saveDownload(
        page,
        'Download run manifest',
        `${info.project.name}-simplified-manifest.json`,
      )
    ).text,
  );
  await page.getByRole('button', { name: 'Year ledger', exact: true }).click();
  await expect(
    page.getByRole('table', { name: 'Year ledger', exact: true }),
  ).toBeVisible();
  const firstCsv = (
    await saveDownload(
      page,
      'Download ledger CSV',
      `${info.project.name}-simplified-ledger.csv`,
    )
  ).text
    .split('\n')
    .filter((l) => !l.startsWith('#'));
  expect(firstCsv[0].split(',')).not.toContain('firpta_withheld_usd');
  const legacy = structuredClone(parsed.value) as unknown as Record<
    string,
    unknown
  >;
  legacy.holding_profiles = {
    legacy_1: {
      instrument_type: 'stock_fund',
      issuer_domicile: 'US',
      resident_income_kind: 'qualified_dividend',
      nra_income_kind: 'dividend',
      classification_basis: 'assumed',
      classification_note: 'legacy',
    },
  };
  for (const account of legacy.accounts as Record<string, unknown>[]) {
    account.holdings = {
      usd_cash: {
        instrument_type: 'x',
        issuer_domicile: 'US',
        resident_income_kind: 'ordinary_income',
        nra_income_kind: 'exempt_interest',
        classification_basis: 'assumed',
        classification_note: 'legacy',
      },
    };
    account.holding_profiles = { usd_cash: 'legacy_1' };
  }
  await uploadDraft(page, legacy as unknown as DraftScenario);
  await expect(page.getByText('Import could not be applied')).toBeVisible();
  await expect(page.getByText('holding_profiles').first()).toBeVisible();
  expect(errors).toEqual([]);
  await record(`${info.project.name}-simplified-accounts.json`, {
    status: 'PASS',
    fixed_accounts: parsed.value.accounts!.map((a) => a.name),
    holdings_removed: true,
    legacy_rejected: true,
    ledger_columns: firstCsv[0].split(',').length,
    run_manifest: first.manifest,
  });
});

test('M02 M10: budget labels name medical spending and shocks fold like late-life care', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Load sample config' }).click();
  await page.getByRole('button', { name: 'Budget', exact: true }).click();
  await expect(
    page.getByText('Annual (includes medical)', { exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('[data-config-field="budget.annual"] .currency-symbol'),
  ).toHaveText('¥');
  await expect(
    page.locator(
      '[data-config-field="budget.included_health"] .currency-symbol',
    ),
  ).toHaveText('¥');
  const medical = page.locator('.config-group', {
    has: page.getByRole('heading', { name: 'Medical', exact: true }),
  });
  await expect(
    medical.getByText('Medical expenses', { exact: true }),
  ).toBeVisible();
  await expect(
    medical.getByLabel('budget.included_health', { exact: true }),
  ).toBeVisible();
  const shocks = medical.locator('details', {
    has: page.getByText('Shocks', { exact: true }),
  });
  await expect(
    shocks.getByLabel('medical.shock_median', { exact: true }),
  ).toBeHidden();
  await shocks.locator('summary').click();
  await expect(
    shocks.getByLabel('medical.shock_median', { exact: true }),
  ).toBeVisible();
  await shocks.locator('summary').click();
  await expect(
    shocks.getByLabel('medical.shock_median', { exact: true }),
  ).toBeHidden();
  const care = medical.locator('details', {
    has: page.getByText('Late life care', { exact: true }),
  });
  await expect(
    care.getByLabel('medical.late_life_care.monthly', { exact: true }),
  ).toBeHidden();
  await care.locator('summary').click();
  await expect(
    care.getByLabel('medical.late_life_care.monthly', { exact: true }),
  ).toBeVisible();
});

test('M02 M03 M10: history era presets set the sampling window and outlook shift runs', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const draft = createExampleDraft();
  draft.simulation!.n_paths = 2;
  draft.simulation!.max_age = 41;
  await page.goto('/');
  await uploadDraft(page, draft);
  await page
    .getByRole('button', { name: 'Markets, inflation & FX', exact: true })
    .click();
  await expect(
    page.locator('section[aria-labelledby="market-group-markets"] details'),
  ).toHaveJSProperty('open', true);
  const era = page.getByLabel('market.era', { exact: true });
  await expect(era).toHaveValue('full');
  await era.selectOption('recent');
  await expect(
    page.getByLabel('market.sample_start', { exact: true }),
  ).toHaveValue('2000');
  await expect(
    page.getByLabel('market.sample_end', { exact: true }),
  ).toHaveValue('2025');
  await era.selectOption('depression');
  await expect(era).toHaveValue('depression');
  await expect(
    page.getByLabel('market.sample_start', { exact: true }),
  ).toHaveValue('1929');
  await expect(
    page.getByLabel('market.sample_end', { exact: true }),
  ).toHaveValue('1939');
  await era.selectOption('crashes');
  await expect(
    page.getByLabel('market.sample_start', { exact: true }),
  ).toHaveValue('2000');
  await expect(
    page.getByLabel('market.sample_end', { exact: true }),
  ).toHaveValue('2009');
  const outlook = page.getByLabel('market.outlook_shift', { exact: true });
  await outlook.fill('0.02');
  await expect(outlook).toHaveValue('0.02');
  await page.getByLabel('market.sample_start', { exact: true }).fill('1950');
  await expect(era).toHaveValue('custom');
  await complete(page, 2);
  const config = await saveDownload(
    page,
    'Download run config',
    `${info.project.name}-era-outlook.toml`,
  );
  expect(config.text).toContain('outlook_shift = 0.02');
  expect(config.text).toContain('sample_start = 1950');
  expect(errors).toEqual([]);
});
