import { test, expect } from './fixtures';
import { record, saveDraftText } from './helpers';
import { parseScenario } from '../../src/config/config';

test('M02 M10: question-based guided setup builds a runnable configuration in a modal', async ({
  page,
}, info) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Guided setup', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Your household draft', exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Start guided setup →', exact: true })
    .click();
  const dialog = page.getByRole('dialog', {
    name: 'Guided setup',
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await expect(page.locator('.entry-grid')).toBeVisible();
  await expect(page.locator('.builder-section h2')).toHaveCount(0);
  await expect(dialog.getByText('Step 1 of 7', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Two people', exact: true }).click();
  await dialog.getByRole('button', { name: 'China', exact: true }).click();
  await dialog.getByRole('button', { name: 'Next', exact: false }).click();
  await expect(dialog.getByText('Step 2 of 7', { exact: true })).toBeVisible();
  await dialog.getByLabel('Person A birth year', { exact: true }).fill('1986');
  await dialog
    .getByRole('group', { name: 'Person A citizenship', exact: true })
    .getByRole('button', { name: 'US citizen', exact: true })
    .click();
  await dialog.getByLabel('Person B birth year', { exact: true }).fill('1986');
  await dialog
    .getByRole('group', { name: 'Person B citizenship', exact: true })
    .getByRole('button', { name: 'Not a US citizen', exact: true })
    .click();
  await dialog.getByRole('button', { name: 'Next', exact: false }).click();
  await expect(dialog.getByText('Step 3 of 7', { exact: true })).toBeVisible();
  await dialog
    .getByLabel('Annual spending CNY', { exact: true })
    .fill('250000');
  await dialog
    .getByLabel('Medical spending CNY', { exact: true })
    .fill('38000');
  await dialog.getByRole('button', { name: 'Next', exact: false }).click();
  await expect(dialog.getByText('Step 4 of 7', { exact: true })).toBeVisible();
  await dialog
    .getByLabel('Non-retirement investments USD', { exact: true })
    .fill('2000000');
  await dialog.getByRole('button', { name: 'Next', exact: false }).click();
  await expect(dialog.getByText('Step 5 of 7', { exact: true })).toBeVisible();
  await dialog
    .getByLabel('Pre-tax retirement USD', { exact: true })
    .fill('900000');
  await dialog
    .getByLabel('After-tax retirement USD', { exact: true })
    .fill('150000');
  await dialog.getByRole('button', { name: 'Next', exact: false }).click();
  await expect(dialog.getByText('Step 6 of 7', { exact: true })).toBeVisible();
  await expect(
    dialog.getByLabel('Plan through age', { exact: true }),
  ).toHaveValue('110');
  const startYear = String(new Date().getFullYear());
  await expect(
    dialog.getByLabel('Plan start year', { exact: true }),
  ).toHaveValue(startYear);
  await dialog.getByRole('button', { name: 'Next', exact: false }).click();
  await expect(dialog.getByText('Step 7 of 7', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Two people retiring in China.')).toBeVisible();
  await dialog
    .getByRole('button', { name: 'Start simulation', exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByTestId('run-status')).toContainText(
    'Completed 2,000 paths',
    { timeout: 60_000 },
  );
  await expect(page.getByTestId('success-probability')).toBeVisible();
  const config = await saveDraftText(
      page,
      `${info.project.name}-guided-setup.toml`,
    ),
    parsed = parseScenario(config.text);
  expect(parsed.ok).toBe(true);
  if (parsed.ok) {
    expect(parsed.value.people!.domicile).toBe('China');
    expect(parsed.value.people!.A!.us_income_tax_status).toBe('resident');
    expect(parsed.value.people!.B!.us_income_tax_status).toBe('nonresident');
    expect(parsed.value.accounts!.map((a) => a.type)).toEqual([
      'brokerage',
      'after_tax',
      'pre_tax',
    ]);
    expect(parsed.value.accounts!.map((a) => a.name)).toEqual([
      'brokerage',
      'after_tax',
      'pre_tax',
    ]);
    expect(parsed.value.withdrawals).not.toHaveProperty('surplus_account');
  }
  await page.reload();
  await page
    .getByRole('button', { name: 'Start guided setup →', exact: true })
    .click();
  await expect(dialog.getByText('Step 1 of 7', { exact: true })).toBeVisible();
  await page.locator('.modal-overlay').click({ position: { x: 8, y: 8 } });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole('button', { name: 'Exit guided setup', exact: true })
    .click();
  await expect(
    dialog.getByText(
      'Exit guided setup? Your answers so far will be discarded.',
      {
        exact: true,
      },
    ),
  ).toBeVisible();
  await dialog
    .getByRole('button', { name: 'Keep editing', exact: true })
    .click();
  await expect(dialog.getByText('Step 1 of 7', { exact: true })).toBeVisible();
  await expect(
    dialog.getByRole('button', { name: 'Exit guided setup', exact: true }),
  ).toBeVisible();
  await dialog
    .getByRole('button', { name: 'Exit guided setup', exact: true })
    .click();
  await dialog
    .getByRole('button', { name: 'Discard and exit', exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Guided setup', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.builder-section h2')).toHaveCount(0);
  await record(`${info.project.name}-guided-setup.json`, {
    status: 'PASS',
    method:
      'Seven-question modal holds the start page until finished, then auto-runs the simulation and lands on results; exiting early requires confirming the discard',
    steps: 7,
    runnable: true,
  });
});
