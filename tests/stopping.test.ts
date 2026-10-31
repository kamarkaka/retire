import { it, expect } from 'vitest';
import {
  createControlDraft,
  createExampleDraft,
} from '../src/config/constructors';
import { validateScenario, makeRunRequest } from '../src/config/config';
import { ZERO_RETURN_TAPE } from '../verification/market-tapes';
import { replayPathLedger, simulatePath } from '../src/model/engine';
import { generateMarketPath } from '../src/model/market';
import { simulateChunk, summarizeResults } from '../src/model/results';
import { FI, II, BI, LI, LEDGER_FIELDS } from '../src/model/layout';
import type { DraftScenario } from '../src/model/types';

function draft() {
  const d = createControlDraft();
  d.simulation = { ...d.simulation, n_paths: 1, max_age: 43 };
  d.market!.fx_spot = d.market!.fx_fair_value = 1;
  d.market!.home_cpi_mean = d.market!.home_cpi_start = 0;
  d.budget = { annual: 0, included_health: 0 };
  return d;
}
function request(d: DraftScenario) {
  const v = validateScenario(d, ZERO_RETURN_TAPE);
  if (!v.ok) throw new Error(JSON.stringify(v.issues));
  return makeRunRequest(v.value.scenario, ZERO_RETURN_TAPE);
}
function property(d: DraftScenario, value: number, mortgage = 0) {
  d.properties = [
    {
      ...createExampleDraft().properties![0],
      value,
      cost_basis: value,
      depreciation_taken: 0,
      mortgage_balance: mortgage,
      mortgage_rate: 0,
      mortgage_years_left: 100,
      rent_monthly: 0,
      maintenance_annual: 0,
      property_tax_annual: 0,
      insurance_annual: 0,
      hoa_monthly: 0,
      strategy: 'hold',
    },
  ];
}

it('M08: zero starting net assets stop before any cash flows', () => {
  const d = draft();
  d.accounts![0].balance = 0;
  const req = request(d),
    replay = replayPathLedger(req, ZERO_RETURN_TAPE, 0),
    compact = simulatePath(req, ZERO_RETURN_TAPE, 0);
  expect(replay.years).toHaveLength(0);
  expect(replay.stop).toEqual({
    reason: 'net_assets_nonpositive',
    year: 2026,
    year_index: -1,
    net_worth_cny: 0,
  });
  expect(Array.from(replay.ledger).every(Number.isNaN)).toBe(true);
  expect(Array.from(compact.charts).every(Number.isNaN)).toBe(true);
  expect(compact.summary.integers[II.active_years]).toBe(0);
  expect(compact.summary.integers[II.terminal_t]).toBe(-1);
  expect(compact.summary.flags[BI.depleted]).toBe(1);
  expect(compact.summary.floats[FI.terminal_home_index]).toBe(1);
  expect(compact.summary.floats[FI.terminal_net_heirs_cny_real]).toBe(0);
});

it('M08: negative initial net worth includes property mortgages and stops before selling or charging expenses', () => {
  const d = draft();
  d.accounts![0].balance = 50;
  property(d, 100, 200);
  d.properties![0].strategy = 'sell_year';
  d.properties![0].sell_year = 2026;
  const req = request(d),
    replay = replayPathLedger(req, ZERO_RETURN_TAPE, 0),
    compact = simulatePath(req, ZERO_RETURN_TAPE, 0);
  expect(replay.years).toHaveLength(0);
  expect(replay.stop.net_worth_cny).toBe(-50);
  expect(compact.summary.floats[FI.terminal_signed_net_cny_real]).toBe(-50);
});

it('M08: a property loss can make total net assets negative; no subsequent returns, spending or tax year executes', () => {
  const d = draft();
  d.accounts![0].balance = 100;
  property(d, 1000, 900);
  const req = request(d),
    market = generateMarketPath(req.scenario, ZERO_RETURN_TAPE, 0);
  market.us_home.set([-0.5, 10, 10, 10]);
  const replay = replayPathLedger(req, ZERO_RETURN_TAPE, 0, market);
  expect(replay.years).toHaveLength(1);
  expect(replay.stop.reason).toBe('net_assets_nonpositive');
  expect(replay.stop.net_worth_cny).toBe(-300);
  expect(replay.years[0].terminal!.assets_cny).toBe(-300);
  expect(replay.years[0].terminal!.net_to_heirs_cny).toBe(0);
  expect(replay.ledger[LI.net_worth_cny]).toBe(-300);
  expect(replay.ledger[LEDGER_FIELDS.length + LI.year]).toBeNaN();
});

it('M08 M09: exhausted paths contribute zero to later wealth percentiles and remain funding failures', () => {
  const d = draft();
  d.accounts![0].balance = 100;
  d.budget!.annual = 50;
  const req = request(d),
    chunk = simulateChunk(req, ZERO_RETURN_TAPE, 0, 1),
    aggregate = summarizeResults(
      req,
      chunk.charts,
      chunk.summaries,
      chunk.market_samples,
    );
  expect(chunk.summaries.integers[II.active_years]).toBe(2);
  expect(aggregate.success_probability).toBe(0);
  expect(Array.from(aggregate.nominal_bands)).toEqual([
    50, 50, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ]);
  expect(Array.from(aggregate.yearly_success_probability)).toEqual([
    1, 0, 0, 0,
  ]);
});

it('M08: zero liquid assets alone do not end a path that still has positive property equity', () => {
  const d = draft();
  d.accounts![0].balance = 0;
  property(d, 100000);
  d.budget!.annual = 10000;
  const req = request(d),
    replay = replayPathLedger(req, ZERO_RETURN_TAPE, 0);
  expect(replay.years).toHaveLength(4);
  expect(replay.stop.reason).toBe('max_age');
  expect(
    replay.years.every(
      (_, t) =>
        replay.ledger[t * LEDGER_FIELDS.length + LI.liquid_usd] === 0 &&
        replay.ledger[t * LEDGER_FIELDS.length + LI.net_worth_cny] === 100000,
    ),
  ).toBe(true);
});
