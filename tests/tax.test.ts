import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  residentTax,
  nonresidentTax,
  chinaTax,
  applyCredit,
  capitalNet,
} from '../src/model/tax';
import { classifyPropertySales, type SaleRecord } from '../src/model/property';
import { emptyIncome } from '../src/model/accounts';
import tablesJson from '../src/reference/tax-tables.json';
import type { TaxTables } from '../src/model/types';
const tables = tablesJson as unknown as TaxTables;
const oracles = JSON.parse(
  readFileSync('verification/fixtures/oracles.json', 'utf8'),
).cases;
describe('M06 literal tax oracles (arithmetic, sources remain unverified)', () => {
  for (const id of ['US-3', 'US-CARRY']) {
    it(id, () => {
      const c = oracles.find((c: { id: string }) => c.id === id),
        actual = residentTax(c.inputs, tables);
      for (const [key, value] of Object.entries(c.expected))
        expect(actual[key as keyof typeof actual], key).toBeCloseTo(
          value as number,
          6,
        );
    });
  }
  it('capital netting carries losses and taxes net gains as long-term', () => {
    expect(capitalNet(-20000, 50000, 10000, 1500)).toEqual({
      lt_gain: 20000,
      ordinary_loss_deduction: 0,
      loss_carryforward: 0,
    });
    expect(capitalNet(-20000, 5000, 10000, 1500)).toEqual({
      lt_gain: 0,
      ordinary_loss_deduction: 1500,
      loss_carryforward: 23500,
    });
  });
  it('taxes the partial-offset 20k net gain once, without a phantom carryover', () => {
    const r = residentTax(
      {
        filing_status: 'mfs',
        price_index: 1,
        ordinary: 100000,
        qd: 0,
        securities_lt: -20000,
        property_lt: 50000,
        prior_capital_loss: 10000,
        nii: 20000,
      },
      tables,
    );
    expect(r.lt_gain).toBe(20000);
    expect(r.agi).toBe(120000);
    expect(r.ti).toBe(103900);
    expect(r.income_tax).toBe(16170);
    expect(r.niit).toBe(0);
    expect(r.carry).toBe(0);
  });
  it('uses the same netting for nonresident property gains', () => {
    const r = nonresidentTax(
      {
        rental_net: 0,
        property_lt: 80000,
        prior_capital_loss: 10000,
        dividends: 0,
      },
      tables,
    );
    expect(r.lt_gain).toBe(70000);
    expect(r.carry).toBe(0);
  });
  it('NRA ECI and FDAP stay separate', () => {
    const t = nonresidentTax({ rental_net: 20000, dividends: 10000 }, tables);
    expect(t.rental_tax).toBe(2152);
    expect(t.dividend_tax).toBe(1000);
    expect(t.total).toBe(3152);
  });
  it('China tax and the same-year US credit reconcile', () => {
    const t = chinaTax({ dividends: 50000, gross_rent: 200000 }, tables);
    expect(t.before_credit).toBe(42000);
    expect(t.pension_tax).toBe(0);
    expect(applyCredit(t.before_credit, 20000)).toEqual({
      credit: 20000,
      due: 22000,
    });
    expect(applyCredit(10000, 15000)).toEqual({ credit: 10000, due: 0 });
  });
  it('M07 classifies property sales with the simple split and no Section 1231 history', () => {
    const income = { A: emptyIncome(), B: emptyIncome() };
    const mixed: SaleRecord[] = [
      {
        person: 'A',
        gain: 100000,
        depreciation: 20000,
        net_price: 500000,
        gain_cny: 690000,
        property_id: 'p1',
      },
      {
        person: 'A',
        gain: -30000,
        depreciation: 0,
        net_price: 100000,
        gain_cny: -207000,
        property_id: 'p2',
      },
    ];
    classifyPropertySales(mixed, income);
    expect(income.A.ltcg_property).toBe(70000);
    expect(income.A.ordinary_property_gain).toBe(0);
    expect(income.A.property_gain_cny).toBe(483000);
    classifyPropertySales(
      [
        {
          person: 'B',
          gain: -10000,
          depreciation: 5000,
          net_price: 90000,
          gain_cny: -69000,
          property_id: 'p3',
        },
      ],
      income,
    );
    expect(income.B.ordinary_property_gain).toBe(-10000);
    expect(income.B.ltcg_property).toBe(0);
  });
});
