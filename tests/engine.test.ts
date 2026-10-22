import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  parseScenario,
  validateScenario,
  makeRunRequest,
  exportScenario,
} from '../src/config/config';
import { references } from '../src/reference/bundle';
import {
  fixtureReferences,
  arithmeticReferences,
} from '../verification/market-tapes';
import { replayPathLedger, simulatePath } from '../src/model/engine';
import { LEDGER_FIELDS, LI, FI, II, BI } from '../src/model/layout';
import {
  createExampleDraft,
  createHouseholdDraft,
  createControlDraft,
} from '../src/config/constructors';
import {
  initialProperty,
  propertyCash,
  mortgagePayment,
  closingQuote,
} from '../src/model/property';
import { emptyIncome } from '../src/model/accounts';
import { generateMarketPath } from '../src/model/market';
import { hashObject } from '../src/model/canonical';
import { ledgerValue } from '../src/model/ledger-report';
import type { DraftScenario } from '../src/model/types';
function request(name: string) {
  const refs = fixtureReferences(name),
    p = parseScenario(
      readFileSync(`verification/fixtures/${name}.toml`, 'utf8'),
    );
  if (!p.ok) throw new Error(JSON.stringify(p.issues));
  const v = validateScenario(p.value, refs);
  if (!v.ok) throw new Error(JSON.stringify(v.issues));
  return makeRunRequest(v.value.scenario, refs);
}
describe('M07–M08 real model year loop', () => {
  for (const [name, balance] of [
    ['control-pv', 2390572.9770677146],
    ['control-fx', 1868460.3886397605],
  ] as const) {
    it(`${name}: 50 beginning-year payments, ages 40–89 and no false depletion`, () => {
      const refs = fixtureReferences(name),
        req = request(name),
        r = replayPathLedger(req, refs, 0),
        c = simulatePath(req, refs, 0);
      expect(req.scenario.accounts[0].balance).toBe(balance);
      expect(r.years).toHaveLength(50);
      expect(c.summary.integers[II.active_years]).toBe(50);
      expect(c.summary.integers[II.first_depletion_t]).toBe(-1);
      expect(r.ledger[LI.withdraw_usd]).toBeCloseTo(37369.20777279521, 8);
      expect(r.ledger[49 * LEDGER_FIELDS.length + LI.liquid_usd]).toBeCloseTo(
        0,
        6,
      );
      expect(r.ledger).toHaveLength(50 * LEDGER_FIELDS.length);
      expect(r.years[49].phases).toHaveLength(10);
      expect(r.ledger[49 * LEDGER_FIELDS.length + LI.alive_A]).toBe(1);
      expect(r.ledger[49 * LEDGER_FIELDS.length + LI.alive_B]).toBe(1);
      // All-cash controls isolate the cash leg of the per-asset gain split.
      const gains = r.years[0].investment_gain;
      expect(gains.us_stocks).toBe(0);
      expect(gains.us_bonds).toBe(0);
      expect(Number.isFinite(gains.usd_cash)).toBe(true);
    });
  }
  it('stops after the last funded year when net assets reach exactly zero', () => {
    const refs = fixtureReferences('control-depletion'),
      req = request('control-depletion'),
      r = replayPathLedger(req, refs, 0),
      c = simulatePath(req, refs, 0);
    expect(r.years).toHaveLength(10);
    expect(c.summary.integers[II.active_years]).toBe(10);
    expect(c.summary.integers[II.terminal_t]).toBe(9);
    expect(c.summary.integers[II.first_depletion_t]).toBe(9);
    expect(r.ledger[9 * LEDGER_FIELDS.length + LI.shortfall_cny]).toBe(0);
    expect(r.ledger[9 * LEDGER_FIELDS.length + LI.liquid_usd]).toBe(0);
    expect(r.stop).toEqual({
      reason: 'net_assets_nonpositive',
      year: 2035,
      year_index: 9,
      net_worth_cny: 0,
    });
    expect(r.years[9].report.annual_investment_return).toBeNull();
    expect(ledgerValue(r, 10, 'annual_investment_return')).toBeNaN();
    expect(r.ledger[10 * LEDGER_FIELDS.length + LI.year]).toBeNaN();
    expect(() => hashObject(r.years)).not.toThrow();
  });
  it('final-year tax is computed and paid the same year, ending at 491382.02 heirs', () => {
    const refs = fixtureReferences('engine-final-tax'),
      req = request('engine-final-tax'),
      r = replayPathLedger(req, refs, 0),
      c = simulatePath(req, refs, 0);
    const bill = r.ledger[LI.tax_us_A],
      paid = c.summary.floats[FI.lifetime_income_tax_cash_cny_real];
    // The joint pre-tax account splits the $150k distribution: resident A is
    // taxed on half under MFS while NRA B owes nothing on the other half.
    expect(r.ledger[LI.tax_us_B]).toBe(0);
    expect(bill).toBeCloseTo(8617.97584868987, 6);
    expect(paid).toBeCloseTo(8617.962260817, 6);
    expect(bill - paid).toBeLessThan(1); // fixpoint converges: leftover is sub-dollar.
    expect(r.ledger[LI.withdraw_usd]).toBeCloseTo(150000 + paid, 6);
    expect(r.ledger[LI.liquid_usd]).toBeCloseTo(491382.037739183, 6);
    expect(c.summary.floats[FI.terminal_income_due_cny_real]).toBeCloseTo(
      0.013587872870630235,
      6,
    );
    expect(c.summary.floats[FI.terminal_net_heirs_cny_real]).toBeCloseTo(
      491382.02415131015,
      6,
    );
  });
  it('a sub-dollar leftover carries one year and then pays, leaving the second year quiet', () => {
    const refs = fixtureReferences('engine-prior-tax'),
      req = request('engine-prior-tax'),
      r = replayPathLedger(req, refs, 0),
      c = simulatePath(req, refs, 0);
    const i = LEDGER_FIELDS.length;
    expect(r.ledger[i + LI.withdraw_usd]).toBeCloseTo(0.013587872870630235, 6);
    expect(r.ledger[i + LI.tax_us_A]).toBe(0);
    expect(r.ledger[i + LI.liquid_usd]).toBeCloseTo(491382.02415131015, 6);
    expect(c.summary.floats[FI.terminal_net_heirs_cny_real]).toBeCloseTo(
      491382.02415131015,
      6,
    );
    expect(c.summary.floats[FI.terminal_income_due_cny_real]).toBe(0);
    expect(r.years[1].report.starting_liquid_usd).toBeCloseTo(
      491382.037739183,
      6,
    );
    expect(r.years[1].report.starting_net_worth_cny).toBeCloseTo(
      491382.037739183,
      6,
    );
  });
  it('sale closing cash and final ECI tax are paid the same year with no China bill', () => {
    const refs = fixtureReferences('engine-firpta'),
      req = request('engine-firpta'),
      r = replayPathLedger(req, refs, 0),
      c = simulatePath(req, refs, 0);
    expect(r.ledger[LI.liquid_usd]).toBe(232417.5);
    expect(r.ledger[LI.tax_us_B]).toBe(7582.5);
    expect(r.ledger[LI.tax_cn_B]).toBe(0);
    expect(c.summary.floats[FI.terminal_net_heirs_cny_real]).toBe(232417.5);
  });
  it('a real stochastic example completes; actual household remains blocked', () => {
    const v = validateScenario(createExampleDraft(), references);
    if (!v.ok) throw new Error(JSON.stringify(v.issues));
    const req = makeRunRequest(v.value.scenario, references);
    const c = simulatePath(req, references, 17);
    expect(c.summary.integers[II.active_years]).toBeGreaterThan(0);
    expect(
      Number.isFinite(c.summary.floats[FI.terminal_net_heirs_cny_real]),
    ).toBe(true);
    expect(validateScenario(createHouseholdDraft(), references).ok).toBe(false);
  });
  it('the full ledger and scientific snapshot reject every former kind tag', () => {
    const draft = createExampleDraft(),
      validated = validateScenario(draft, references);
    if (!validated.ok) throw new Error(JSON.stringify(validated.issues));
    const baseline = makeRunRequest(validated.value.scenario, references);
    expect(baseline.manifest).not.toHaveProperty('scenario_kind');
    expect(baseline.manifest).not.toHaveProperty('assumptions');
    for (const kind of ['example', 'control', 'household']) {
      const legacy = {
        ...draft,
        simulation: {
          ...draft.simulation,
          kind,
          assumptions: ['Old note'],
          unresolved_inputs: ['Old checklist entry'],
          legal_rules_verified: true,
          verification_note: 'Old verification text',
        },
      };
      const imported = parseScenario(exportScenario(legacy as DraftScenario));
      expect(imported.ok).toBe(false);
      if (imported.ok) throw new Error('legacy kind should fail');
      expect(
        imported.issues.some(
          (i) => i.code === 'unknown_key' && i.path === 'simulation.kind',
        ),
      ).toBe(true);
    }
  });
});

