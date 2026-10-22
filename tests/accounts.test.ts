import { describe, it, expect } from 'vitest';
import { validateScenario } from '../src/config/config';
import {
  createControlDraft,
  createExampleDraft,
} from '../src/config/constructors';
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
} from '../src/model/types';

function control(): ScenarioConfig {
  const r = validateScenario(createControlDraft(), references);
  if (!r.ok) throw new Error(JSON.stringify(r.issues));
  return r.value.scenario;
}
function ledgers() {
  return { A: emptyIncome(), B: emptyIncome() };
}

describe('fixed three accounts with derived ownership', () => {
  it('derives even ownership for two people and full A for one', () => {
    const config = {
      name: 'brokerage',
      type: 'brokerage',
      balance: 100000,
      allocation: { us_stocks: 1 },
    } as BrokerageAccountConfig;
    expect(initialAccount(config, true).shares).toEqual({ A: 0.5, B: 0.5 });
    expect(initialAccount(config, false).shares).toEqual({ A: 1, B: 0 });
  });
  it('rejects retired cash account types and ownership keys', () => {
    const refs = arithmeticReferences(0.03, 0);
    for (const type of ['cash_cny', 'cash_usd']) {
      const d = createControlDraft();
      Object.assign(d.accounts![0], { type });
      expect(validateScenario(d, refs).ok).toBe(false);
    }
    for (const key of ['owner', 'share_A', 'interest_rate']) {
      const d = createControlDraft();
      (d.accounts![0] as Record<string, unknown>)[key] = 0;
      const v = validateScenario(d, refs);
      if (v.ok) throw new Error(`${key} should fail`);
      expect(
        v.issues.some(
          (i) => i.code === 'unknown_key' && i.path === `accounts.0.${key}`,
        ),
      ).toBe(true);
    }
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
        balance: 100000,
        allocation,
      } as BrokerageAccountConfig;
      growAccount(config, initialAccount(config, false), s, 0, m, income);
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
  it('reports growth broken down by asset class', () => {
    const s = control(),
      m = generateMarketPath(s, references, 0),
      income = ledgers();
    const config = {
      name: 'b',
      type: 'brokerage',
      balance: 100000,
      allocation: { us_stocks: 0.5, us_bonds: 0.3, usd_cash: 0.2 },
    } as BrokerageAccountConfig;
    const r = growAccount(
      config,
      initialAccount(config, false),
      s,
      0,
      m,
      income,
    );
    expect(r.byAsset.us_stocks).toBeCloseTo(50000 * m.us_stocks[0], 8);
    expect(r.byAsset.us_bonds).toBeCloseTo(30000 * m.us_bonds[0], 8);
    expect(r.byAsset.usd_cash).toBeCloseTo(20000 * m.usd_cash[0], 8);
    expect(
      r.byAsset.us_stocks + r.byAsset.us_bonds + r.byAsset.usd_cash,
    ).toBeCloseTo(r.growth, 8);
  });
  it('sells bonds at zero gain while stocks realize gains', () => {
    const s = control(),
      income = ledgers();
    const bonds = {
      name: 'b',
      type: 'brokerage',
      balance: 100000,
      allocation: { us_bonds: 1 },
    } as BrokerageAccountConfig;
    const bState = initialAccount(bonds, false);
    // Seasoned holdings: value exceeds basis before the sale.
    bState.bases.us_bonds = 60000;
    expect(withdrawAccount(bonds, bState, 10000, s, 2026, income)).toBe(10000);
    expect(income.A.cap_gain).toBe(0);
    expect(bState.values.us_bonds).toBe(90000);
    const stocks = {
      name: 's',
      type: 'brokerage',
      balance: 100000,
      allocation: { us_stocks: 1 },
    } as BrokerageAccountConfig;
    const sState = initialAccount(stocks, false);
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
      balance: 100000,
      allocation: { us_bonds: 0.5, usd_cash: 0.5 },
    } as BrokerageAccountConfig;
    const state = initialAccount(config, false);
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
  it('enforces the fixed three accounts in order', () => {
    const refs = arithmeticReferences(0.03, 0);
    expect(validateScenario(createControlDraft(), refs).ok).toBe(true);
    const short = createControlDraft();
    short.accounts = short.accounts!.slice(0, 2);
    const vShort = validateScenario(short, refs);
    if (vShort.ok) throw new Error('two accounts should fail');
    expect(vShort.issues.some((i) => i.path === 'accounts')).toBe(true);
    const renamed = createControlDraft();
    renamed.accounts![0].name = 'save';
    expect(validateScenario(renamed, refs).ok).toBe(false);
    const reordered = createControlDraft();
    reordered.accounts = [
      reordered.accounts![1]!,
      reordered.accounts![0]!,
      reordered.accounts![2]!,
    ];
    expect(validateScenario(reordered, refs).ok).toBe(false);
    const badProceeds = createExampleDraft();
    badProceeds.properties![0]!.proceeds_account = 'save';
    const vProceeds = validateScenario(badProceeds, refs);
    if (vProceeds.ok) throw new Error('unknown proceeds account should fail');
    expect(
      vProceeds.issues.some((i) => i.path === 'properties[0].proceeds_account'),
    ).toBe(true);
  });
  it('grants pre-tax early access and rejects the flag elsewhere', () => {
    const refs = arithmeticReferences(0.03, 0);
    const d = createControlDraft();
    Object.assign(d.accounts![2], { allow_early_trad: true });
    const v = validateScenario(d, refs);
    if (!v.ok) throw new Error(JSON.stringify(v.issues));
    const s = v.value.scenario,
      trad = s.accounts[2] as RetirementAccountConfig,
      state = initialAccount(trad, true);
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
    const roth = createControlDraft();
    Object.assign(roth.accounts![1], { rule_of_55: true });
    expect(validateScenario(roth, refs).ok).toBe(false);
  });
});
