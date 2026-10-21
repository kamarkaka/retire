import { it, expect } from 'vitest';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { references, REFERENCE_PROVENANCE } from '../src/reference/bundle';
import { prepareMarket, buildMarket } from '../src/model/market';
import {
  createControlDraft,
  createExampleDraft,
} from '../src/config/constructors';
import { validateScenario, makeRunRequest } from '../src/config/config';
import { replayPathLedger } from '../src/model/engine';
import { LI, LEDGER_FIELDS } from '../src/model/layout';
import type { HistoricalRow, DraftScenario } from '../src/model/types';

const accepted = JSON.parse(
  readFileSync(
    'verification/sources/nyu-historical-returns-1928-2025/independent-acceptance.json',
    'utf8',
  ),
) as {
  independent_rows: HistoricalRow[];
  calendar_replays: Record<
    string,
    Record<
      'without_spending' | 'with_spending',
      {
        ending_usd: number;
        years: {
          source_year: number;
          opening_usd: number;
          withdrawal_usd: number;
          return: number;
          ending_usd: number;
        }[];
      }
    >
  >;
};
const fredAccepted = JSON.parse(
  readFileSync('verification/sources/fred/independent-acceptance.json', 'utf8'),
) as { us_cpi: { year: number; us_cpi: number }[] };
const independentHistory = accepted.independent_rows.map((r, i) => ({
  ...r,
  us_cpi: fredAccepted.us_cpi[i].us_cpi,
}));
function validated(d: DraftScenario) {
  const v = validateScenario(d, references);
  if (!v.ok) throw new Error(JSON.stringify(v.issues));
  return v.value.scenario;
}

it('M03 M04: every configuration uses the exact source rows, with no return or CPI overrides', () => {
  expect(REFERENCE_PROVENANCE.source_sha256).toBe(
    '28b8110916a15a4dcc11c87c6422510704608ddedcdfa67a1298abdc22e49c69',
  );
  expect(references.versions.history).toBe('nyu-fred-1928-2025-v1');
  for (const d of [createExampleDraft(), createControlDraft()]) {
    expect(d.market).not.toHaveProperty('custom');
    expect(d.market).not.toHaveProperty('fx_stress');
    expect(prepareMarket(validated(d), references)).toEqual(independentHistory);
  }
  const d = createExampleDraft();
  d.market!.sample_start = 2000;
  d.market!.sample_end = 2022;
  expect(prepareMarket(validated(d), references)).toEqual(
    independentHistory.filter((r) => r.year >= 2000 && r.year <= 2022),
  );
  expect(references.history).toEqual(independentHistory);
});

for (const name of ['dotcom', 'gfc', 'stocks_and_bonds_down'])
  it(`M11: actual ${name} calendar rows reproduce independent annual 40/60 Treasury balances`, () => {
    const evidence: unknown[] = [];
    for (const scope of ['without_spending', 'with_spending'] as const) {
      const expected = accepted.calendar_replays[name][scope],
        d = createControlDraft();
      d.simulation = {
        ...d.simulation,
        start_year: 2026,
        max_age: 70 + expected.years.length - 1,
      };
      for (const id of ['A', 'B'] as const) d.people![id]!.birth_year = 1956;
      Object.assign(d.market!, {
        home_cpi_mean: 0,
        home_cpi_start: 0,
        home_cpi_sigma: 0,
        home_cpi_phi: 0,
        fx_spot: 1,
        fx_fair_value: 1,
        fx_sigma: 0,
        fx_drift: 0,
        fx_spread: 0,
        income_yield_us_stocks: 0,
        income_yield_us_bonds: 0,
      });
      d.budget = {
        annual: expected.years[0].withdrawal_usd,
        included_health: 0,
      };
      d.accounts = [
        {
          name: 'history_roth',
          type: 'after_tax',
          owner: 'A',
          share_A: 1,
          balance: 100000,
          allocation: { us_stocks: 0.4, us_bonds: 0.6, usd_cash: 0 },
        },
        { ...d.accounts![0], balance: 0 },
      ];
      d.withdrawals = {
        ...d.withdrawals,
        surplus_account: 'control_cash',
      };
      const request = makeRunRequest(validated(d), references),
        rows = prepareMarket(request.scenario, references);
      const ids = new Int32Array(
          expected.years.map((y) =>
            rows.findIndex((r) => r.year === y.source_year),
          ),
        ),
        zeros = new Float64Array(ids.length);
      const market = buildMarket(request.scenario, rows, ids, zeros, zeros, 0),
        replay = replayPathLedger(request, references, 0, market);
      expect(replay.years).toHaveLength(expected.years.length);
      for (let t = 0; t < expected.years.length; t++) {
        const year = expected.years[t],
          report = replay.years[t].report;
        expect(report.starting_liquid_usd).toBeCloseTo(year.opening_usd, 8);
        expect(report.annual_investment_return).toBeCloseTo(year.return, 12);
        expect(
          replay.ledger[t * LEDGER_FIELDS.length + LI.withdraw_usd],
        ).toBeCloseTo(year.withdrawal_usd, 8);
        expect(
          replay.ledger[t * LEDGER_FIELDS.length + LI.liquid_usd],
        ).toBeCloseTo(year.ending_usd, 8);
      }
      expect(
        replay.ledger[
          (expected.years.length - 1) * LEDGER_FIELDS.length + LI.liquid_usd
        ],
      ).toBeCloseTo(expected.ending_usd, 8);
      evidence.push({
        scope,
        source_years: expected.years.map((y) => y.source_year),
        expected,
        actual: replay.years.map((y, t) => ({
          opening: y.report.starting_liquid_usd,
          return: y.report.annual_investment_return,
          ending: replay.ledger[t * LEDGER_FIELDS.length + LI.liquid_usd],
        })),
      });
    }
    mkdirSync('verification/records/M11', { recursive: true });
    writeFileSync(
      `verification/records/M11/historical-${name}.json`,
      JSON.stringify(
        {
          status: 'PASS',
          source_sha256: REFERENCE_PROVENANCE.source_sha256,
          scope:
            'Actual calendar return tape through the year engine; 40% stocks / 60% 10-year Treasuries, annually rebalanced; after-tax account, zero taxes/FX/China inflation, $0 or $10k beginning-year spend',
          evidence,
        },
        null,
        2,
      ) + '\n',
    );
  });