it('annual ledger reports opening wealth, complete medical costs and a financial return independent of FX', () => {
  const d = createControlDraft();
  d.simulation = { ...d.simulation, max_age: 60 };
  for (const id of ['A', 'B'] as const)
    Object.assign(d.people![id]!, { birth_year: 1966 });
  Object.assign(d.market!, { fx_spot: 2, fx_fair_value: 2 });
  d.budget = { annual: 3280, included_health: 2080 };
  Object.assign(d.medical!, {
    age_growth: 0,
    shock_enabled: true,
    shock_prob_at_60: 1,
    shock_median: 200,
  });
  // The retired 40,000 CNY cash holding is folded into brokerage at the
  // opening FX of 2: 100,000 + 20,000 = 120,000 USD.
  d.accounts![0].balance = 120000;
  d.one_time = [
    { name: 'ordinary_one_time', year: 2026, amount: 500, currency: 'CNY' },
  ];
  d.properties = [
    {
      ...createExampleDraft().properties![0],
      id: 'ledger-property',
      value: 80000,
      cost_basis: 80000,
      depreciation_taken: 0,
      mortgage_balance: 30000,
      mortgage_rate: 0,
      mortgage_years_left: 30,
      rent_monthly: 0,
      maintenance_annual: 0,
      property_tax_annual: 0,
      insurance_annual: 0,
      hoa_monthly: 0,
      strategy: 'hold',
      proceeds_account: 'brokerage',
    },
  ];
  const v = validateScenario(d, references);
  if (!v.ok) throw new Error(JSON.stringify(v.issues));
  const req = makeRunRequest(v.value.scenario, references),
    market = generateMarketPath(req.scenario, references, 0);
  market.fx.set([2, 3]);
  market.usd_cash[0] = 0.03;
  market.us_home[0] = 0;
  const replay = replayPathLedger(req, references, 0, market),
    report = replay.years[0].report;
  expect(report.starting_liquid_usd).toBe(120000);
  expect(report.starting_net_worth_cny).toBe(340000);
  expect(report.spend_excluding_medical_cny).toBe(1700);
  expect(report.medical_total_cny).toBe(2480);
  expect(report.annual_investment_return).toBeCloseTo(0.03, 12);
  expect(replay.ledger[LI.liquid_usd]).toBeCloseTo(119715.84, 8);
  expect(replay.ledger[LI.cny_cash_cny]).toBe(0);
  expect(replay.ledger[LI.net_worth_cny]).toBeCloseTo(512147.52, 8);
  expect(replay.years[0].properties[0].owners.A.basis_usd).toBe(40000);
  expect(
    replay.years[0].properties[0].owners.A.depreciation_taken,
  ).toBeGreaterThan(0);
});

