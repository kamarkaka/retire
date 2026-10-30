import { it, expect } from 'vitest';
import {
  allocateResults,
  copyChunk,
  simulateChunk,
  summarizeResults,
  quantile,
  rankPaths,
} from '../src/model/results';
import {
  createExampleDraft,
  createControlDraft,
} from '../src/config/constructors';
import { validateScenario, makeRunRequest } from '../src/config/config';
import { references } from '../src/reference/bundle';
import { ZERO_RETURN_TAPE } from '../verification/market-tapes';
import {
  CHART_FIELDS,
  FLOAT_FIELDS,
  INT_FIELDS,
  FLAG_FIELDS,
  FI,
  II,
  BI,
  LI,
  LEDGER_FIELDS,
} from '../src/model/layout';
import { replayPathLedger } from '../src/model/engine';
import { generateMarketPath } from '../src/model/market';
import type { ScenarioConfig } from '../src/model/types';
function request(paths = 12) {
  const d = createExampleDraft();
  d.simulation!.n_paths = paths;
  const v = validateScenario(d, references);
  if (!v.ok) throw new Error(JSON.stringify(v.issues));
  return makeRunRequest(v.value.scenario, references);
}
it('M09 Type7, whole-cohort denominators and stable ranking match frozen examples', () => {
  expect(quantile([1, 2, 3, 4], 0.1)).toBe(1.3);
  expect(quantile([1, 2, 3, 4], 0.5)).toBe(2.5);
  expect(quantile([1, 2, 3, 4], 0.9)).toBe(3.7);
  expect(quantile([], 0.5)).toBeNull();
  expect(
    rankPaths([
      { id: 0, depletion_t: 5, terminal: 1000 },
      { id: 1, depletion_t: null, terminal: 200 },
      { id: 2, depletion_t: 3, terminal: 9999 },
      { id: 3, depletion_t: null, terminal: 100 },
    ]),
  ).toEqual([2, 0, 3, 1]);
  const req = request(5);
  const copy = { ...req, manifest: { ...req.manifest, horizon: 1 } };
  const r = allocateResults(5, 1);
  for (let id = 0; id < 5; id++) {
    r.charts[id * CHART_FIELDS.length] = id === 4 ? NaN : id + 1;
    r.summaries.integers[id * INT_FIELDS.length + II.first_depletion_t] =
      id === 3 ? 0 : -1;
    r.summaries.floats[
      id * FLOAT_FIELDS.length + FI.terminal_net_worth_cny_real
    ] = id + 1;
    r.summaries.flags[id * FLAG_FIELDS.length + BI.depleted] = id === 3 ? 1 : 0;
  }
  const a = summarizeResults(copy, r.charts, r.summaries, r.market_samples);
  expect(a.yearly_alive_not_depleted[0]).toBe(0.8);
  expect(a.success_probability).toBe(0.8);
});
it('M09 chunk size/order and path-count changes preserve every path and scalar', () => {
  const req = request(12),
    one = simulateChunk(req, references, 0, 12),
    assembled = allocateResults(12, req.manifest.horizon);
  for (const [start, end] of [
    [7, 12],
    [0, 3],
    [3, 7],
  ])
    copyChunk(
      assembled,
      simulateChunk(req, references, start, end),
      start,
      req.manifest.horizon,
    );
  expect(assembled).toEqual(one);
  const big = simulateChunk(request(20), references, 0, 20);
  expect(big.charts.slice(0, one.charts.length)).toEqual(one.charts);
  expect(big.summaries.floats.slice(0, one.summaries.floats.length)).toEqual(
    one.summaries.floats,
  );
  const a = summarizeResults(
      req,
      one.charts,
      one.summaries,
      one.market_samples,
    ),
    b = summarizeResults(
      req,
      assembled.charts,
      assembled.summaries,
      assembled.market_samples,
    );
  expect(a).toEqual(b);
});
it('M09 replay equals the compact path and preserves the versioned Float64 layout', () => {
  const req = request(20),
    chunk = simulateChunk(req, references, 17, 18),
    replay = replayPathLedger(req, references, 17);
  for (let t = 0; t < req.manifest.horizon; t++)
    for (let f = 0; f < CHART_FIELDS.length; f++) {
      const expected = Math.fround(
        replay.ledger[t * LEDGER_FIELDS.length + LI[CHART_FIELDS[f]]],
      );
      const actual = chunk.charts[t * CHART_FIELDS.length + f];
      if (Number.isNaN(expected)) expect(actual).toBeNaN();
      else expect(actual).toBe(expected);
    }
});
it('M11 withdrawal sequencing uses the actual loop: bad-first 77,500; good-first 82,000', () => {
  const d = createControlDraft() as unknown as ScenarioConfig;
  d.simulation.max_age = 61;
  d.people.A.birth_year = d.people.B!.birth_year = 1966;
  d.budget.annual = 0;
  d.budget.annual = 10000;
  d.budget.included_health = 0;
  d.market.fx_spot = d.market.fx_fair_value = 1;
  d.market.home_cpi_mean = d.market.home_cpi_start = 0;
  d.market.fx_spot = d.market.fx_fair_value = 1;
  d.accounts = [
    { ...d.accounts[0], balance: 0 },
    {
      name: 'after_tax',
      type: 'after_tax',
      balance: 100000,
      allocation: { us_stocks: 1 },
    },
    { ...d.accounts[2], balance: 0 },
  ];
  const v = validateScenario(d, ZERO_RETURN_TAPE);
  if (!v.ok) throw new Error(JSON.stringify(v.issues));
  const req = makeRunRequest(v.value.scenario, ZERO_RETURN_TAPE),
    m = generateMarketPath(req.scenario, ZERO_RETURN_TAPE, 0);
  m.us_stocks.set([-0.2, 0.25]);
  const a = replayPathLedger(req, ZERO_RETURN_TAPE, 0, m);
  expect(a.ledger[LEDGER_FIELDS.length + LI.liquid_usd]).toBe(77500);
  m.us_stocks.set([0.25, -0.2]);
  const b = replayPathLedger(req, ZERO_RETURN_TAPE, 0, m);
  expect(b.ledger[LEDGER_FIELDS.length + LI.liquid_usd]).toBe(82000);
});
