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
  const mode = page.getByRole('dialog', {
    name: 'Choose a setup mode',
    exact: true,
  });
  await expect(mode).toBeVisible();
  await expect(mode).toHaveCSS('max-width', '560px');
  await expect(mode.getByText('Easy mode', { exact: true })).toBeVisible();
  await expect(mode.getByText('Power mode', { exact: true })).toBeVisible();
  await expect(mode.locator('svg.mode-hero')).toHaveCount(2);
  await expect(mode.locator('.mode-go')).toHaveCount(0);
  for (const hero of await mode.locator('svg.mode-hero').all()) {
    const heroBox = await hero.boundingBox();
    expect(heroBox?.width).toBe(72);
    expect(heroBox?.height).toBe(72);
  }
  const closeBox = await mode
    .getByRole('button', { name: 'Close', exact: true })
    .boundingBox();
  const modeBox = await mode.boundingBox();
  expect(closeBox).not.toBeNull();
  expect(modeBox).not.toBeNull();
  const topGap = closeBox!.y - modeBox!.y;
  const rightGap =
    modeBox!.x + modeBox!.width - (closeBox!.x + closeBox!.width);
  expect(Math.abs(topGap - rightGap)).toBeLessThanOrEqual(1);
  await mode.locator('[data-mode="basic"]').click();
  const dialog = page.getByRole('dialog', {
    name: 'Guided setup',
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveCSS('max-width', '440px');
  await expect(page.locator('.entry-grid')).toBeVisible();
  await expect(page.locator('.builder-section h2')).toHaveCount(0);
  await expect(
    dialog.getByText('Question 1 / 6: Household', { exact: true }),
  ).toBeVisible();
  await dialog.getByRole('button', { name: 'Two people', exact: true }).click();
  await dialog.getByRole('button', { name: 'China', exact: true }).click();
  await dialog.getByRole('button', { name: 'Next', exact: false }).click();
  await expect(
    dialog.getByText('Question 2 / 6: People', { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByText('One birth year and citizenship answer per person.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    dialog.getByText(
      'Citizens use resident tax treatment; everyone else uses nonresident treatment.',
    ),
  ).toHaveCount(0);
  const birthYear = dialog.getByLabel('Person A birth year', { exact: true });
  await expect(birthYear).toHaveAttribute('inputmode', 'numeric');
  await expect(dialog.locator('label.birth-year-row').first()).toHaveCSS(
    'flex-direction',
    'row',
  );
  const birthBox = await birthYear.boundingBox();
  expect(birthBox).not.toBeNull();
  expect(birthBox!.height).toBeGreaterThanOrEqual(40);
  expect(birthBox!.width).toBeLessThanOrEqual(120);
  await expect(
    dialog.getByRole('button', { name: 'Not a US citizen', exact: true }),
  ).toHaveCount(0);
  const citizenA = dialog.getByLabel('Person A citizenship', { exact: true });
  const citizenB = dialog.getByLabel('Person B citizenship', { exact: true });
  await expect(citizenA).not.toBeChecked();
  await expect(citizenB).not.toBeChecked();
  await birthYear.fill('19861');
  await expect(birthYear).toHaveValue('1986');
  await citizenA.check();
  await expect(citizenA).toBeChecked();
  await expect(dialog.locator('label.check-button').first()).toHaveCSS(
    'background-color',
    'rgb(232, 239, 227)',
  );
  const citizenLabelBox = await dialog
    .locator('label.check-button')
    .first()
    .boundingBox();
  expect(citizenLabelBox).not.toBeNull();
  expect(citizenLabelBox!.width).toBeLessThan(200);
  expect(citizenLabelBox!.x).toBeGreaterThan(birthBox!.x + birthBox!.width);
  const birthCenter = birthBox!.y + birthBox!.height / 2;
  expect(birthCenter).toBeGreaterThanOrEqual(citizenLabelBox!.y);
  expect(birthCenter).toBeLessThanOrEqual(
    citizenLabelBox!.y + citizenLabelBox!.height,
  );
  await dialog.getByLabel('Person B birth year', { exact: true }).fill('1986');
  await dialog.getByRole('button', { name: 'Next', exact: false }).click();
  await expect(
    dialog.getByText('Question 3 / 6: Spending', { exact: true }),
  ).toBeVisible();
  await expect(dialog.locator('label.check-button')).toHaveCount(2);
  const annualSpending = dialog.getByLabel('Annual spending CNY', {
    exact: true,
  });
  await expect(annualSpending).toHaveAttribute('inputmode', 'numeric');
  await expect(dialog.locator('label.field-row').first()).toHaveCSS(
    'flex-direction',
    'row',
  );
  const annualBox = await annualSpending.boundingBox();
  expect(annualBox).not.toBeNull();
  const annualFieldHeight = await annualSpending.evaluate(
    (el) => el.parentElement!.getBoundingClientRect().height,
  );
  expect(annualFieldHeight).toBeGreaterThanOrEqual(40);
  await expect(
    dialog.getByText('Annual spending, CNY', { exact: true }),
  ).toHaveCount(0);
  const symbols = dialog.locator('.currency-symbol');
  await expect(symbols.first()).toHaveText('¥');
  const symbolBox = await symbols.first().boundingBox();
  expect(symbolBox).not.toBeNull();
  expect(symbolBox!.x + symbolBox!.width).toBeLessThanOrEqual(annualBox!.x);
  expect(symbolBox!.y).toBeLessThan(annualBox!.y + annualBox!.height);
  expect(annualBox!.y).toBeLessThan(symbolBox!.y + symbolBox!.height);
  const medicalBox = await dialog
    .getByLabel('Medical spending CNY', { exact: true })
    .boundingBox();
  expect(medicalBox?.width).toBeGreaterThanOrEqual(110);
  await expect(
    dialog.getByText('Medical spending included above (optional)', {
      exact: true,
    }),
  ).toHaveCount(0);
  const medicalNote = dialog.locator('.field-note');
  await expect(medicalNote).toHaveText(
    'Already included in annual spending above — not added on top.',
  );
  await expect(medicalNote).toHaveCSS('font-size', '11px');
  const noteBox = await medicalNote.boundingBox();
  expect(noteBox).not.toBeNull();
  expect(medicalBox).not.toBeNull();
  expect(noteBox!.y).toBeGreaterThanOrEqual(medicalBox!.y + medicalBox!.height);
  await dialog
    .getByLabel('Annual spending CNY', { exact: true })
    .fill('250000');
  await dialog
    .getByLabel('Medical spending CNY', { exact: true })
    .fill('38000');
  const shockCheck = dialog.getByLabel('Include unexpected medical shocks');
  await expect(shockCheck).not.toBeChecked();
  await expect(dialog.locator('label.check-button').first()).toHaveCSS(
    'background-color',
    'rgb(255, 255, 255)',
  );
  await shockCheck.check();
  await expect(shockCheck).toBeChecked();
  await expect(dialog.locator('label.check-button').first()).toHaveCSS(
    'background-color',
    'rgb(232, 239, 227)',
  );
  await expect(
    dialog.getByLabel('Typical shock amount CNY', { exact: true }),
  ).toHaveValue('50000');
  const shockAmount = dialog.getByLabel('Typical shock amount CNY', {
    exact: true,
  });
  await expect(shockAmount).toHaveAttribute('inputmode', 'numeric');
  const shockFieldHeight = await shockAmount.evaluate(
    (el) => el.parentElement!.getBoundingClientRect().height,
  );
  expect(shockFieldHeight).toBeGreaterThanOrEqual(40);
  await dialog
    .getByLabel('Typical shock amount CNY', { exact: true })
    .fill('60000');
  await dialog.getByLabel('Include late-life care').check();
  await expect(
    dialog.getByLabel('Care start age', { exact: true }),
  ).toHaveValue('85');
  await expect(
    dialog.getByLabel('Monthly care cost CNY', { exact: true }),
  ).toHaveValue('8000');
  const careMonthly = dialog.getByLabel('Monthly care cost CNY', {
    exact: true,
  });
  await expect(careMonthly).toHaveAttribute('inputmode', 'numeric');
  const careFieldHeight = await careMonthly.evaluate(
    (el) => el.parentElement!.getBoundingClientRect().height,
  );
  expect(careFieldHeight).toBeGreaterThanOrEqual(40);
  await expect(dialog.locator('.currency-symbol')).toHaveCount(4);
  await dialog.getByLabel('Care start age', { exact: true }).fill('85');
  await dialog
    .getByLabel('Monthly care cost CNY', { exact: true })
    .fill('8000');
  await dialog.getByRole('button', { name: 'Next', exact: false }).click();
  await expect(
    dialog.getByText('Question 4 / 6: Savings', { exact: true }),
  ).toBeVisible();
  const liquidAssets = dialog.getByLabel('Liquid Assets USD', {
    exact: true,
  });
  await expect(liquidAssets).toHaveAttribute('inputmode', 'numeric');
  await expect(dialog.locator('.currency-symbol')).toHaveCount(1);
  await expect(dialog.locator('.currency-symbol')).toHaveText('$');
  const liquidFieldHeight = await liquidAssets.evaluate(
    (el) => el.parentElement!.getBoundingClientRect().height,
  );
  expect(liquidFieldHeight).toBeGreaterThanOrEqual(40);
  const liquidBox = await liquidAssets.boundingBox();
  const liquidSymbolBox = await dialog
    .locator('.currency-symbol')
    .boundingBox();
  expect(liquidBox).not.toBeNull();
  expect(liquidSymbolBox).not.toBeNull();
  expect(liquidSymbolBox!.x + liquidSymbolBox!.width).toBeLessThanOrEqual(
    liquidBox!.x,
  );
  await expect(
    dialog.getByText('Non-retirement investments, USD', { exact: true }),
  ).toHaveCount(0);
  await liquidAssets.fill('2000000');
  await dialog.getByRole('button', { name: 'Next', exact: false }).click();
  await expect(
    dialog.getByText('Question 5 / 6: Retirement', { exact: true }),
  ).toBeVisible();
  const preTax = dialog.getByLabel('Pre-tax retirement USD', {
    exact: true,
  });
  const afterTax = dialog.getByLabel('After-tax retirement USD', {
    exact: true,
  });
  await expect(preTax).toHaveAttribute('inputmode', 'numeric');
  await expect(afterTax).toHaveAttribute('inputmode', 'numeric');
  await expect(dialog.locator('.currency-symbol')).toHaveCount(2);
  await expect(dialog.locator('.currency-symbol').first()).toHaveText('$');
  const preTaxFieldHeight = await preTax.evaluate(
    (el) => el.parentElement!.getBoundingClientRect().height,
  );
  expect(preTaxFieldHeight).toBeGreaterThanOrEqual(40);
  const afterTaxFieldHeight = await afterTax.evaluate(
    (el) => el.parentElement!.getBoundingClientRect().height,
  );
  expect(afterTaxFieldHeight).toBeGreaterThanOrEqual(40);
  await expect(
    dialog.getByText('Pre-tax retirement (401k, traditional IRA), USD', {
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    dialog.getByText('After-tax retirement (Roth), USD', { exact: true }),
  ).toHaveCount(0);
  await expect(
    dialog.getByText('Pre-tax retirement (401k, traditional IRA)', {
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    dialog.getByText('After-tax retirement (Roth)', { exact: true }),
  ).toHaveCount(0);
  const preTaxNote = dialog.locator('.field-note').nth(0);
  const afterTaxNote = dialog.locator('.field-note').nth(1);
  await expect(preTaxNote).toHaveText('(401k, traditional IRA)');
  await expect(afterTaxNote).toHaveText('(Roth)');
  await expect(preTaxNote).toHaveCSS('font-size', '11px');
  const preTaxNoteBox = await preTaxNote.boundingBox();
  const afterTaxNoteBox = await afterTaxNote.boundingBox();
  const preTaxBox = await preTax.boundingBox();
  const afterTaxBox = await afterTax.boundingBox();
  expect(preTaxNoteBox).not.toBeNull();
  expect(afterTaxNoteBox).not.toBeNull();
  expect(preTaxBox).not.toBeNull();
  expect(afterTaxBox).not.toBeNull();
  expect(preTaxNoteBox!.y).toBeGreaterThanOrEqual(
    preTaxBox!.y + preTaxBox!.height,
  );
  expect(afterTaxNoteBox!.y).toBeGreaterThanOrEqual(
    afterTaxBox!.y + afterTaxBox!.height,
  );
  const preTaxFieldRight = await preTax.evaluate(
    (el) => el.parentElement!.getBoundingClientRect().right,
  );
  const afterTaxFieldRight = await afterTax.evaluate(
    (el) => el.parentElement!.getBoundingClientRect().right,
  );
  expect(Math.abs(preTaxFieldRight - afterTaxFieldRight)).toBeLessThanOrEqual(
    1,
  );
  await preTax.fill('900000');
  await afterTax.fill('150000');
  await dialog.getByRole('button', { name: 'Next', exact: false }).click();
  await expect(
    dialog.getByText('Question 6 / 6: Horizon', { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByLabel('Plan through age', { exact: true }),
  ).toHaveValue('110');
  const startYear = String(new Date().getFullYear());
  await expect(
    dialog.getByLabel('Plan start year', { exact: true }),
  ).toHaveValue(startYear);
  const startYearInput = dialog.getByLabel('Plan start year', {
    exact: true,
  });
  const throughAgeInput = dialog.getByLabel('Plan through age', {
    exact: true,
  });
  await expect(startYearInput).toHaveAttribute('inputmode', 'numeric');
  await expect(throughAgeInput).toHaveAttribute('inputmode', 'numeric');
  await expect(dialog.locator('label.field-row').first()).toHaveCSS(
    'flex-direction',
    'row',
  );
  const startYearBox = await startYearInput.boundingBox();
  const throughAgeBox = await throughAgeInput.boundingBox();
  expect(startYearBox?.height).toBeGreaterThanOrEqual(40);
  expect(throughAgeBox?.height).toBeGreaterThanOrEqual(40);
  expect(startYearBox).not.toBeNull();
  expect(throughAgeBox).not.toBeNull();
  expect(
    Math.abs(
      startYearBox!.x +
        startYearBox!.width -
        (throughAgeBox!.x + throughAgeBox!.width),
    ),
  ).toBeLessThanOrEqual(1);
  await dialog.getByRole('button', { name: 'Next', exact: false }).click();
  await expect(
    dialog.getByText('Review your starting plan', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(dialog.getByText('Two people retiring in China.')).toBeVisible();
  await expect(
    dialog.getByText('Unexpected medical shocks around 60,000 CNY.'),
  ).toBeVisible();
  await expect(
    dialog.getByText('Late-life care from age 85 at 8,000 CNY per month.'),
  ).toBeVisible();
  await dialog
    .getByRole('button', { name: 'Start simulation', exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByTestId('run-status')).toContainText(
    'Completed 5,000 paths',
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
    expect(parsed.value.medical!.shock_enabled).toBe(true);
    expect(parsed.value.medical!.shock_median).toBe(60000);
    expect(parsed.value.medical!.late_life_care!.enabled).toBe(true);
    expect(parsed.value.medical!.late_life_care!.start_age).toBe(85);
    expect(parsed.value.medical!.late_life_care!.monthly).toBe(8000);
  }
  await page.reload();
  await page
    .getByRole('button', { name: 'Start guided setup →', exact: true })
    .click();
  await mode.locator('[data-mode="basic"]').click();
  await expect(
    dialog.getByText('Question 1 / 6: Household', { exact: true }),
  ).toBeVisible();
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
  await expect(dialog.locator('.modal-blur')).toHaveCount(1);
  const blurFilter = await dialog
    .locator('.modal-blur')
    .evaluate((el) => getComputedStyle(el).filter);
  expect(blurFilter).toContain('blur');
  const confirmBox = await dialog.locator('.exit-confirm').boundingBox();
  const guidedBox = await dialog.boundingBox();
  expect(confirmBox).not.toBeNull();
  expect(guidedBox).not.toBeNull();
  expect(confirmBox!.y - guidedBox!.y).toBeLessThanOrEqual(
    guidedBox!.height / 3,
  );
  const confirmAlign = await dialog
    .locator('.exit-confirm')
    .evaluate((el) => getComputedStyle(el).textAlign);
  expect(confirmAlign).toBe('center');
  const confirmToolbarJustify = await dialog
    .locator('.exit-confirm .toolbar')
    .evaluate((el) => getComputedStyle(el).justifyContent);
  expect(confirmToolbarJustify).toBe('center');
  await dialog
    .getByRole('button', { name: 'Keep editing', exact: true })
    .click();
  await expect(
    dialog.getByText('Question 1 / 6: Household', { exact: true }),
  ).toBeVisible();
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

test('M02 M10: power-mode guided setup walks every section to a runnable config', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Start guided setup →', exact: true })
    .click();
  const mode = page.getByRole('dialog', {
    name: 'Choose a setup mode',
    exact: true,
  });
  await mode.locator('[data-mode="advanced"]').click();
  const dialog = page.getByRole('dialog', { name: 'Power setup', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveCSS('max-width', '880px');
  const next = () =>
    dialog.getByRole('button', { name: 'Next', exact: false }).click();
  await expect(
    dialog.getByText('Step 1 of 9: Household & people', { exact: true }),
  ).toBeVisible();
  // Guide mode strips units and omission footnotes from embedded editors.
  await expect(dialog.locator('.field-help')).toHaveCount(0);
  await expect(dialog.locator('.field-label small')).toHaveCount(0);
  await expect(
    dialog.getByRole('button', { name: 'One person', exact: true }),
  ).toHaveCount(0);
  await expect(
    dialog.getByRole('button', { name: 'Two people', exact: true }),
  ).toHaveCount(0);
  await expect(
    dialog.getByRole('button', { name: 'Add a second person' }),
  ).toBeVisible();
  const birthField = dialog.locator(
    '[data-config-field="people.A.birth_year"]',
  );
  await expect(birthField).toHaveCSS('flex-direction', 'row');
  const birthHeadingBox = await birthField
    .locator('.field-heading')
    .boundingBox();
  const birthInput = dialog.getByLabel('people.A.birth_year', {
    exact: true,
  });
  const birthInputBox = await birthInput.boundingBox();
  expect(birthHeadingBox).not.toBeNull();
  expect(birthInputBox).not.toBeNull();
  expect(birthHeadingBox!.x + birthHeadingBox!.width).toBeLessThanOrEqual(
    birthInputBox!.x,
  );
  expect(birthInputBox!.height).toBeGreaterThanOrEqual(40);
  // The input grows past its 200px basis to fill the cell; the fill is
  // asserted against the field edge below.
  expect(birthInputBox!.width).toBeGreaterThan(200);
  const birthFieldBox = await birthField.boundingBox();
  expect(birthFieldBox).not.toBeNull();
  expect(Math.abs(birthHeadingBox!.x - birthFieldBox!.x)).toBeLessThanOrEqual(
    1,
  );
  const infoButton = birthField.locator('button.field-info');
  await birthField.hover();
  await page.waitForTimeout(300);
  await expect(page.locator('.field-tooltip')).toHaveCount(0);
  await infoButton.hover();
  await expect(page.locator('.field-tooltip')).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(page.locator('.field-tooltip')).toHaveCount(0);
  await infoButton.evaluate((el) => el.focus());
  await expect(page.locator('.field-tooltip')).toBeVisible();
  await infoButton.evaluate((el) => el.blur());
  await expect(page.locator('.field-tooltip')).toHaveCount(0);
  // Domicile defaults to US, shown as United States.
  await expect(
    dialog.getByLabel('people.domicile', { exact: true }),
  ).toHaveValue('US');
  await expect(
    dialog.locator('[data-config-field="people.domicile"] option[value="US"]'),
  ).toHaveText('United States');
  await dialog
    .getByLabel('people.domicile', { exact: true })
    .selectOption('China');
  await birthInput.fill('1986');
  const citizenField = dialog.locator(
    '[data-config-field="people.A.us_citizen"]',
  );
  const citizenInput = dialog.getByLabel('people.A.us_citizen', {
    exact: true,
  });
  await expect(citizenField).toHaveCSS('flex-direction', 'row');
  await expect(citizenField).toHaveCSS(
    'background-color',
    'rgb(255, 255, 255)',
  );
  await citizenInput.check();
  await expect(citizenField).toHaveCSS(
    'background-color',
    'rgb(232, 239, 227)',
  );
  const citizenBox = await citizenInput.boundingBox();
  expect(citizenBox?.width).toBe(22);
  expect(citizenBox?.height).toBe(22);
  // Person and pension sections do not fold: no details elements remain,
  // and the person heading reads Person A.
  await expect(dialog.locator('.people-editor details')).toHaveCount(0);
  await expect(dialog.locator('.people-editor .pension-section>h3')).toHaveText(
    'Pension',
  );
  await expect(dialog.locator('.people-editor .person-section')).toHaveCount(1);
  await expect(
    dialog.locator('.people-editor .person-section>h3').first(),
  ).toHaveText('Person A');
  // Citizen checkbox shares the birth-year row, checkbox before its label.
  await expect(citizenField.locator('.field-label span').first()).toHaveText(
    'US citizen',
  );
  const citizenLabelBox = await citizenField
    .locator('.field-label span')
    .boundingBox();
  expect(birthFieldBox!.y).toBeCloseTo(
    (await citizenField.boundingBox())!.y,
    0,
  );
  expect(citizenBox!.x).toBeLessThan(citizenLabelBox!.x);
  // Pension follows the two-column rows: Annual + Start age on row 1, Cola
  // alone on row 2 covering only the left half; checkbox precedes its label.
  const pensionBoxes = await Promise.all(
    ['annual', 'start_age', 'cola'].map((key) =>
      dialog
        .locator(`[data-config-field="people.A.pension.${key}"]`)
        .boundingBox(),
    ),
  );
  expect(pensionBoxes[0]!.y).toBeCloseTo(pensionBoxes[1]!.y, 0);
  expect(pensionBoxes[2]!.y).toBeGreaterThan(pensionBoxes[1]!.y);
  expect(pensionBoxes[2]!.x).toBeCloseTo(pensionBoxes[0]!.x, 0);
  expect(pensionBoxes[2]!.width).toBeCloseTo(pensionBoxes[0]!.width, 0);
  const colaInput = dialog.getByLabel('people.A.pension.cola', {
    exact: true,
  });
  const colaBox = await colaInput.boundingBox();
  const colaLabelBox = await dialog
    .locator('[data-config-field="people.A.pension.cola"] .field-label span')
    .boundingBox();
  expect(colaBox!.x).toBeLessThan(colaLabelBox!.x);
  // Cola label spells out the adjustment, and the pension annual input
  // carries a dollar prefix.
  await expect(
    dialog
      .locator('[data-config-field="people.A.pension.cola"] .field-label span')
      .first(),
  ).toHaveText('COLA (Cost-of-Living Adjustment)');
  const currencySymbol = dialog.locator(
    '[data-config-field="people.A.pension.annual"] .currency-symbol',
  );
  await expect(currencySymbol).toHaveText('$');
  const annualInputBox = await dialog
    .getByLabel('people.A.pension.annual', { exact: true })
    .boundingBox();
  expect((await currencySymbol.boundingBox())!.x).toBeLessThan(
    annualInputBox!.x,
  );
  // Each input fills its cell: the input's right edge meets the field's.
  // The checkbox itself stays 22px; only text/select inputs stretch.
  expect(colaBox!.width).toBe(22);
  const fillRight = async (fieldSel: string, label: string) => {
    const fieldBox = await dialog.locator(fieldSel).boundingBox();
    const inputBox = await dialog
      .getByLabel(label, { exact: true })
      .boundingBox();
    expect(fieldBox).not.toBeNull();
    expect(inputBox).not.toBeNull();
    expect(
      Math.abs(fieldBox!.x + fieldBox!.width - (inputBox!.x + inputBox!.width)),
    ).toBeLessThanOrEqual(1);
  };
  await fillRight('[data-config-field="people.domicile"]', 'people.domicile');
  await fillRight(
    '[data-config-field="people.A.birth_year"]',
    'people.A.birth_year',
  );
  // The pension annual input sits in the bordered $ wrapper, so the
  // wrapper's right edge meets the field's.
  const annualWrapBox = await dialog
    .locator('[data-config-field="people.A.pension.annual"] .currency-field')
    .boundingBox();
  const annualFieldBox = await dialog
    .locator('[data-config-field="people.A.pension.annual"]')
    .boundingBox();
  expect(
    Math.abs(
      annualFieldBox!.x +
        annualFieldBox!.width -
        (annualWrapBox!.x + annualWrapBox!.width),
    ),
  ).toBeLessThanOrEqual(1);
  // The info button sits right after its label (the 8px heading gap), the
  // birth row never wraps, and the left-column inputs share one right edge.
  const infoGap = async (fieldSel: string) => {
    const field = dialog.locator(fieldSel);
    const spanBox = await field
      .locator('.field-label span')
      .first()
      .boundingBox();
    const infoBox = await field.locator('button.field-info').boundingBox();
    expect(spanBox).not.toBeNull();
    expect(infoBox).not.toBeNull();
    return infoBox!.x - (spanBox!.x + spanBox!.width);
  };
  for (const sel of [
    '[data-config-field="people.domicile"]',
    '[data-config-field="people.A.birth_year"]',
    '[data-config-field="people.A.pension.annual"]',
  ])
    expect(await infoGap(sel)).toBeCloseTo(8, 0);
  expect((await birthField.boundingBox())!.height).toBeLessThanOrEqual(48);
  const inputRight = async (label: string) => {
    const box = await dialog.getByLabel(label, { exact: true }).boundingBox();
    expect(box).not.toBeNull();
    return box!.x + box!.width;
  };
  const fieldRight = async (fieldSel: string) => {
    const box = await dialog.locator(fieldSel).boundingBox();
    expect(box).not.toBeNull();
    return box!.x + box!.width;
  };
  const rights = await Promise.all([
    inputRight('people.domicile'),
    inputRight('people.A.birth_year'),
    fieldRight('[data-config-field="people.A.pension.annual"]'),
    fieldRight('[data-config-field="people.A.pension.cola"]'),
  ]);
  expect(Math.max(...rights) - Math.min(...rights)).toBeLessThanOrEqual(2);
  await dialog.getByRole('button', { name: 'Add a second person' }).click();
  await expect(
    dialog.getByRole('button', { name: 'Add a second person' }),
  ).toHaveCount(0);
  await expect(
    dialog.getByRole('button', { name: 'Remove second person' }),
  ).toBeVisible();
  await expect(
    dialog.getByLabel('people.B.birth_year', { exact: true }),
  ).toBeVisible();
  await expect(dialog.locator('.people-editor .person-section')).toHaveCount(2);
  await expect(
    dialog.locator('.people-editor .person-section>h3').nth(1),
  ).toHaveText('Person B');
  await dialog.getByLabel('people.B.birth_year', { exact: true }).fill('1990');
  await dialog.getByRole('button', { name: 'Remove second person' }).click();
  await expect(
    dialog.getByLabel('people.B.birth_year', { exact: true }),
  ).toHaveCount(0);
  await expect(
    dialog.getByRole('button', { name: 'Add a second person' }),
  ).toBeVisible();
  await next();
  await expect(
    dialog.getByText('Step 2 of 9: Spending budget', { exact: true }),
  ).toBeVisible();
  // The annual label drops the currency wording; the currency symbol
  // prefixes the money input (domicile was switched to China, so ¥).
  // Medical expenses moved to Step 3.
  await expect(
    dialog
      .locator('[data-config-field="budget.annual"] .field-label span')
      .first(),
  ).toHaveText('Annual (includes medical)');
  await expect(
    dialog.locator('[data-config-field="budget.annual"] .currency-symbol'),
  ).toHaveText('¥');
  await expect(
    dialog.getByLabel('budget.included_health', { exact: true }),
  ).toHaveCount(0);
  // Flex spending has its own row; cut and raise share the next row.
  await expect(
    dialog
      .locator('[data-config-field="budget.flex_enabled"] .field-label span')
      .first(),
  ).toHaveText('Flex spending enabled');
  const budgetBoxes = await Promise.all(
    ['annual', 'flex_enabled', 'flex_cut', 'flex_raise'].map((key) =>
      dialog.locator(`[data-config-field="budget.${key}"]`).boundingBox(),
    ),
  );
  expect(budgetBoxes[1]!.y).toBeGreaterThan(budgetBoxes[0]!.y);
  expect(budgetBoxes[1]!.x).toBeCloseTo(budgetBoxes[0]!.x, 0);
  expect(budgetBoxes[1]!.width).toBeCloseTo(budgetBoxes[0]!.width, 0);
  expect(budgetBoxes[2]!.y).toBeGreaterThan(budgetBoxes[1]!.y);
  expect(budgetBoxes[3]!.y).toBeCloseTo(budgetBoxes[2]!.y, 0);
  expect(budgetBoxes[2]!.x).toBeCloseTo(budgetBoxes[0]!.x, 0);
  // Cut and raise start greyed and disabled until flex spending is on.
  const flexCut = dialog.getByLabel('budget.flex_cut', { exact: true });
  const flexRaise = dialog.getByLabel('budget.flex_raise', { exact: true });
  await expect(flexCut).toBeDisabled();
  await expect(flexRaise).toBeDisabled();
  await expect(flexCut).toHaveCSS('color', 'rgb(113, 128, 119)');
  await dialog.getByLabel('budget.flex_enabled', { exact: true }).check();
  await expect(flexCut).toBeEnabled();
  await expect(flexRaise).toBeEnabled();
  await flexCut.fill('0.2');
  await flexRaise.fill('0.1');
  await dialog.getByLabel('budget.annual', { exact: true }).fill('250000');
  await next();
  await expect(
    dialog.getByText('Step 3 of 9: Medical costs', { exact: true }),
  ).toBeVisible();
  // Medical expenses lead Step 3, ahead of age growth, with the ¥ prefix.
  // Late-life care has no foldable section of its own.
  await expect(dialog.locator('details')).toHaveCount(0);
  await expect(dialog.getByText('Late life care', { exact: true })).toHaveCount(
    0,
  );
  const medicalBoxes = await Promise.all(
    [
      'budget.included_health',
      'medical.age_growth',
      'medical.shock_enabled',
      'medical.shock_prob_at_60',
      'medical.shock_prob_doubling_years',
      'medical.shock_median',
      'medical.late_life_care.enabled',
      'medical.late_life_care.start_age',
      'medical.late_life_care.monthly',
      'medical.late_life_care.real_growth',
    ].map((label) =>
      dialog.locator(`[data-config-field="${label}"]`).boundingBox(),
    ),
  );
  expect(medicalBoxes[0]!.y).toBeCloseTo(medicalBoxes[1]!.y, 0);
  expect(medicalBoxes[0]!.x).toBeLessThan(medicalBoxes[1]!.x);
  await expect(
    dialog.locator(
      '[data-config-field="budget.included_health"] .currency-symbol',
    ),
  ).toHaveText('¥');
  // Shock enabled has its own row; the shock fields follow on later rows.
  await expect(
    dialog
      .locator('[data-config-field="medical.shock_enabled"] .field-label span')
      .first(),
  ).toHaveText('Shock enabled');
  await expect(
    dialog
      .locator(
        '[data-config-field="medical.late_life_care.enabled"] .field-label span',
      )
      .first(),
  ).toHaveText('Late life care enabled');
  expect(medicalBoxes[2]!.y).toBeGreaterThan(medicalBoxes[1]!.y);
  expect(medicalBoxes[2]!.x).toBeCloseTo(medicalBoxes[0]!.x, 0);
  expect(medicalBoxes[3]!.y).toBeGreaterThan(medicalBoxes[2]!.y);
  expect(medicalBoxes[4]!.y).toBeCloseTo(medicalBoxes[3]!.y, 0);
  // Shock fields start enabled (shock defaults on); unchecking the toggle
  // greys and disables them, re-checking restores editing.
  const shockProb = dialog.getByLabel('medical.shock_prob_at_60', {
    exact: true,
  });
  await expect(shockProb).toBeEnabled();
  await dialog.getByLabel('medical.shock_enabled', { exact: true }).uncheck();
  await expect(shockProb).toBeDisabled();
  await expect(
    dialog.getByLabel('medical.shock_median', { exact: true }),
  ).toBeDisabled();
  await expect(shockProb).toHaveCSS('color', 'rgb(113, 128, 119)');
  await dialog.getByLabel('medical.shock_enabled', { exact: true }).check();
  await expect(shockProb).toBeEnabled();
  // Care enable has its own row; the care inputs below it stay visible but
  // start greyed and disabled until care is enabled.
  expect(medicalBoxes[6]!.y).toBeGreaterThan(medicalBoxes[5]!.y);
  expect(medicalBoxes[6]!.x).toBeCloseTo(medicalBoxes[0]!.x, 0);
  expect(medicalBoxes[7]!.y).toBeGreaterThan(medicalBoxes[6]!.y);
  expect(medicalBoxes[8]!.y).toBeCloseTo(medicalBoxes[7]!.y, 0);
  const careMonthly = dialog.getByLabel('medical.late_life_care.monthly', {
    exact: true,
  });
  await expect(careMonthly).toBeDisabled();
  await expect(careMonthly).toHaveCSS('color', 'rgb(113, 128, 119)');
  await dialog
    .getByLabel('medical.late_life_care.enabled', { exact: true })
    .check();
  await expect(careMonthly).toBeEnabled();
  await dialog
    .getByLabel('budget.included_health', { exact: true })
    .fill('38000');
  await dialog
    .getByLabel('medical.late_life_care.monthly', { exact: true })
    .fill('8000');
  await next();
  await expect(
    dialog.getByText('Step 4 of 9: Accounts', { exact: true }),
  ).toBeVisible();
  // Every balance carries a $ prefix, and no ownership wording remains
  // for this one-person household.
  for (let i = 0; i < 3; i++)
    await expect(
      dialog.locator(
        `[data-config-field="accounts[${i}].balance"] .currency-symbol`,
      ),
    ).toHaveText('$');
  await expect(
    dialog.getByText('Owned fully by Person A', { exact: true }),
  ).toHaveCount(0);
  await expect(
    dialog.getByText('Owned evenly by both people', { exact: true }),
  ).toHaveCount(0);
  // Attribution sits on its own row below the balance, three across.
  const balanceBox = await dialog
    .locator('[data-config-field="accounts[0].balance"]')
    .boundingBox();
  const allocGroup = dialog.locator('.allocation-inline').first();
  const allocBox = await allocGroup.boundingBox();
  expect(allocBox!.y).toBeGreaterThan(balanceBox!.y + balanceBox!.height);
  expect(allocBox!.x).toBeCloseTo(balanceBox!.x, 0);
  expect(allocBox!.width).toBeGreaterThan(balanceBox!.width);
  const allocLabels = await Promise.all(
    ['us_stocks', 'us_bonds', 'usd_cash'].map((key) =>
      dialog
        .getByLabel(`accounts[0].allocation.${key}`, { exact: true })
        .boundingBox(),
    ),
  );
  expect(allocLabels[1]!.y).toBeCloseTo(allocLabels[0]!.y, 0);
  expect(allocLabels[2]!.y).toBeCloseTo(allocLabels[0]!.y, 0);
  expect(allocLabels[0]!.x).toBeLessThan(allocLabels[1]!.x);
  expect(allocLabels[1]!.x).toBeLessThan(allocLabels[2]!.x);
  const widths = allocLabels.map((b) => b!.width);
  expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(2);
  // The pre-tax access checkboxes sit a full row gap below the
  // attribution row, matching the spacing elsewhere in the section.
  const preTaxAllocBox = await dialog
    .locator('.allocation-inline')
    .nth(2)
    .boundingBox();
  const ruleBox = await dialog
    .locator('[data-config-field="accounts[2].rule_of_55"]')
    .boundingBox();
  expect(ruleBox!.y - (preTaxAllocBox!.y + preTaxAllocBox!.height)).toBeCloseTo(
    20,
    0,
  );
  await dialog
    .getByLabel('accounts[0].balance', { exact: true })
    .fill('2000000');
  await dialog
    .getByLabel('accounts[1].balance', { exact: true })
    .fill('150000');
  await dialog
    .getByLabel('accounts[2].balance', { exact: true })
    .fill('900000');
  for (let i = 0; i < 3; i++) {
    await dialog
      .getByLabel(`accounts[${i}].allocation.us_stocks`, { exact: true })
      .fill('0.6');
    await dialog
      .getByLabel(`accounts[${i}].allocation.us_bonds`, { exact: true })
      .fill('0.3');
    await dialog
      .getByLabel(`accounts[${i}].allocation.usd_cash`, { exact: true })
      .fill('0.1');
  }
  await next();
  await expect(
    dialog.getByText('Step 5 of 9: Properties', { exact: true }),
  ).toBeVisible();
  // Last-resort sale is on by default.
  await expect(
    dialog.getByLabel('withdrawals.last_resort_property_sale', { exact: true }),
  ).toBeChecked();
  await dialog
    .getByRole('button', { name: 'Add properties', exact: true })
    .click();
  // The header doubles as the label: no separate label input exists
  // until the header is clicked, and the internal id is hidden.
  await expect(
    dialog.locator('[data-config-field="properties[0].label"]'),
  ).toHaveCount(0);
  const labelInput = dialog.getByLabel('properties[0].label', { exact: true });
  await expect(labelInput).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Property 1', exact: true }).click();
  await expect(labelInput).toBeVisible();
  await expect(labelInput).toHaveAttribute(
    'placeholder',
    'e.g. home address (optional)',
  );
  await expect(labelInput).toHaveValue('');
  await labelInput.fill('Riverside cottage');
  await labelInput.press('Enter');
  await expect(
    dialog.getByRole('button', { name: 'Riverside cottage', exact: true }),
  ).toBeVisible();
  await expect(labelInput).toHaveCount(0);
  // Clearing the label restores the fallback header.
  await dialog
    .getByRole('button', { name: 'Riverside cottage', exact: true })
    .click();
  await expect(labelInput).toBeVisible();
  await expect(labelInput).toHaveValue('Riverside cottage');
  await labelInput.fill('');
  await labelInput.press('Enter');
  await expect(
    dialog.getByRole('button', { name: 'Property 1', exact: true }),
  ).toBeVisible();
  // Escape cancels without saving; moving focus away commits.
  await dialog.getByRole('button', { name: 'Property 1', exact: true }).click();
  await expect(labelInput).toBeVisible();
  await labelInput.fill('Draft name');
  await labelInput.press('Escape');
  await expect(
    dialog.getByRole('button', { name: 'Property 1', exact: true }),
  ).toBeVisible();
  await expect(labelInput).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Property 1', exact: true }).click();
  await expect(labelInput).toBeVisible();
  await labelInput.fill('Blurred name');
  await dialog.getByText('Step 5 of 9: Properties', { exact: true }).click();
  await expect(
    dialog.getByRole('button', { name: 'Blurred name', exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByLabel('properties[0].id', { exact: true }),
  ).toHaveCount(0);
  await expect(
    dialog.getByLabel('properties[0].sell_liquid_years', { exact: true }),
  ).toHaveCount(0);
  await expect(
    dialog.getByLabel('properties[0].proceeds_account', { exact: true }),
  ).toHaveCount(0);
  const strategies = await dialog
    .locator('[data-config-field="properties[0].strategy"] select option')
    .evaluateAll((els) => els.map((el) => (el as HTMLOptionElement).value));
  expect(strategies).toEqual(['', 'hold', 'sell_year']);
  await expect(
    dialog.getByText('Sell when liquid below', { exact: true }),
  ).toHaveCount(0);
  // Sell year stays greyed out while the strategy is Hold.
  const sellYear = dialog.getByLabel('properties[0].sell_year', {
    exact: true,
  });
  await expect(sellYear).toBeDisabled();
  await expect(sellYear).toHaveCSS('color', 'rgb(113, 128, 119)');
  await dialog
    .getByLabel('properties[0].strategy', { exact: true })
    .selectOption('sell_year');
  await expect(sellYear).toBeEnabled();
  // Scrolled to the bottom, the buttons keep the same 24px below them
  // as the dialog's side padding; a scrolling flex dialog clips its own
  // bottom padding, so the inner stack must carry it.
  const footerGap = await dialog.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
    const box = el.getBoundingClientRect();
    const border = parseFloat(getComputedStyle(el).borderBottomWidth);
    const toolbar = el.querySelector('.modal-stack > .toolbar') as HTMLElement;
    const gap = box.bottom - border - toolbar.getBoundingClientRect().bottom;
    el.scrollTop = 0;
    return gap;
  });
  expect(footerGap).toBeCloseTo(24, 0);
  // Removing uses the trash icon, with no Remove text.
  const removeButton = dialog.getByRole('button', {
    name: 'Remove properties[0]',
    exact: true,
  });
  await expect(removeButton.locator('svg')).toHaveCount(1);
  await expect(removeButton).toHaveText('');
  await removeButton.click();
  await expect(
    dialog.getByLabel('properties[0].value', { exact: true }),
  ).toHaveCount(0);
  await next();
  await expect(
    dialog.getByText('Step 6 of 9: One-time costs', { exact: true }),
  ).toBeVisible();
  // One-time costs use the same header edit as properties: the name lives
  // in the header, there is no name or currency field, and the currency
  // is a dropdown prefix on the amount input.
  await dialog
    .getByRole('button', { name: 'Add one_time', exact: true })
    .click();
  await expect(
    dialog.locator('[data-config-field="one_time[0].name"]'),
  ).toHaveCount(0);
  await expect(
    dialog.locator('[data-config-field="one_time[0].currency"]'),
  ).toHaveCount(0);
  const nameInput = dialog.getByLabel('one_time[0].name', { exact: true });
  await expect(nameInput).toHaveCount(0);
  // A field-help popup opened by the Add click can cover the header
  // while the pointer rests on it; moving the pointer to the step
  // heading dismisses it first, as a user moving the mouse would.
  await dialog
    .getByText('Step 6 of 9: One-time costs', { exact: true })
    .hover();
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await dialog
    .getByRole('button', { name: 'One-time cost 1', exact: true })
    .click();
  await expect(nameInput).toBeVisible();
  await expect(nameInput).toHaveAttribute(
    'placeholder',
    'e.g. relocation, car purchase',
  );
  await nameInput.fill('Relocation');
  await nameInput.press('Enter');
  await expect(
    dialog.getByRole('button', { name: 'Relocation', exact: true }),
  ).toBeVisible();
  await expect(nameInput).toHaveCount(0);
  // Clearing the name restores the fallback header; naming it again
  // leaves a valid cost for the Review step.
  await dialog.getByRole('button', { name: 'Relocation', exact: true }).click();
  await nameInput.fill('');
  await nameInput.press('Enter');
  await expect(
    dialog.getByRole('button', { name: 'One-time cost 1', exact: true }),
  ).toBeVisible();
  await dialog
    .getByRole('button', { name: 'One-time cost 1', exact: true })
    .click();
  await nameInput.fill('Relocation');
  await nameInput.press('Enter');
  // Domicile was switched to China, so the new cost starts in CNY: the
  // amount prefix shows ¥, and switching it to USD shows $.
  const currencySelect = dialog.getByLabel('one_time[0].currency', {
    exact: true,
  });
  await expect(currencySelect).toHaveValue('CNY');
  const selectedSymbol = () =>
    currencySelect.evaluate(
      (el: HTMLSelectElement) => el.selectedOptions[0]?.text,
    );
  expect(await selectedSymbol()).toBe('¥');
  await currencySelect.selectOption('USD');
  expect(await selectedSymbol()).toBe('$');
  await currencySelect.selectOption('CNY');
  // The prefix sits inside the amount box: one 44px control, with the
  // dropdown left of the number input on the same row.
  const wrapperBox = await dialog
    .locator('[data-config-field="one_time[0].amount"] .currency-field')
    .boundingBox();
  const selectBox = await currencySelect.boundingBox();
  const amountBox = await dialog
    .getByLabel('one_time[0].amount', { exact: true })
    .boundingBox();
  expect(Math.round(wrapperBox!.height)).toBe(44);
  // The prefix stays narrow — a symbol plus the dropdown arrow — instead
  // of taking half the box, leaving the amount input most of the room.
  expect(selectBox!.width).toBeLessThanOrEqual(72);
  expect(selectBox!.width).toBeLessThan(amountBox!.width);
  expect(selectBox!.x).toBeLessThan(amountBox!.x);
  expect(
    Math.abs(
      selectBox!.y +
        selectBox!.height / 2 -
        (amountBox!.y + amountBox!.height / 2),
    ),
  ).toBeLessThanOrEqual(2);
  await dialog.getByLabel('one_time[0].amount', { exact: true }).fill('5000');
  await expect(
    dialog.getByLabel('one_time[0].year', { exact: true }),
  ).toHaveValue('2030');
  await next();
  await expect(
    dialog.getByText('Step 7 of 9: Markets', { exact: true }),
  ).toBeVisible();
  // A blank draft samples full history: the era selector shows Full
  // history even though no window is stored yet, and the advanced
  // groups start open.
  await expect(dialog.getByLabel('market.era', { exact: true })).toHaveValue(
    'full',
  );
  for (const id of ['markets', 'inflation', 'fx'])
    await expect(
      dialog.locator(`section[aria-labelledby="market-group-${id}"] details`),
    ).toHaveJSProperty('open', true);
  await next();
  await expect(
    dialog.getByText('Step 8 of 9: Simulation', { exact: true }),
  ).toBeVisible();
  // Fill immediately after the step appears: a prefill that lands after this
  // edit must not be clobbered by the edit's stale draft (see start_year race).
  await dialog.getByLabel('simulation.n_paths', { exact: true }).fill('2');
  await expect(
    dialog.getByLabel('simulation.start_year', { exact: true }),
  ).toHaveValue(String(new Date().getFullYear()));
  await next();
  await expect(
    dialog.getByText('Step 9 of 9: Review', { exact: true }),
  ).toBeVisible();
  await expect(dialog.getByText(/1 person household/)).toBeVisible();
  await dialog
    .getByRole('button', { name: 'Start simulation', exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByTestId('run-status')).toContainText(
    'Completed 2 paths',
    { timeout: 60_000 },
  );
  await expect(page.getByTestId('success-probability')).toBeVisible();
});

test('M02 M10: power-mode Step 1 keeps two-column rows at 900px', async ({
  page,
}) => {
  // At tablet width the modal keeps two columns: birth + citizen share a
  // row, Annual + Start age share a row, and Cola sits alone on the next
  // row covering only the left half.
  await page.setViewportSize({ width: 900, height: 720 });
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Start guided setup →', exact: true })
    .click();
  const mode = page.getByRole('dialog', {
    name: 'Choose a setup mode',
    exact: true,
  });
  await mode.locator('[data-mode="advanced"]').click();
  const dialog = page.getByRole('dialog', { name: 'Power setup', exact: true });
  await expect(
    dialog.getByText('Step 1 of 9: Household & people', { exact: true }),
  ).toBeVisible();
  const centerY = async (locator: ReturnType<typeof page.locator>) => {
    const box = await locator.boundingBox();
    expect(box).not.toBeNull();
    return box!.y + box!.height / 2;
  };
  const birthInput = dialog.getByLabel('people.A.birth_year', { exact: true });
  const citizenInput = dialog.getByLabel('people.A.us_citizen', {
    exact: true,
  });
  expect(
    Math.abs((await centerY(birthInput)) - (await centerY(citizenInput))),
  ).toBeLessThanOrEqual(2);
  const citizenBox = await citizenInput.boundingBox();
  const citizenLabelBox = await dialog
    .locator('[data-config-field="people.A.us_citizen"] .field-label span')
    .boundingBox();
  expect(citizenBox!.x).toBeLessThan(citizenLabelBox!.x);
  const annualInput = dialog.getByLabel('people.A.pension.annual', {
    exact: true,
  });
  const startAgeInput = dialog.getByLabel('people.A.pension.start_age', {
    exact: true,
  });
  const colaInput = dialog.getByLabel('people.A.pension.cola', { exact: true });
  expect(
    Math.abs((await centerY(annualInput)) - (await centerY(startAgeInput))),
  ).toBeLessThanOrEqual(2);
  expect(await centerY(colaInput)).toBeGreaterThan(
    await centerY(startAgeInput),
  );
  const annualBox = await dialog
    .locator('[data-config-field="people.A.pension.annual"]')
    .boundingBox();
  const colaBox = await dialog
    .locator('[data-config-field="people.A.pension.cola"]')
    .boundingBox();
  expect(colaBox!.x).toBeCloseTo(annualBox!.x, 0);
  expect(colaBox!.width).toBeCloseTo(annualBox!.width, 0);
  // Inputs fill their cells at tablet width too.
  const fillRight = async (fieldSel: string, label: string) => {
    const fieldBox = await dialog.locator(fieldSel).boundingBox();
    const inputBox = await dialog
      .getByLabel(label, { exact: true })
      .boundingBox();
    expect(
      Math.abs(fieldBox!.x + fieldBox!.width - (inputBox!.x + inputBox!.width)),
    ).toBeLessThanOrEqual(1);
  };
  await fillRight(
    '[data-config-field="people.A.birth_year"]',
    'people.A.birth_year',
  );
  const annualWrapBox900 = await dialog
    .locator('[data-config-field="people.A.pension.annual"] .currency-field')
    .boundingBox();
  const annualFieldBox900 = await dialog
    .locator('[data-config-field="people.A.pension.annual"]')
    .boundingBox();
  expect(
    Math.abs(
      annualFieldBox900!.x +
        annualFieldBox900!.width -
        (annualWrapBox900!.x + annualWrapBox900!.width),
    ),
  ).toBeLessThanOrEqual(1);
  // Info button right after the label, no wrap, shared right edge at 900px.
  const birthFieldBox = await dialog
    .locator('[data-config-field="people.A.birth_year"]')
    .boundingBox();
  expect(birthFieldBox!.height).toBeLessThanOrEqual(48);
  const birthSpanBox = await dialog
    .locator('[data-config-field="people.A.birth_year"] .field-label span')
    .first()
    .boundingBox();
  const birthInfoBox = await dialog
    .locator('[data-config-field="people.A.birth_year"] button.field-info')
    .boundingBox();
  expect(birthInfoBox!.x - (birthSpanBox!.x + birthSpanBox!.width)).toBeCloseTo(
    8,
    0,
  );
  const rightOf = async (label: string) => {
    const box = await dialog.getByLabel(label, { exact: true }).boundingBox();
    return box!.x + box!.width;
  };
  const colaFieldBox = await dialog
    .locator('[data-config-field="people.A.pension.cola"]')
    .boundingBox();
  const rights900 = await Promise.all([
    rightOf('people.domicile'),
    rightOf('people.A.birth_year'),
    Promise.resolve(annualFieldBox900!.x + annualFieldBox900!.width),
    Promise.resolve(colaFieldBox!.x + colaFieldBox!.width),
  ]);
  expect(Math.max(...rights900) - Math.min(...rights900)).toBeLessThanOrEqual(
    2,
  );
});

test('M02 M10: power-mode Steps 2-8 share Step 1 one-row field styling', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Start guided setup →', exact: true })
    .click();
  const mode = page.getByRole('dialog', {
    name: 'Choose a setup mode',
    exact: true,
  });
  await mode.locator('[data-mode="advanced"]').click();
  const dialog = page.getByRole('dialog', { name: 'Power setup', exact: true });
  await expect(
    dialog.getByText('Step 1 of 9: Household & people', { exact: true }),
  ).toBeVisible();
  const next = () =>
    dialog.getByRole('button', { name: 'Next', exact: false }).click();
  // Every visible field on the step uses Step 1's presentation: one row,
  // 44px/16px input flexed to the cell edge, info button 8px after the
  // label, and checkbox fields as bordered boxes with the box first.
  const assertStepFields = async () => {
    const failures = await dialog.evaluate(() => {
      const bad: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>(
        '[data-config-field]',
      )) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const path = el.getAttribute('data-config-field') ?? '?';
        const cs = getComputedStyle(el);
        const input = el.querySelector('input, select, textarea');
        if (!input) {
          bad.push(`${path}: no input`);
          continue;
        }
        const ir = input.getBoundingClientRect();
        const ics = getComputedStyle(input);
        const isCheck = (input as HTMLInputElement).type === 'checkbox';
        if (isCheck) {
          if (cs.borderTopWidth !== '1px')
            bad.push(
              `${path}: checkbox field has no box border (${cs.borderTopWidth})`,
            );
          if (Math.round(ir.width) !== 22 || Math.round(ir.height) !== 22)
            bad.push(
              `${path}: checkbox is ${ir.width}x${ir.height}, want 22x22`,
            );
          const heading = el.querySelector('.field-heading');
          const hr = heading?.getBoundingClientRect();
          if (!hr || ir.x >= hr.x)
            bad.push(`${path}: checkbox is not before its label`);
          if (ics.appearance !== 'none')
            bad.push(`${path}: checkbox appearance is ${ics.appearance}`);
        } else {
          if (cs.flexDirection !== 'row')
            bad.push(`${path}: field direction is ${cs.flexDirection}`);
          if (cs.flexWrap !== 'nowrap')
            bad.push(`${path}: field wraps (${cs.flexWrap})`);
          // A currency wrapper is the visible control box: its 1px border
          // sits around a 42px input for a 44px total, so measure the
          // wrapper instead of the inner input.
          const currencyEdge = el.querySelector('.currency-field');
          const controlRect = currencyEdge?.getBoundingClientRect() ?? ir;
          if (Math.round(controlRect.height) !== 44)
            bad.push(`${path}: control height ${controlRect.height}, want 44`);
          if (ics.fontSize !== '16px')
            bad.push(`${path}: input font ${ics.fontSize}, want 16px`);
          const edge = currencyEdge ?? el.querySelector('.seed-control');
          const er = edge?.getBoundingClientRect() ?? ir;
          if (Math.abs(r.right - er.right) > 1)
            bad.push(
              `${path}: input right ${er.right} != field right ${r.right}`,
            );
        }
        const span = el.querySelector('.field-label span');
        const info = el.querySelector('button.field-info');
        if (span && info) {
          const sr = span.getBoundingClientRect();
          const br = info.getBoundingClientRect();
          if (Math.abs(br.x - (sr.x + sr.width) - 8) > 1)
            bad.push(`${path}: info gap ${br.x - (sr.x + sr.width)}, want 8`);
        }
        if (Math.round(r.height) !== 44)
          bad.push(`${path}: field height ${r.height}, want 44`);
      }
      return bad;
    });
    expect(failures).toEqual([]);
  };
  await next();
  await expect(
    dialog.getByText('Step 2 of 9: Spending budget', { exact: true }),
  ).toBeVisible();
  await assertStepFields();
  await dialog.getByLabel('budget.flex_enabled', { exact: true }).check();
  await expect(
    dialog.locator('[data-config-field="budget.flex_enabled"]'),
  ).toHaveCSS('background-color', 'rgb(232, 239, 227)');
  await next();
  await expect(
    dialog.getByText('Step 3 of 9: Medical costs', { exact: true }),
  ).toBeVisible();
  await assertStepFields();
  await next();
  await expect(
    dialog.getByText('Step 4 of 9: Accounts', { exact: true }),
  ).toBeVisible();
  await assertStepFields();
  await next();
  await expect(
    dialog.getByText('Step 5 of 9: Properties', { exact: true }),
  ).toBeVisible();
  await assertStepFields();
  await dialog
    .getByRole('button', { name: 'Add properties', exact: true })
    .click();
  await expect(
    dialog.getByLabel('properties[0].value', { exact: true }),
  ).toBeVisible();
  await assertStepFields();
  await next();
  await expect(
    dialog.getByText('Step 6 of 9: One-time costs', { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByRole('button', { name: 'Add one_time', exact: true }),
  ).toBeVisible();
  await next();
  await expect(
    dialog.getByText('Step 7 of 9: Markets', { exact: true }),
  ).toBeVisible();
  await assertStepFields();
  await next();
  await expect(
    dialog.getByText('Step 8 of 9: Simulation', { exact: true }),
  ).toBeVisible();
  await assertStepFields();
});

test('M02 M10: power-mode fields show schema defaults as values', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Start guided setup →', exact: true })
    .click();
  const mode = page.getByRole('dialog', {
    name: 'Choose a setup mode',
    exact: true,
  });
  await mode.locator('[data-mode="advanced"]').click();
  const dialog = page.getByRole('dialog', { name: 'Power setup', exact: true });
  await expect(
    dialog.getByText('Step 1 of 9: Household & people', { exact: true }),
  ).toBeVisible();
  // Pension defaults: annual 0 in the field, Cola checked (default true).
  await expect(
    dialog.getByLabel('people.A.pension.annual', { exact: true }),
  ).toHaveValue('0');
  await expect(
    dialog.getByLabel('people.A.pension.cola', { exact: true }),
  ).toBeChecked();
  const next = () =>
    dialog.getByRole('button', { name: 'Next', exact: false }).click();
  await next();
  await expect(
    dialog.getByText('Step 2 of 9: Spending budget', { exact: true }),
  ).toBeVisible();
  await expect(dialog.getByLabel('budget.annual', { exact: true })).toHaveValue(
    '0',
  );
  // US domicile prefixes the money input with $.
  await expect(
    dialog.locator('[data-config-field="budget.annual"] .currency-symbol'),
  ).toHaveText('$');
  await next();
  await expect(
    dialog.getByText('Step 3 of 9: Medical costs', { exact: true }),
  ).toBeVisible();
  // Medical expenses moved here: default 0 with the $ prefix.
  await expect(
    dialog.getByLabel('budget.included_health', { exact: true }),
  ).toHaveValue('0');
  await expect(
    dialog.locator(
      '[data-config-field="budget.included_health"] .currency-symbol',
    ),
  ).toHaveText('$');
  const ageGrowth = dialog.getByLabel('medical.age_growth', { exact: true });
  await expect(ageGrowth).toHaveValue('0.04');
  await expect(
    dialog.getByLabel('medical.shock_enabled', { exact: true }),
  ).toBeChecked();
  // Shock defaults on, so its fields are editable; care defaults off, so
  // its inputs stay visible but greyed and disabled.
  await expect(
    dialog.getByLabel('medical.shock_median', { exact: true }),
  ).toBeEnabled();
  const careStart = dialog.getByLabel('medical.late_life_care.start_age', {
    exact: true,
  });
  await expect(careStart).toHaveValue('85');
  await expect(careStart).toBeDisabled();
  await expect(careStart).toHaveCSS('color', 'rgb(113, 128, 119)');
  // Clearing a defaulted field leaves it blank while editing; blurring
  // restores the default value.
  await ageGrowth.fill('');
  await ageGrowth.evaluate((el) => el.blur());
  await expect(ageGrowth).toHaveValue('0.04');
  await next();
  await expect(
    dialog.getByText('Step 4 of 9: Accounts', { exact: true }),
  ).toBeVisible();
  // Fields without a default stay blank with the Required placeholder.
  await expect(
    dialog.getByLabel('accounts[0].balance', { exact: true }),
  ).toHaveValue('');
  await next();
  await next();
  await next();
  await expect(
    dialog.getByText('Step 7 of 9: Markets', { exact: true }),
  ).toBeVisible();
  const outlook = dialog.getByLabel('market.outlook_shift', { exact: true });
  await expect(outlook).toHaveValue('0');
  await expect(
    dialog.getByLabel('market.fx_mode', { exact: true }),
  ).toHaveValue('ppp');
  // The stock yield default is rounded to five decimal places.
  await expect(
    dialog.getByLabel('market.income_yield_us_stocks', { exact: true }),
  ).toHaveValue('0.01336');
  // The FX mode option reads PPP, not Ppp.
  await expect(
    dialog.locator('[data-config-field="market.fx_mode"] option[value="ppp"]'),
  ).toHaveText('PPP');
  // Clearing a field that holds a non-default value and retyping works:
  // the default must not snap back mid-edit.
  await outlook.fill('0.05');
  await outlook.fill('');
  await outlook.pressSequentially('-0.02');
  await expect(outlook).toHaveValue('-0.02');
  await next();
  await expect(
    dialog.getByText('Step 8 of 9: Simulation', { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByLabel('simulation.n_paths', { exact: true }),
  ).toHaveValue('5000');
  // A fresh Power setup draws a random seed instead of the fixed 42.
  const seed = Number(
    await dialog.getByLabel('simulation.seed', { exact: true }).inputValue(),
  );
  expect(Number.isInteger(seed)).toBe(true);
  expect(seed).toBeGreaterThanOrEqual(0);
  expect(seed).toBeLessThanOrEqual(4294967295);
});

test('M02 M10: power-mode seed is redrawn on page reload', async ({ page }) => {
  const seedOnStep8 = async () => {
    await page
      .getByRole('button', { name: 'Start guided setup →', exact: true })
      .click();
    const mode = page.getByRole('dialog', {
      name: 'Choose a setup mode',
      exact: true,
    });
    await mode.locator('[data-mode="advanced"]').click();
    const dialog = page.getByRole('dialog', {
      name: 'Power setup',
      exact: true,
    });
    const next = () =>
      dialog.getByRole('button', { name: 'Next', exact: false }).click();
    for (let i = 0; i < 7; i++) await next();
    await expect(
      dialog.getByText('Step 8 of 9: Simulation', { exact: true }),
    ).toBeVisible();
    return Number(
      await dialog.getByLabel('simulation.seed', { exact: true }).inputValue(),
    );
  };
  await page.goto('/');
  const first = await seedOnStep8();
  await page.reload();
  const second = await seedOnStep8();
  expect(second).not.toBe(first);
});

test('M02 M10: blank configurations start with US domicile, current-year horizon, and a random seed', async ({
  page,
}) => {
  const seedFromBlank = async () => {
    await page
      .getByRole('button', { name: 'Build from a blank configuration' })
      .click();
    await page.getByRole('button', { name: 'Simulation', exact: true }).click();
    await expect(
      page.getByLabel('simulation.start_year', { exact: true }),
    ).toHaveValue(String(new Date().getFullYear()));
    await expect(
      page.getByLabel('simulation.max_age', { exact: true }),
    ).toHaveValue('110');
    const seed = Number(
      await page.getByLabel('simulation.seed', { exact: true }).inputValue(),
    );
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThanOrEqual(4294967295);
    await page.getByRole('button', { name: 'People', exact: true }).click();
    await expect(
      page.getByLabel('people.domicile', { exact: true }),
    ).toHaveValue('US');
    return seed;
  };
  await page.goto('/');
  const first = await seedFromBlank();
  await page.reload();
  const second = await seedFromBlank();
  expect(second).not.toBe(first);
});

test('M02 M10: power-mode modal stacks one input per row at 390px', async ({
  page,
}) => {
  // Mobile: every input element gets its own row, on Step 1 and on the
  // generic grid of Step 2.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Start guided setup →', exact: true })
    .click();
  const mode = page.getByRole('dialog', {
    name: 'Choose a setup mode',
    exact: true,
  });
  await mode.locator('[data-mode="advanced"]').click();
  const dialog = page.getByRole('dialog', { name: 'Power setup', exact: true });
  await expect(
    dialog.getByText('Step 1 of 9: Household & people', { exact: true }),
  ).toBeVisible();
  const boxes = async (selectors: string[]) =>
    Promise.all(
      selectors.map(async (sel) => {
        const box = await dialog.locator(sel).boundingBox();
        expect(box).not.toBeNull();
        return box!;
      }),
    );
  const step1 = await boxes([
    '[data-config-field="people.A.birth_year"]',
    '[data-config-field="people.A.us_citizen"]',
    '[data-config-field="people.A.pension.annual"]',
    '[data-config-field="people.A.pension.start_age"]',
    '[data-config-field="people.A.pension.cola"]',
  ]);
  for (let i = 1; i < step1.length; i++)
    expect(step1[i].y).toBeGreaterThan(step1[i - 1].y + step1[i - 1].height);
  const citizenBox = await dialog
    .getByLabel('people.A.us_citizen', { exact: true })
    .boundingBox();
  const citizenLabelBox = await dialog
    .locator('[data-config-field="people.A.us_citizen"] .field-label span')
    .boundingBox();
  expect(citizenBox!.x).toBeLessThan(citizenLabelBox!.x);
  // The birth row never wraps on mobile either: one 44px-tall row, with
  // the info button right after the label.
  const birthFieldBox = await dialog
    .locator('[data-config-field="people.A.birth_year"]')
    .boundingBox();
  expect(birthFieldBox!.height).toBeLessThanOrEqual(48);
  const birthSpanBox = await dialog
    .locator('[data-config-field="people.A.birth_year"] .field-label span')
    .first()
    .boundingBox();
  const birthInfoBox = await dialog
    .locator('[data-config-field="people.A.birth_year"] button.field-info')
    .boundingBox();
  expect(birthInfoBox!.x - (birthSpanBox!.x + birthSpanBox!.width)).toBeCloseTo(
    8,
    0,
  );
  // The person and pension section outlines stay visible on mobile: the
  // cards keep their border and padding, so nested right edges step inward
  // by one card inset (16px padding + 1px border) per nesting level.
  await expect(dialog.locator('.people-editor .person-section')).toHaveCSS(
    'border-top-width',
    '1px',
  );
  await expect(dialog.locator('.people-editor .pension-section')).toHaveCSS(
    'border-top-width',
    '1px',
  );
  // The long COLA label wraps instead of pushing its info button past the
  // pension outline.
  const pensionBox = await dialog
    .locator('.people-editor .pension-section')
    .boundingBox();
  const colaInfoBox = await dialog
    .locator('[data-config-field="people.A.pension.cola"] button.field-info')
    .boundingBox();
  expect(colaInfoBox!.x + colaInfoBox!.width).toBeLessThanOrEqual(
    pensionBox!.x + pensionBox!.width - 16,
  );
  const rightOf = async (label: string) => {
    const box = await dialog.getByLabel(label, { exact: true }).boundingBox();
    return box!.x + box!.width;
  };
  const colaFieldBox = await dialog
    .locator('[data-config-field="people.A.pension.cola"]')
    .boundingBox();
  const annualFieldBox390 = await dialog
    .locator('[data-config-field="people.A.pension.annual"]')
    .boundingBox();
  const rights390 = await Promise.all([
    rightOf('people.domicile'),
    rightOf('people.A.birth_year'),
    Promise.resolve(annualFieldBox390!.x + annualFieldBox390!.width),
    Promise.resolve(colaFieldBox!.x + colaFieldBox!.width),
  ]);
  expect(Math.abs(rights390[0] - rights390[1] - 17)).toBeLessThanOrEqual(2);
  expect(Math.abs(rights390[1] - rights390[2] - 17)).toBeLessThanOrEqual(2);
  expect(Math.abs(rights390[2] - rights390[3])).toBeLessThanOrEqual(2);
  await dialog.getByRole('button', { name: 'Next', exact: false }).click();
  await expect(
    dialog.getByText('Step 2 of 9: Spending budget', { exact: true }),
  ).toBeVisible();
  const step2 = await boxes([
    '[data-config-field="budget.annual"]',
    '[data-config-field="budget.flex_enabled"]',
  ]);
  expect(step2[1].y).toBeGreaterThan(step2[0].y + step2[0].height);
  // The budget input sits in the bordered currency wrapper, so the
  // wrapper's right edge meets the field's.
  const budgetFieldBox = await dialog
    .locator('[data-config-field="budget.annual"]')
    .boundingBox();
  const budgetWrapBox = await dialog
    .locator('[data-config-field="budget.annual"] .currency-field')
    .boundingBox();
  expect(
    Math.abs(
      budgetFieldBox!.x +
        budgetFieldBox!.width -
        (budgetWrapBox!.x + budgetWrapBox!.width),
    ),
  ).toBeLessThanOrEqual(1);
  // Flex fields stack one per row on mobile.
  const flexStack = await boxes([
    '[data-config-field="budget.flex_enabled"]',
    '[data-config-field="budget.flex_cut"]',
    '[data-config-field="budget.flex_raise"]',
  ]);
  expect(flexStack[1].y).toBeGreaterThan(flexStack[0].y + flexStack[0].height);
  expect(flexStack[2].y).toBeGreaterThan(flexStack[1].y + flexStack[1].height);
  await dialog.getByRole('button', { name: 'Next', exact: false }).click();
  await expect(
    dialog.getByText('Step 3 of 9: Medical costs', { exact: true }),
  ).toBeVisible();
  // Step 3 stacks one input per row on mobile, with no foldable care
  // section, and the care inputs visible but disabled until enabled.
  await expect(dialog.locator('details')).toHaveCount(0);
  const step3 = await boxes([
    '[data-config-field="budget.included_health"]',
    '[data-config-field="medical.age_growth"]',
    '[data-config-field="medical.shock_enabled"]',
    '[data-config-field="medical.shock_prob_at_60"]',
    '[data-config-field="medical.shock_prob_doubling_years"]',
    '[data-config-field="medical.shock_median"]',
    '[data-config-field="medical.late_life_care.enabled"]',
    '[data-config-field="medical.late_life_care.start_age"]',
    '[data-config-field="medical.late_life_care.monthly"]',
    '[data-config-field="medical.late_life_care.real_growth"]',
  ]);
  for (let i = 1; i < step3.length; i++)
    expect(step3[i].y).toBeGreaterThan(step3[i - 1].y + step3[i - 1].height);
  await expect(
    dialog.getByLabel('medical.late_life_care.monthly', { exact: true }),
  ).toBeDisabled();
  await dialog.getByRole('button', { name: 'Next', exact: false }).click();
  await expect(
    dialog.getByText('Step 4 of 9: Accounts', { exact: true }),
  ).toBeVisible();
  // On mobile the balance keeps its $ prefix and the attribution inputs
  // stack one per row below it.
  await expect(
    dialog.locator(
      '[data-config-field="accounts[0].balance"] .currency-symbol',
    ),
  ).toHaveText('$');
  const allocStack = await Promise.all(
    ['us_stocks', 'us_bonds', 'usd_cash'].map((key) =>
      dialog
        .getByLabel(`accounts[0].allocation.${key}`, { exact: true })
        .boundingBox(),
    ),
  );
  expect(allocStack[1]!.y).toBeGreaterThan(
    allocStack[0]!.y + allocStack[0]!.height,
  );
  expect(allocStack[2]!.y).toBeGreaterThan(
    allocStack[1]!.y + allocStack[1]!.height,
  );
});