it('both people live through the younger person’s Max age for every seed and path', () => {
  for (const seed of [0, 42, 4294967295]) {
    const d = createExampleDraft();
    d.simulation!.max_age = 62;
    d.simulation!.seed = seed;
    d.people!.A!.birth_year = 1966;
    d.people!.B!.birth_year = 1968;
    const v = validateScenario(d, references);
    if (!v.ok) throw new Error(JSON.stringify(v.issues));
    const req = makeRunRequest(v.value.scenario, references);
    expect(req.manifest.horizon).toBe(4);
    expect(req.manifest.longevity_policy).toBe('both-alive-to-younger-max-age');
    for (const path of [0, 17]) {
      const r = replayPathLedger(req, references, path),
        compact = simulatePath(req, references, path);
      expect(r.years).toHaveLength(4);
      expect(compact.summary.integers[II.active_years]).toBe(4);
      for (let t = 0; t < 4; t++) {
        expect(r.ledger[t * LEDGER_FIELDS.length + LI.alive_A]).toBe(1);
        expect(r.ledger[t * LEDGER_FIELDS.length + LI.alive_B]).toBe(1);
        expect(r.years[t]).not.toHaveProperty('deaths');
      }
      expect(r.ledger[3 * LEDGER_FIELDS.length + LI.age_A]).toBe(64);
      expect(r.ledger[3 * LEDGER_FIELDS.length + LI.age_B]).toBe(62);
      expect(r.years[3].terminal!.income_due_cny).toBeLessThan(1);
    }
  }
});
it('retired CNY cash columns stay zero for layout compatibility', () => {
  const d = createControlDraft();
  d.simulation!.max_age = 41;
  d.budget = { annual: 0, included_health: 0 };
  d.market!.fx_drift = Math.log(1.1);
  d.accounts![0].balance = 100000;
  const v = validateScenario(d, references);
  if (!v.ok) throw new Error(JSON.stringify(v.issues));
  const req = makeRunRequest(v.value.scenario, references),
    r = replayPathLedger(req, references, 0);
  expect(req.manifest.cny_cash_policy).toBe('no-interest');
  expect(r.years).toHaveLength(2);
  for (let t = 0; t < 2; t++) {
    const offset = t * LEDGER_FIELDS.length;
    expect(r.ledger[offset + LI.cny_cash_cny]).toBe(0);
    expect(r.ledger[offset + LI.withdraw_cny]).toBe(0);
  }
  expect(r.ledger[LEDGER_FIELDS.length + LI.fx]).toBeCloseTo(
    6.69 * 1.1 ** 2,
    12,
  );
});

