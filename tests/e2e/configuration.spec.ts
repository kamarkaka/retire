import { test, expect } from './fixtures';
import { complete, record, saveDownload, uploadDraft } from './helpers';
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
  draft.accounts!.push({
    name: 'help_savings',
    type: 'cash_usd',
    owner: 'A',
    share_A: 1,
    balance: 1000,
    interest_rate: 0.03,
  });
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
    'Schema',
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
      expect(control.info).toBe(`About ${control.path}`);
      expect(control.label).toBe(control.id);
      let path = control.path!.replace(/\[\d+\]/g, '[]');
      if (!inventory.fields.some((f) => f.path === path))
        path = path.replace(/(?:\[\])+$/, '');
      const field = inventory.fields.find((f) => f.path === path);
      expect(field, `Unmapped input ${control.path}`).toBeDefined();
      expect(control.description).toContain(field!.description);
      paths.add(path);
    }
  }
  expect([...paths].sort()).toEqual(
    inventory.fields
      .filter((f) => f.type !== 'object[]')
      .map((f) => f.path)
      .sort(),
  );
  await page
    .getByRole('button', { name: 'Markets, inflation & FX', exact: true })
    .click();
  const spread = page.getByLabel('market.fx_spread', { exact: true });
  await spread.hover();
  await expect(page.getByRole('tooltip')).toBeVisible();
  await expect(page.getByRole('tooltip')).toContainText('0.003 means 0.3%');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await spread.focus();
  await expect(page.getByRole('tooltip')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(spread).toBeFocused();
  await page
    .getByRole('button', { name: 'About market.fx_spread', exact: true })
    .click();
  await expect(page.getByRole('tooltip')).toBeVisible();
  await page.mouse.move(1, 1);
  await expect(page.getByRole('tooltip')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await page.setViewportSize({ width: 375, height: 640 });
  await spread.hover();
  const bounds = await page.getByRole('tooltip').boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(11);
  expect(bounds!.y).toBeGreaterThanOrEqual(11);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(364);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(629);
  await page.keyboard.press('Escape');
  await page.getByText('Portable TOML configuration', { exact: true }).click();
  await page.getByLabel('TOML editor', { exact: true }).focus();
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
  const exported = await saveDownload(
      page,
      'Download current config',
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

test('M02 M05 M09 M10: add brokerage and savings accounts, export/run/reload, and legacy holdings are rejected', async ({
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
  await page.getByRole('button', { name: 'Add accounts', exact: true }).click();
  for (const [field, value] of [
    ['name', 'extra_brokerage'],
    ['balance', '100000'],
  ]) {
    const input = page.getByLabel(`accounts[5].${field}`, { exact: true });
    await input.fill(value);
    await expect(input).toHaveValue(value);
  }
  await page
    .getByLabel('accounts[5].allocation.us_stocks', { exact: true })
    .fill('0.6');
  await page
    .getByLabel('accounts[5].allocation.us_bonds', { exact: true })
    .fill('0.4');
  await page
    .getByLabel('accounts[5].allocation.usd_cash', { exact: true })
    .fill('0');
  await expect(
    page.locator('.builder-section [aria-label*="holdings"]'),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Add accounts', exact: true }).click();
  await page
    .getByLabel('accounts[6].type', { exact: true })
    .selectOption('cash_usd');
  for (const [field, value] of [
    ['name', 'extra_savings'],
    ['balance', '50000'],
    ['interest_rate', '0.04'],
  ]) {
    const input = page.getByLabel(`accounts[6].${field}`, { exact: true });
    await input.fill(value);
    await expect(input).toHaveValue(value);
  }
  await expect(
    page.getByLabel('accounts[6].allocation.us_stocks', { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByLabel('accounts[5].cost_basis', { exact: true }),
  ).toHaveCount(0);
  const validation = (await page.locator('.validation').allTextContents()).join(
    '\n',
  );
  await expect(
    page.getByRole('button', { name: 'Run simulation', exact: false }),
    validation || 'Run readiness',
  ).toBeEnabled();
  const config = await saveDownload(
    page,
    'Download current config',
    `${info.project.name}-simplified-accounts.toml`,
  );
  expect(config.text).not.toContain('holdings');
  expect(config.text).not.toContain('holding_profiles');
  const parsed = parseScenario(config.text);
  if (!parsed.ok) throw new Error(JSON.stringify(parsed.issues));
  const newAccount = parsed.value.accounts![5];
  if (newAccount.type !== 'brokerage')
    throw new Error('Expected added brokerage account');
  expect(newAccount.allocation).toEqual({
    us_stocks: 0.6,
    us_bonds: 0.4,
    usd_cash: 0,
  });
  const savings = parsed.value.accounts![6];
  if (savings.type !== 'cash_usd')
    throw new Error('Expected added savings account');
  expect(savings.interest_rate).toBe(0.04);
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
  await page.getByLabel('Replay path ID').fill('0');
  await expect(page.getByTestId('ledger-ready')).toContainText('Path 0');
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
    added_account: newAccount,
    added_savings: savings,
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
    page.getByText('Annual CNY (includes medical)', { exact: true }),
  ).toBeVisible();
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
  ).toBeVisible();
  await shocks.locator('summary').click();
  await expect(
    shocks.getByLabel('medical.shock_median', { exact: true }),
  ).toBeHidden();
  await shocks.locator('summary').click();
  await expect(
    shocks.getByLabel('medical.shock_median', { exact: true }),
  ).toBeVisible();
  const care = medical.locator('details', {
    has: page.getByText('Late life care', { exact: true }),
  });
  await expect(
    care.getByLabel('medical.late_life_care.monthly', { exact: true }),
  ).toBeVisible();
});
