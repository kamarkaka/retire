// Development-only adapters. Expected values are read from the separate M00 oracle file.
// Every numeric result below calls product modules; this file never constructs an expected answer.
import pv from '../../verification/fixtures/control-pv.json' with { type: 'json' };
import firpta from '../../verification/fixtures/engine-firpta.json' with { type: 'json' };
import {
  normalizeScenario,
  validateScenario,
  makeRunRequest,
} from '../config/config';
import { createControlDraft } from '../config/constructors';
import {
  THREE_PERCENT_TAPE as references,
  ZERO_RETURN_TAPE,
  fixtureReferences,
} from '../../verification/market-tapes';
import { residentTax } from '../model/tax';
import {
  xoshiro,
  streamState,
  normalPair,
  bootstrapIndices,
  makeDraws,
} from '../model/rng';
import { hashText } from '../model/canonical';
import { SERIES } from '../reference/calibration';
import {
  generateMarketPath,
  prepareMarket,
  buildMarket,
} from '../model/market';
import { consumption, medicalCost } from '../model/consumption';
import {
  initialAccount,
  withdrawAccount,
  emptyIncome,
  growAccount,
  rebalance,
  conversion,
  rmdAmount,
} from '../model/accounts';
import { initialProperty, propertyCash, closingQuote } from '../model/property';
import { replayPathLedger, simulatePath } from '../model/engine';
import { LEDGER_FIELDS, LI, FI, II } from '../model/layout';
import { quantile, rankPaths } from '../model/results';
import { SimulationError } from '../model/errors';
import type {
  ScenarioConfig,
  DraftScenario,
  BrokerageAccountConfig,
  PropertyConfig,
  HistoricalRow,
} from '../model/types';

