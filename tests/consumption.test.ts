import { it, expect } from 'vitest';
import {
  lateLifeCareCost,
  medicalCost,
  consumption,
} from '../src/model/consumption';
import {
  createControlDraft,
  createExampleDraft,
} from '../src/config/constructors';
import {
  validateScenario,
  parseScenario,
  exportScenario,
} from '../src/config/config';
import { references } from '../src/reference/bundle';
import { generateMarketPath } from '../src/model/market';
import { makeDraws } from '../src/model/rng';
import {
  initialAccount,
  withdrawAccount,
  emptyIncome,
  growAccount,
  rebalance,
  conversion,
} from '../src/model/accounts';
import type {
  ScenarioConfig,
  BrokerageAccountConfig,
  DraftScenario,
} from '../src/model/types';
function control(): ScenarioConfig {
  const r = validateScenario(createControlDraft(), references);
  if (!r.ok) throw new Error(JSON.stringify(r.issues));
  return r.value.scenario;
}
it('M05 uses the single 38k budget medical base once and rejects retired People base inputs', () => {
  const s = control(),
    m = generateMarketPath(s, references, 0),
    c = consumption(s, 0, m, makeDraws(s, 0, 71));
  expect(c.included).toBe(250000);
  expect(c.health).toBe(38000);
  expect(c.medical).toBe(38000);
  expect(c.spend_excluding_medical).toBe(212000);
  expect(c.medical_total).toBe(38000);
  expect(c.spend_excluding_medical + c.medical_total).toBe(c.total);
  const d = createControlDraft(),
    old = {
      ...d,
      people: {
        domicile: d.people!.domicile,
        A: { ...d.people!.A, medical_base_cny: 38000 },
        B: { ...d.people!.B, medical_base_cny: 38000 },
      },
    };
  const p = parseScenario(exportScenario(old as DraftScenario));
  expect(p.ok).toBe(false);
  if (p.ok) throw new Error('legacy medical bases should fail');
  expect(
    p.issues.some(
      (i) => i.code === 'unknown_key' && i.path === 'people.A.medical_base_cny',
    ),
  ).toBe(true);
});
it('M05 removed budget-scope and shock-size keys are rejected as unknown', () => {
  const d = createControlDraft(),
    old = {
      ...d,
      medical: { ...d.medical, shock_sigma_log: 1 },
      one_time: [
        {
          name: 'old',
          year: 2030,
          amount: 100,
          currency: 'CNY',
          budget_scope: 'included',
        },
      ],
    };
  const p = parseScenario(exportScenario(old as DraftScenario));
  expect(p.ok).toBe(false);
  if (p.ok) throw new Error('removed scope keys should fail');
  expect(
    p.issues.some(
      (i) => i.code === 'unknown_key' && i.path === 'medical.shock_sigma_log',
    ),
  ).toBe(true);
  expect(
    p.issues.some(
      (i) => i.code === 'unknown_key' && i.path === 'one_time.0.budget_scope',
    ),
  ).toBe(true);
});
it('M05 medical age/price growth matches independent oracles', () => {
  const s = control();
  const config = {
    ...s.medical,
    age_growth: 0.04,
    shock_enabled: true,
    shock_median: 50000,
    shock_prob_at_60: 0.02,
  };
  const med = medicalCost(38000, 61, 60, 1.06, config, 0.8);
  expect(med.recurring).toBeCloseTo(41891.2, 8);
  expect(med.shock).toBe(0);
});
it('late-life care starts when the earliest-born person reaches the start age, continues through the horizon and is always additional medical spending', () => {
  const d = createControlDraft();
  d.people!.B!.birth_year = 1984;
  d.medical!.late_life_care = {
    enabled: true,
    start_age: 42,
    monthly: 1000,
    real_growth: 0,
  };
  d.market!.medical_excess_inflation = 0.02;
  const v = validateScenario(d, references);
  expect(v.ok).toBe(true);
  if (!v.ok) throw new Error(JSON.stringify(v.issues));
  const s = v.value.scenario as ScenarioConfig,
    m = generateMarketPath(s, references, 0),
    draws = makeDraws(s, 0, 50);
  const first = consumption(s, 0, m, draws);
  expect(first.late_life_care).toBe(12000);
  expect(first.spend_excluding_medical).toBe(212000);
  expect(first.medical_total).toBe(50000);
  expect(first.included).toBe(250000);
  expect(first.additional).toBe(12000);
  expect(first.total).toBe(262000);
  expect(first.excess).toBe(0);
  expect(consumption(s, 1, m, draws).late_life_care).toBeCloseTo(12720, 8);
  expect(consumption(s, 2, m, draws).late_life_care).toBeCloseTo(13483.2, 8);
  s.people.B!.birth_year = 1990;
  expect(consumption(s, 0, m, draws).late_life_care).toBe(0);
  expect(
    lateLifeCareCost(
      { ...s.medical.late_life_care, real_growth: 0.02 },
      42,
      1.06,
      1,
    ),
  ).toBeCloseTo(12974.4, 8);
  s.medical.late_life_care.enabled = false;
  expect(consumption(s, 1, m, draws).late_life_care).toBe(0);
});
it('M05 average basis, reinvested income, taxable rebalancing and FX funding reconcile', () => {
  const s = control(),
    config = {
      ...s.accounts[0],
      balance: 100000,
      allocation: { us_stocks: 1 },
    } as BrokerageAccountConfig;
  const a = initialAccount(config, false),
    income = { A: emptyIncome(), B: emptyIncome() };
  // Seasoned holdings: value exceeds basis before the sale.
  a.bases.us_stocks = 60000;
  withdrawAccount(config, a, 50000, s, 2026, income);
  expect(income.A.cap_gain).toBe(20000);
  expect(a.bases.us_stocks).toBe(30000);
  expect(a.values.us_stocks).toBe(50000);
  const b = initialAccount(config, false),
    p = generateMarketPath(s, references, 0);
  b.bases.us_stocks = 60000;
  p.us_stocks[0] = 0.1;
  s.market.income_yield_us_stocks = 0.013;
  growAccount(config, b, s, 0, p, income);
  expect(b.values.us_stocks).toBeCloseTo(110000, 8);
  expect(b.bases.us_stocks).toBe(61300);
  const c = initialAccount(
    {
      ...config,
      allocation: { us_stocks: 0.5, us_bonds: 0.5 },
    },
    false,
  );
  c.values = { us_stocks: 60000, us_bonds: 50000 };
  c.bases = { us_stocks: 30000, us_bonds: 30000 };
  expect(
    rebalance(
      { ...config, allocation: { us_stocks: 0.5, us_bonds: 0.5 } },
      c,
      income,
    ),
  ).toBe(2500);
  expect(c.bases).toMatchObject({ us_stocks: 27500, us_bonds: 35000 });
  expect(conversion(6690, 1000, 6.69, 0.003)).toEqual({
    usd_to_fund_cny: 1003.0090270812436,
    cny_to_fund_usd: 6710.07,
  });
});
