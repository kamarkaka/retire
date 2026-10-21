import { describe, it, expect } from 'vitest';
import { validateScenario } from '../src/config/config';
import { createControlDraft } from '../src/config/constructors';
import {
  initialAccount,
  withdrawAccount,
  growAccount,
  emptyIncome,
  rebalance,
  access,
} from '../src/model/accounts';
import { generateMarketPath } from '../src/model/market';
import { references } from '../src/reference/bundle';
import { arithmeticReferences } from '../verification/market-tapes';
import type {
  ScenarioConfig,
  BrokerageAccountConfig,
  RetirementAccountConfig,
  DraftScenario,
} from '../src/model/types';

function control(): ScenarioConfig {
  const r = validateScenario(createControlDraft(), references);
  if (!r.ok) throw new Error(JSON.stringify(r.issues));
  return r.value.scenario;
}
function ledgers() {
  return { A: emptyIncome(), B: emptyIncome() };
}

describe('simplified accounts: Cash USD and fixed asset treatment', () => {
  it('pays Cash USD interest at the configured rate as ordinary income', () => {
    const s = control(),
      m = generateMarketPath(s, references, 0),
      income = ledgers();
    const config = {
      name: 'save',
      type: 'cash_usd',
      owner: 'A',
      share_A: 1,
      balance: 100000,
      interest_rate: 0.04,
    } as const;
    const state = initialAccount(config),
      r = growAccount(config, state, s, 0, m, income);
    expect(r).toEqual({ opening: 100000, growth: 4000 });
    expect(state.values.deposit).toBe(104000);
    expect(income.A.interest_us).toBe(4000);
    expect(income.A.nra_exempt_interest).toBe(4000);
    expect(income.A.qualified_dividends).toBe(0);
    expect(income.A.cap_gain).toBe(0);
    expect(income.B.interest_us).toBe(0);
  });
  it('defaults Cash USD interest to the observed T-bill return', () => {
    const s = control(),
      m = generateMarketPath(s, references, 0),
      income = ledgers();
    const config = {
      name: 'save',
      type: 'cash_usd',
      owner: 'A',
      share_A: 1,
      balance: 100000,
    } as const;
    const state = initialAccount(config),
      r = growAccount(config, state, s, 0, m, income);
    expect(r.growth).toBeCloseTo(100000 * m.usd_cash[0], 8);
    expect(income.A.interest_us).toBeCloseTo(100000 * m.usd_cash[0], 8);
  });
  it('withdraws Cash USD with no gain and no income attribution', () => {
    const s = control(),
      income = ledgers();
    const config = {
      name: 'save',
      type: 'cash_usd',
      owner: 'A',
      share_A: 1,
      balance: 100000,
    } as const;
    const state = initialAccount(config);
    expect(withdrawAccount(config, state, 30000, s, 2026, income)).toBe(30000);
    expect(state.values.deposit).toBe(70000);
    expect(income.A).toEqual(emptyIncome());
  });
  it('fixes brokerage income treatment by asset class', () => {
    const s = control();
    s.market.income_yield_us_stocks = 0.02;
    s.market.income_yield_us_bonds = 0.05;
    const m = generateMarketPath(s, references, 0);
    const run = (allocation: BrokerageAccountConfig['allocation']) => {
      const income = ledgers();
      const config = {
        name: 'b',
        type: 'brokerage',
        owner: 'A',
        share_A: 1,
        balance: 100000,
        allocation,
      } as BrokerageAccountConfig;
      growAccount(config, initialAccount(config), s, 0, m, income);
      return income.A;
    };
    const stocks = run({ us_stocks: 1 });
    expect(stocks.qualified_dividends).toBe(2000);
    expect(stocks.dividends).toBe(2000);
    expect(stocks.nra_dividends).toBe(2000);
    expect(stocks.interest_us).toBe(0);
    expect(stocks.nra_exempt_interest).toBe(0);
    const bonds = run({ us_bonds: 1 });
    expect(bonds.interest_us).toBe(5000);
    expect(bonds.nra_exempt_interest).toBe(5000);
    expect(bonds.qualified_dividends).toBe(0);
    expect(bonds.nra_dividends).toBe(0);
    const cash = run({ usd_cash: 1 }),
      expected = 100000 * m.usd_cash[0];
    expect(cash.interest_us).toBeCloseTo(expected, 8);
    expect(cash.nra_exempt_interest).toBeCloseTo(expected, 8);
    expect(cash.qualified_dividends).toBe(0);
  });
  it('sells bonds at zero gain while stocks realize gains', () => {
    const s = control(),
      income = ledgers();
    const bonds = {
      name: 'b',
      type: 'brokerage',
      owner: 'A',
      share_A: 1,
      balance: 100000,
      allocation: { us_bonds: 1 },
    } as BrokerageAccountConfig;
    const bState = initialAccount(bonds);
    // Seasoned holdings: value exceeds basis before the sale.
    bState.bases.us_bonds = 60000;
    expect(withdrawAccount(bonds, bState, 10000, s, 2026, income)).toBe(10000);
    expect(income.A.cap_gain).toBe(0);
    expect(bState.values.us_bonds).toBe(90000);
    const stocks = {
      name: 's',
      type: 'brokerage',
      owner: 'A',
      share_A: 1,
      balance: 100000,
      allocation: { us_stocks: 1 },
    } as BrokerageAccountConfig;
    const sState = initialAccount(stocks);
    sState.bases.us_stocks = 60000;
    expect(withdrawAccount(stocks, sState, 10000, s, 2026, income)).toBe(10000);
    expect(income.A.cap_gain).toBe(4000);
  });
  it('rebalancing out of bonds realizes no gain', () => {
    const s = control(),
      income = ledgers();
    const config = {
      name: 'b',
      type: 'brokerage',
      owner: 'A',
      share_A: 1,
      balance: 100000,
      allocation: { us_bonds: 0.5, usd_cash: 0.5 },
    } as BrokerageAccountConfig;
    const state = initialAccount(config);
    state.values.us_bonds = 80000;
    state.values.usd_cash = 20000;
    expect(rebalance(config, state, income)).toBe(0);
    expect(income.A.cap_gain).toBe(0);
    expect(state.values.us_bonds).toBe(50000);
    expect(state.values.usd_cash).toBe(50000);
  });
  it('holds no China-source or ordinary-distribution buckets', () => {
    expect('interest_cny_usd' in emptyIncome()).toBe(false);
    expect('ordinary_distributions' in emptyIncome()).toBe(false);
  });
  it('validates Cash-USD-only and forbidden account keys', () => {
    const refs = arithmeticReferences(0.03, 0);
    const base = createControlDraft();
    base.accounts = [
      { name: 'save', type: 'cash_usd', owner: 'A', share_A: 1, balance: 1000 },
    ];
    base.withdrawals = {
      ...base.withdrawals,
      surplus_account: 'save',
    };
    const surplus = validateScenario(base, refs);
    if (surplus.ok) throw new Error('Cash USD surplus should fail');
    expect(
      surplus.issues.some((i) => i.path === 'withdrawals.surplus_account'),
    ).toBe(true);
    const brokerage = createControlDraft();
    brokerage.accounts = [{ ...brokerage.accounts![0], interest_rate: 0.03 }];
    expect(validateScenario(brokerage, refs).ok).toBe(false);
    const misbuilt = createControlDraft();
    const badAccount = {
      name: 'save',
      type: 'cash_usd',
      owner: 'A',
      share_A: 1,
      balance: 1000,
      allocation: { usd_cash: 1 },
      interest_rate: -0.01,
    };
    misbuilt.accounts = [badAccount] as DraftScenario['accounts'];
    const v = validateScenario(misbuilt, refs);
    if (v.ok) throw new Error('misbuilt Cash USD should fail');
    expect(v.issues.some((i) => i.path === 'accounts[0].allocation')).toBe(
      true,
    );
    expect(v.issues.some((i) => i.path === 'accounts[0].interest_rate')).toBe(
      true,
    );
  });
  it('grants pre-tax early access per account and rejects the flag elsewhere', () => {
    const refs = arithmeticReferences(0.03, 0);
    const d = createControlDraft();
    d.accounts = [
      ...d.accounts!,
      {
        name: 'early_trad',
        type: 'pre_tax',
        owner: 'A',
        share_A: 1,
        balance: 1000,
        allocation: { us_stocks: 1 },
        allow_early_trad: true,
      },
    ];
    const v = validateScenario(d, refs);
    if (!v.ok) throw new Error(JSON.stringify(v.issues));
    const s = v.value.scenario,
      trad = s.accounts[1] as RetirementAccountConfig,
      state = initialAccount(trad);
    expect(access(trad, state, s, 2026)).toBe(true);
    expect(access({ ...trad, allow_early_trad: false }, state, s, 2026)).toBe(
      false,
    );
    const bad = createControlDraft();
    Object.assign(bad.accounts![0], { allow_early_trad: true });
    const r = validateScenario(bad, refs);
    if (r.ok) throw new Error('brokerage early flag should fail');
    expect(
      r.issues.some((i) => i.path === 'accounts[0].allow_early_trad'),
    ).toBe(true);
  });
});
