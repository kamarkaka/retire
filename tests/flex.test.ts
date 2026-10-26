import { describe, it, expect } from 'vitest';
import { createControlDraft } from '../src/config/constructors';
import { validateScenario, makeRunRequest } from '../src/config/config';
import { replayPathLedger } from '../src/model/engine';
import { flexMultiplier } from '../src/model/consumption';
import { LEDGER_FIELDS, LI } from '../src/model/layout';
import { arithmeticReferences } from '../verification/market-tapes';
import type { DraftScenario } from '../src/model/types';

function run(rate: number, setup: (d: DraftScenario) => void) {
  const d = createControlDraft();
  d.simulation!.max_age = 45;
  setup(d);
  const refs = arithmeticReferences(rate, rate);
  const v = validateScenario(d, refs);
  if (!v.ok) throw new Error(JSON.stringify(v.issues));
  return replayPathLedger(makeRunRequest(v.value.scenario, refs), refs, 0);
}
const col = (r: ReturnType<typeof run>, t: number, f: string) =>
  r.ledger[t * LEDGER_FIELDS.length + LI[f]];
const CUT = 0.2,
  RAISE = 0.15;
const flex = (d: DraftScenario) => {
  d.budget!.flex_enabled = true;
  d.budget!.flex_cut = CUT;
  d.budget!.flex_raise = RAISE;
};

describe('flexible spending', () => {
  it('bounds the multiplier and never crosses 1 in the wrong direction', () => {
    expect(flexMultiplier(NaN, 0.5, CUT, RAISE)).toBe(1);
    for (const u of [0, 0.25, 0.5, 0.75, 0.999]) {
      const up = flexMultiplier(0.03, u, CUT, RAISE);
      expect(up).toBeGreaterThanOrEqual(1);
      expect(up).toBeLessThanOrEqual(1 + RAISE);
      const down = flexMultiplier(-0.03, u, CUT, RAISE);
      expect(down).toBeLessThanOrEqual(1);
      expect(down).toBeGreaterThanOrEqual(1 - CUT);
      // A flat year counts as down: never over-spend without gains.
      expect(flexMultiplier(0, u, CUT, RAISE)).toBeLessThanOrEqual(1);
    }
    expect(flexMultiplier(0.03, 1, CUT, RAISE)).toBeCloseTo(1 + RAISE, 12);
    expect(flexMultiplier(-0.03, 1, CUT, RAISE)).toBeCloseTo(1 - CUT, 12);
  });
  it('holds year 0 at plan and flexes later years within bounds', () => {
    const r = run(0.03, flex);
    expect(col(r, 0, 'spend_mult')).toBe(1);
    for (let t = 1; t < r.years.length; t++) {
      const m = col(r, t, 'spend_mult');
      expect(m).toBeGreaterThanOrEqual(1 - CUT);
      expect(m).toBeLessThanOrEqual(1 + RAISE);
      // All-positive tape: every flexed year raises, never cuts.
      expect(m).toBeGreaterThanOrEqual(1);
    }
  });
  it('cuts after flat years and records the multiplier', () => {
    const r = run(0, flex);
    expect(col(r, 0, 'spend_mult')).toBe(1);
    for (let t = 1; t < r.years.length; t++) {
      const m = col(r, t, 'spend_mult');
      expect(m).toBeLessThanOrEqual(1);
      expect(m).toBeGreaterThanOrEqual(1 - CUT);
    }
    // At least one year draws a real cut (seeded draws are fixed).
    const cuts = r.years
      .map((_, t) => col(r, t, 'spend_mult'))
      .filter((m) => m < 1);
    expect(cuts.length).toBeGreaterThan(0);
  });
  it('pins the multiplier at 1 when disabled', () => {
    const r = run(0.03, () => {});
    for (let t = 0; t < r.years.length; t++)
      expect(col(r, t, 'spend_mult')).toBe(1);
  });
  it('leaves medical and one-time costs untouched', () => {
    const plain = run(0.03, () => {});
    const flexed = run(0.03, flex);
    expect(flexed.years.length).toBe(plain.years.length);
    for (let t = 0; t < plain.years.length; t++) {
      expect(col(flexed, t, 'medical_total_cny')).toBe(
        col(plain, t, 'medical_total_cny'),
      );
      expect(col(flexed, t, 'one_time_cny')).toBe(
        col(plain, t, 'one_time_cny'),
      );
      // But discretionary spend moves with the multiplier.
      expect(col(flexed, t, 'spend_cny')).toBeCloseTo(
        col(plain, t, 'spend_cny') * col(flexed, t, 'spend_mult'),
        8,
      );
    }
  });
  it('is deterministic for the same seed', () => {
    const a = run(0.03, flex),
      b = run(0.03, flex);
    expect([...a.ledger]).toEqual([...b.ledger]);
  });
  it('rejects out-of-range flex limits', () => {
    const d = createControlDraft();
    d.budget!.flex_enabled = true;
    d.budget!.flex_cut = 1.5;
    d.budget!.flex_raise = -0.1;
    const v = validateScenario(d, arithmeticReferences(0.03, 0.03));
    expect(v.ok).toBe(false);
    if (v.ok) throw new Error('bad flex limits should fail');
    expect(v.issues.some((i) => i.path === 'budget.flex_cut')).toBe(true);
    expect(v.issues.some((i) => i.path === 'budget.flex_raise')).toBe(true);
  });
});
