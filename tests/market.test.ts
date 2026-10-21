import { describe, it, expect } from 'vitest';
import {
  xoshiro,
  streamState,
  uniformStream,
  normalPair,
  bootstrapIndices,
  makeDraws,
} from '../src/model/rng';
import {
  generateMarketPath,
  buildMarket,
  prepareMarket,
} from '../src/model/market';
import {
  createControlDraft,
  createExampleDraft,
} from '../src/config/constructors';
import { validateScenario, makeRunRequest } from '../src/config/config';
import { references } from '../src/reference/bundle';
import { THREE_PERCENT_TAPE } from '../verification/market-tapes';
import type { ScenarioConfig } from '../src/model/types';
import { hashObject } from '../src/model/canonical';

function control(): ScenarioConfig {
  const r = validateScenario(createControlDraft(), references);
  if (!r.ok) throw new Error(JSON.stringify(r.issues));
  return r.value.scenario;
}
describe('M04 indexed market paths', () => {
  it('matches frozen integer and hash seed vectors', () => {
    const next = xoshiro([1, 2, 3, 4]);
    expect(Array.from({ length: 8 }, next)).toEqual([
      11520, 0, 5927040, 70819200, 2031721883, 1637235492, 1287239034,
      3734860849,
    ]);
    expect(streamState(42, 0, 'bootstrap')).toEqual([
      671445419, 2277645263, 1294543791, 1535083184,
    ]);
    const seeded = xoshiro(streamState(42, 0, 'bootstrap'));
    expect(Array.from({ length: 5 }, seeded)).toEqual([
      2406593643, 4039661935, 1310122810, 591680076, 881506770,
    ]);
    expect(normalPair(0.5, 0.5)[0]).toBeCloseTo(-1.1774100225154747, 12);
    expect(normalPair(0.5, 0.5)[1]).toBeCloseTo(0, 12);
  });
  it('consumes a jump and candidate every later year, jointly and with wraparound', () => {
    const tape = [0.95, 0.9, 0.1, 0.1, 0.25, 0.8, 0.99];
    let i = 0;
    expect(Array.from(bootstrapIndices(4, 10, 2, () => tape[i++]))).toEqual([
      9, 0, 2, 3,
    ]);
    expect(i).toBe(7);
  });
  it('uses beginning-year FX and end-year price indices without scheduled FX shocks', () => {
    const s = control();
    s.market.fx_drift = Math.log(0.99);
    const p = generateMarketPath(s, THREE_PERCENT_TAPE, 0);
    expect(p.fx[0]).toBe(6.69);
    expect(p.fx[10]).toBeCloseTo(6.0503160818089015, 12);
    expect(p.home_index[0]).toBe(1);
    expect(p.home_index[1]).toBe(1.04);
    expect(p.usd_index[1]).toBe(1.03);
  });
  it('generates AR(1) recurrence and fails strictly on invalid Gaussian factors', () => {
    const s = control();
    s.market.home_cpi_start = 0.02;
    s.market.home_cpi_phi = 0.5;
    const rows = prepareMarket(s, references),
      ids = new Int32Array([0, 1, 2]);
    const p = buildMarket(
      s,
      rows,
      ids,
      new Float64Array(3),
      new Float64Array(3),
      0,
    );
    expect(Array.from(p.home_cpi)).toEqual([0.03, 0.035, 0.037500000000000006]);
    s.market.home_cpi_sigma = 0.02;
    expect(() =>
      buildMarket(
        s,
        rows,
        ids,
        new Float64Array([-60, 0, 0]),
        new Float64Array(3),
        7,
      ),
    ).toThrow(/gross factor/);
  });
  it('keeps common latent streams across path counts, parameter changes and property order', () => {
    const s = control(),
      a = makeDraws(s, 17, 71);
    s.simulation.n_paths = 1000;
    s.medical.shock_enabled = true;
    const b = makeDraws(s, 17, 71);
    expect(a).toEqual(b);
    const u = uniformStream(42, 0, 'bootstrap');
    expect(u()).toBeGreaterThan(0);
    expect(u()).toBeLessThan(1);
  });
  it('freezes run snapshots, including the source data hashes', () => {
    const d = createExampleDraft(),
      v = validateScenario(d, references);
    if (!v.ok) throw new Error(JSON.stringify(v.issues));
    const req = makeRunRequest(v.value.scenario, references),
      hash = req.manifest.scenario_sha256;
    d.simulation!.seed = 77;
    expect(hashObject(req.scenario)).toBe(hash);
    expect(Object.isFrozen(req.scenario.people.A)).toBe(true);
    expect(req.manifest.reference_hashes).toEqual(references.hashes);
  });
});