it('M08 China credit applies to same-year settled US tax', () => {
  const d = createControlDraft();
  d.simulation!.max_age = 42;
  d.people!.domicile = 'China';
  const account = d.accounts![0];
  if (account.type !== 'brokerage')
    throw new Error('Expected brokerage control');
  // $2M joint: A's even half earns the $30k the derivation below taxes.
  account.balance = 2000000;
  d.budget!.annual = d.budget!.included_health = 0;
  d.market!.fx_spot = d.market!.fx_fair_value = 1;
  d.market!.home_cpi_mean = d.market!.home_cpi_start = 0;
  const refs = arithmeticReferences(0.03, 0);
  const v = validateScenario(d, refs);
  if (!v.ok) throw new Error(JSON.stringify(v.issues));
  const r = replayPathLedger(makeRunRequest(v.value.scenario, refs), refs, 0);
  // Year 0: A's $30k half of the joint interest, MFS standard deduction $16,100, brackets tax $13,900 at $1,240 + $180.
  // China raw is $6,000 at 20%; less the $1,420 same-year US credit, $4,580 is due immediately.
  // NRA B's half is US-exempt and pays the full China bill with no credit.
  expect(r.ledger[LI.tax_us_A]).toBeCloseTo(1420, 4);
  expect(r.ledger[LI.tax_cn_A]).toBeCloseTo(4580, 4);
  expect(r.ledger[LI.tax_us_B]).toBe(0);
  expect(r.ledger[LI.tax_cn_B]).toBeCloseTo(6000, 4);
  const i = LEDGER_FIELDS.length;
  expect(r.ledger[i + LI.tax_us_A]).toBeCloseTo(1506.4, 4);
  expect(r.ledger[i + LI.tax_cn_A]).toBeCloseTo(4637.6, 4);
  expect(r.ledger[i + LI.tax_us_B]).toBe(0);
  expect(r.ledger[i + LI.tax_cn_B]).toBeCloseTo(6144, 4);
});

function lastResortReplay(firstValue: number, secondValue: number) {
  const d = createControlDraft();
  d.accounts![0].balance = 0;
  const base = createExampleDraft().properties![0];
  const home = (id: string, value: number) => ({
    ...base,
    id,
    share_A: 1,
    value,
    cost_basis: value,
    land_share: 0,
    depreciation_taken: 0,
    rent_monthly: 0,
    proceeds_account: 'brokerage',
  });
  d.properties = [
    home('first_home', firstValue),
    home('second_home', secondValue),
  ];
  d.budget!.annual = 12000;
  d.budget!.included_health = 0;
  d.withdrawals!.last_resort_property_sale = true;
  const v = validateScenario(d, references);
  if (!v.ok) throw new Error(JSON.stringify(v.issues));
  return replayPathLedger(
    makeRunRequest(v.value.scenario, references),
    references,
    0,
  );
}

it('last-resort sale stops after the first sufficient property', () => {
  const y0 = lastResortReplay(400000, 400000).years[0];
  expect(y0.sales.map((s) => s.property_id)).toEqual(['first_home']);
  expect(y0.properties.map((p) => p.held)).toEqual([false, true]);
});

it('last-resort sale continues in property order when the first is insufficient', () => {
  const y0 = lastResortReplay(10000, 400000).years[0];
  expect(y0.sales.map((s) => s.property_id)).toEqual([
    'first_home',
    'second_home',
  ]);
  expect(y0.properties.map((p) => p.held)).toEqual([false, false]);
});