export interface VerificationCase {
  id: string;
  oracle_kind: string;
  inputs: Record<string, any>;
  expected: unknown;
  tolerance: number;
  [key: string]: unknown;
}
export const RETIRED_CASE_IDS = [
  'EST-1',
  'EST-2',
  'EST-3',
  'MORT-1',
  'DEATH-1',
  'DEATH-2',
  'DEATH-SNAPSHOT',
  'SPENDING-TIMING',
  'SS-GATES',
  'SUMMARY-1',
  'FLEX-1',
  'BUDGET-1',
  'MARKET-PROJECTION',
  'CONTROL-DEPLETION',
  'ACCOUNT-BASIS',
  'PROPERTY-1231',
  'FIRPTA-1',
  'FIRPTA-SHARE',
  'SALE-FAIL',
  'ENGINE-FIRPTA',
  'PROPERTY-BOOKS',
  'CN-1',
  'ENGINE-FINAL-TAX',
  'ENGINE-PRIOR-TAX',
  'CONTROL-FX',
  'US-1',
  'US-2',
  'US-4',
  'US-5',
  'US-6',
  'US-7',
  'US-8',
  'NRA-1',
  'CN-2',
  'CN-PARTIAL',
  'CN-WITHHOLDING',
  'TERMINAL-1',
  'TERMINAL-REFUND',
  'TERMINAL-DEFICIT',
] as readonly string[];
export function retiredCaseReason(id: string): string {
  return id === 'CONTROL-DEPLETION'
    ? 'A path now stops when net assets become nonpositive; the old fixture continued after spending its final dollar to observe a later shortfall.'
    : id === 'MARKET-PROJECTION'
      ? 'Market return/inflation rescaling was removed. All product configurations use source rows directly.'
      : id === 'FLEX-1'
        ? 'Recurring spending and its flexibility rules were removed.'
        : id === 'BUDGET-1'
          ? 'The medical base now has one source, Budget included_health; the former duplicate-entry fixture is obsolete.'
          : id === 'ACCOUNT-BASIS'
            ? 'Brokerage cost basis always equals starting balance; partial-basis gain scenarios are no longer expressible.'
            : id === 'PROPERTY-1231'
              ? 'Section 1231 loss history and lookback ordering are removed; property sales use the simple split.'
              : id === 'FIRPTA-1' ||
                  id === 'FIRPTA-SHARE' ||
                  id === 'SALE-FAIL' ||
                  id === 'ENGINE-FIRPTA'
                ? 'FIRPTA withholding is removed; US properties use citizen treatment for all owners with no closing prepayment.'
                : id === 'PROPERTY-BOOKS'
                  ? 'Vacancy and split management/maintenance inputs are removed; expenses use one annual maintenance figure.'
                  : id === 'CN-1'
                    ? 'China pension treatment choice is removed; retirement distributions are not taxed in China.'
                    : id === 'ENGINE-FINAL-TAX' || id === 'ENGINE-PRIOR-TAX'
                      ? 'Custom flat tax tables are removed with tax overrides; terminal mechanics are re-pinned at bundled reference rates in unit tests.'
                      : id === 'CONTROL-FX'
                        ? 'Budget currency follows domicile: a USD budget under drifting FX cannot replicate the frozen fixed-CNY payment stream. The telescoping USD mechanics are re-pinned in unit tests.'
                        : id === 'US-1' || id === 'US-2' || id === 'NRA-1'
                          ? 'Social Security benefits and SS taxation are removed; cases with SS inputs no longer apply.'
                          : id === 'US-4' ||
                              id === 'US-5' ||
                              id === 'US-6' ||
                              id === 'US-7' ||
                              id === 'US-8'
                            ? 'Unrecaptured Section 1250 is folded into long-term gains; cases depending on the 25% bucket no longer apply.'
                            : id === 'CN-2' ||
                                id === 'CN-PARTIAL' ||
                                id === 'CN-WITHHOLDING'
                              ? 'Settlement and FTC allocation mechanics are removed; the China credit is now same-year eligible-paid.'
                              : id === 'TERMINAL-1' ||
                                  id === 'TERMINAL-REFUND' ||
                                  id === 'TERMINAL-DEFICIT'
                                ? 'Settlement payment-timing mechanics are removed; taxes are paid the same year with a memo for leftovers.'
                                : 'Both people remain alive until the younger reaches Max age; mortality, survivor and death transitions are removed.';
}
const configs = { 'control-pv.toml': pv };
function requestFor(file: keyof typeof configs) {
  const n = normalizeScenario(
    structuredClone(configs[file]) as unknown as DraftScenario,
  );
  if (!n.ok) throw new Error(JSON.stringify(n.issues));
  const v = validateScenario(n.value, references);
  if (!v.ok) throw new Error(JSON.stringify(v.issues));
  return makeRunRequest(v.value.scenario, fixtureReferences(file));
}
function control(): ScenarioConfig {
  return structuredClone(
    requestFor('control-pv.toml').scenario,
  ) as ScenarioConfig;
}
export function runProductCase(c: VerificationCase): {
  actual: unknown;
  trace?: unknown;
  excluded_expected_fields?: string[];
} {
  const i = c.inputs,
    tables = references.tax_tables;
  if (/^US-[1-8]$/.test(c.id) || c.id === 'US-CARRY')
    return {
      actual: residentTax(i as never, tables),
      trace:
        'Product Schedule D netting, preferential tax, deductions and NIIT. Legal registry remains unverified.',
    };
  switch (c.id) {
    case 'RMD-1': {
      const amount = rmdAmount(i.prior_year_end_balance, i.age, 1960, tables);
      return { actual: { rmd: amount, surplus: amount - i.need } };
    }
    case 'US-EARLY':
      return {
        actual: {
          penalty: residentTax(
            {
              filing_status: 'mfs',
              price_index: 1,
              ordinary: 0,
              qd: 0,
              securities_lt: 0,
              property_lt: 0,
              prior_capital_loss: 0,
              nii: 0,
              early_trad: i.early_trad,
            },
            tables,
          ).penalty,
        },
      };
    case 'RNG-VECTORS': {
      const tuple = JSON.parse(i.tuple_text),
        state = streamState(tuple[1], tuple[2], tuple[3], tuple[4]),
        raw = xoshiro(i.raw_state),
        seeded = xoshiro(state);
      return {
        actual: {
          raw_outputs: Array.from({ length: 8 }, raw),
          sha256: hashText(i.tuple_text),
          little_endian_state: state,
          seeded_outputs: Array.from({ length: 5 }, seeded),
          uniform_min: 0.5 / 4294967296,
          uniform_max: (4294967296 - 0.5) / 4294967296,
          normal_pair: normalPair(...(i.normal_uniforms as [number, number])),
        },
      };
    }
    case 'MARKET-JOINT': {
      let used = 0;
      const ids = bootstrapIndices(
        (i.bootstrap_uniforms.length + 1) / 2,
        i.source_rows.length,
        i.block_mean_years,
        () => i.bootstrap_uniforms[used++],
      );
      const rows = i.source_rows.map((row: number[]) =>
          Object.fromEntries(
            i.columns.map((key: string, k: number) => [key, row[k]]),
          ),
        ) as HistoricalRow[],
        s = control(),
        market = buildMarket(
          s,
          rows,
          ids,
          new Float64Array(ids.length),
          new Float64Array(ids.length),
          0,
        );
      return {
        actual: {
          row_indices: Array.from(ids),
          all_columns_same_row: SERIES.every((key) =>
            Array.from(ids).every((id, t) => market[key][t] === rows[id][key]),
          ),
          consumed_uniform_count: used,
        },
      };
    }
    case 'MARKET-TIMING': {
      const s = control();
      Object.assign(s.market, {
        home_cpi_mean: i.cn_cpi,
        home_cpi_start: i.cn_cpi,
        fx_spot: i.fx_spot,
        fx_drift: Math.log(i.fx_multiplier),
        medical_excess_inflation: i.medical_excess,
      });
      const p = generateMarketPath(s, references, 0);
      return {
        actual: {
          cn_index_0: p.home_index[0],
          us_index_0: p.usd_index[0],
          cn_index_1: p.home_index[1],
          us_index_1: p.usd_index[1],
          fx_10: p.fx[10],
          medical_price_factor: p.home_medical_index[1],
        },
        excluded_expected_fields: [
          'deposit_rate',
          'stress_index',
          'stress_ratio',
        ],
        trace: {
          retired_fields: ['deposit_rate', 'stress_index', 'stress_ratio'],
          reason:
            'CNY cash interest and FX stress events are removed. Frozen FX/CPI/medical timing answers remain applicable with a literal test-only return tape.',
        },
      };
    }
    case 'MARKET-AR': {
      const s = control();
      Object.assign(s.market, {
        home_cpi_mean: i.mean,
        home_cpi_start: i.start,
        home_cpi_phi: i.phi,
        home_cpi_sigma: i.sigma,
      });
      const p = buildMarket(
        s,
        prepareMarket(s, references),
        new Int32Array(i.years),
        new Float64Array(i.years),
        new Float64Array(i.years),
        0,
      );
      return { actual: { cn_rates: Array.from(p.home_cpi) } };
    }
    case 'MARKET-INVALID': {
      const s = control();
      Object.assign(s.market, {
        home_cpi_mean: i.mean,
        home_cpi_start: i.mean,
        home_cpi_phi: i.phi,
        home_cpi_sigma: i.sigma,
      });
      const z = new Float64Array(i.t + 1);
      z[i.t] = i.z;
      try {
        buildMarket(
          s,
          prepareMarket(s, references),
          new Int32Array(i.t + 1),
          z,
          new Float64Array(i.t + 1),
          i.path_id,
        );
        throw new Error('Expected domain rejection');
      } catch (e) {
        if (!(e instanceof SimulationError)) throw e;
        return {
          actual: {
            cn_cpi: e.detail.factor! - 1,
            gross_factor: e.detail.factor,
            error_path_id: e.detail.path_id,
            error_year: e.detail.year,
            whole_job_failed: true,
            partial_probabilities: false,
          },
          trace: e.detail,
        };
      }
    }
    case 'MEDICAL-GROWTH': {
      const s = control();
      s.people.domicile = 'China';
      s.budget.annual = i.ordinary + i.base;
      s.budget.included_health = i.base;
      s.medical.age_growth = i.age_growth;
      s.market.medical_excess_inflation = i.medical_excess;
      const p = generateMarketPath(s, references, 0),
        draws = makeDraws(s, 0, 71),
        cost = consumption(s, 1, p, draws),
        later = medicalCost(
          i.base,
          40 + i.increments,
          40,
          p.home_medical_index[i.increments],
          s.medical,
          1,
        );
      return {
        actual: {
          nominal_factor: cost.medical_base / i.base,
          real_factor: cost.medical_base / i.base / p.home_index[1],
          year1_medical_nominal: cost.medical_base,
          year1_medical_real: cost.medical_base / p.home_index[1],
          year1_included_total: cost.included,
          year1_ceiling: s.budget.annual * p.home_index[1],
          after50_medical_real: later.recurring / p.home_index[i.increments],
        },
        excluded_expected_fields: ['year1_excess'],
        trace: {
          retired_fields: ['year1_excess'],
          reason:
            'Budget mode is removed; every budget uses initial treatment with no ceiling-excess report. Frozen medical growth answers remain applicable.',
        },
      };
    }
    case 'MEDICAL-SCOPE': {
      const s = control();
      s.people.domicile = 'China';
      s.people.A.birth_year = s.people.B!.birth_year =
        s.simulation.start_year - i.age;
      s.budget.included_health = 0;
      s.budget.annual = i.ceiling;
      Object.assign(s.medical, {
        shock_enabled: true,
        shock_prob_at_60: i.prob_at60,
        shock_median: i.median,
      });
      const p = generateMarketPath(s, references, 0),
        draws = makeDraws(s, 0, 51);
      draws.medical_occurrence.A[0] = i.occurrence_uniform;
      draws.medical_occurrence.B[0] = 0.99;
      const c = consumption(s, 0, p, draws);
      return {
        actual: {
          shock: medicalCost(
            0,
            i.age,
            i.age,
            i.medical_index,
            s.medical,
            i.occurrence_uniform,
          ).shock,
          additional_scope: {
            included: c.included,
            additional: c.additional,
            total: c.total,
          },
        },
        excluded_expected_fields: ['additional_scope.excess', 'included_scope'],
        trace: {
          retired_fields: ['additional_scope.excess', 'included_scope'],
          reason:
            'Budget mode is removed; every budget uses initial treatment with no ceiling-excess report. Shock scope is removed; shocks are always additional, so the frozen included-scope answers no longer apply.',
        },
      };
    }
    case 'ACCOUNT-BASIS': {
      const s = control(),
        config = {
          ...s.accounts[0],
          balance: i.opening_value,
          allocation: { us_stocks: 1 },
        } as BrokerageAccountConfig,
        a = initialAccount(config),
        income = { A: emptyIncome(), B: emptyIncome() };
      withdrawAccount(config, a, i.withdrawal, s, 2026, income);
      const b = initialAccount(config),
        p = generateMarketPath(s, references, 0);
      p.us_stocks[0] = i.separate_return_case.total_return;
      s.market.income_yield_us_stocks = i.separate_return_case.yield;
      growAccount(config, b, s, 0, p, income);
      return {
        actual: {
          withdrawal_gain: income.A.cap_gain,
          remaining_value: a.values.us_stocks,
          remaining_basis: a.bases.us_stocks,
          return_case_value: b.values.us_stocks,
          return_case_basis: b.bases.us_stocks,
        },
      };
    }
    case 'ACCOUNT-REBALANCE': {
      const s = control(),
        config = {
          ...s.accounts[0],
          allocation: {
            us_stocks: i.target_stock,
            us_bonds: 1 - i.target_stock,
          },
        } as BrokerageAccountConfig,
        a = initialAccount(config),
        income = { A: emptyIncome(), B: emptyIncome() };
      a.values = { us_stocks: i.stock_value, us_bonds: i.bond_value };
      a.bases = { us_stocks: i.stock_basis, us_bonds: i.bond_basis };
      const gain = rebalance(config, a, income),
        r = structuredClone(a),
        retirement = {
          ...config,
          type: 'after_tax',
        } as unknown as ScenarioConfig['accounts'][number],
        before = income.A.cap_gain;
      rebalance(retirement, r, income);
      return {
        actual: {
          stock_sale: i.stock_value - a.values.us_stocks!,
          gain,
          ending_stock: a.values.us_stocks,
          ending_bond: a.values.us_bonds,
          stock_basis: a.bases.us_stocks,
          bond_basis: a.bases.us_bonds,
          retirement_taxable_gain: income.A.cap_gain - before,
        },
      };
    }
    case 'CONVERSION-1':
      return { actual: conversion(i.cny_need, i.usd_need, i.fx, i.spread) };
    case 'PROPERTY-MORTGAGE': {
      const p = structuredClone(
        firpta.properties[0],
      ) as unknown as PropertyConfig;
      Object.assign(p, {
        mortgage_balance: i.opening_balance,
        mortgage_rate: i.rate,
        mortgage_years_left: i.years_left,
        rent_monthly: 0,
        maintenance_annual: 0,
      });
      const state = initialProperty(p),
        cash = propertyCash(
          p,
          state,
          0,
          i.index ?? 1,
          tables.us.depreciation_years,
          { A: emptyIncome(), B: emptyIncome() },
        );
      return {
        actual: {
          annual_payment: state.mortgage_payment,
          first_interest: cash.interest,
          first_principal: cash.principal,
          ending_balance: state.mortgage_balance,
        },
        trace: { cash, state },
      };
    }
    case 'CONTROL-PV': {
      const req = requestFor(i.config_file),
        r = replayPathLedger(req, fixtureReferences(i.config_file), 0),
        last = r.years.length - 1,
        balance = req.scenario.accounts[0].balance;
      return {
        actual: {
          payment_count: r.years.length,
          first_payment: r.ledger[LI.withdraw_usd],
          required_balance: balance,
          displayed_pv: balance.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
          final_balance: r.ledger[last * LEDGER_FIELDS.length + LI.liquid_usd],
          first_age: r.ledger[LI.age_A],
          last_age: r.ledger[last * LEDGER_FIELDS.length + LI.age_A],
          allocated_rows: req.manifest.horizon,
        },
        excluded_expected_fields: ['exact_pv_decimal', 'allocated_rows'],
        trace:
          'Starting balance is the independently authored fixture input. The actual engine must fund all 50 payments and finish at numerical zero. The exact rational decimal is oracle provenance, not a Float64 product output.',
      };
    }
    case 'RANKING-1': {
      const ids = rankPaths(i.paths);
      return {
        actual: {
          ascending_ids: ids,
          worst: ids[0],
          p10: ids[Math.floor(0.1 * (ids.length - 1))],
          median: ids[Math.floor(0.5 * (ids.length - 1))],
        },
      };
    }
    case 'SEQUENCE-1': {
      const s = control();
      s.people.domicile = 'China';
      s.simulation.max_age = 61;
      s.people.A.birth_year = s.people.B!.birth_year = 1966;
      s.market.home_cpi_mean = s.market.home_cpi_start = 0;
      s.market.fx_spot = s.market.fx_fair_value = 1;
      s.budget.included_health = 0;
      s.accounts = [
        {
          name: 'sequence_roth',
          type: 'after_tax',
          owner: 'A',
          share_A: 1,
          balance: i.initial,
          allocation: { us_stocks: 1 },
        },
        {
          ...s.accounts[0],
          balance: 0,
        } as BrokerageAccountConfig,
      ];

      const calculate = (returns: number[], w: number) => {
        s.budget.annual = w;
        const v = validateScenario(s, references);
        if (!v.ok) throw new Error(JSON.stringify(v.issues));
        const req = makeRunRequest(v.value.scenario, references),
          market = generateMarketPath(req.scenario, references, 0);
        market.us_stocks.set(returns);
        return replayPathLedger(req, references, 0, market).ledger[
          LEDGER_FIELDS.length + LI.liquid_usd
        ];
      };
      return {
        actual: {
          ending_original: calculate(i.returns, i.annual_beginning_withdrawal),
          ending_reversed: calculate(i.reversed, i.annual_beginning_withdrawal),
          no_withdrawal_both: calculate(i.returns, 0),
        },
      };
    }
    default:
      throw new Error(`Numeric product adapter not implemented: ${c.id}`);
  }
}
export function compareActual(
  expected: unknown,
  actual: unknown,
  tolerance: number,
  excluded: string[] = [],
  path = '',
): { path: string; expected: unknown; actual: unknown; tolerance?: number }[] {
  if (excluded.includes(path)) return [];
  if (typeof expected === 'number')
    return typeof actual === 'number' &&
      Number.isFinite(actual) &&
      Math.abs(expected - actual) <= tolerance
      ? []
      : [{ path, expected, actual, tolerance }];
  if (expected !== null && typeof expected === 'object')
    return Object.entries(expected).flatMap(([key, v]) =>
      compareActual(
        v,
        (actual as Record<string, unknown>)?.[key],
        tolerance,
        excluded,
        path ? `${path}.${key}` : key,
      ),
    );
  return expected === actual ? [] : [{ path, expected, actual }];
}
