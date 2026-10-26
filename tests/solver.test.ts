import { describe, it, expect } from 'vitest';
import {
  bisect,
  bracket,
  solveIncreasing,
  solveDecreasing,
  investableAssets,
  withExtraAssets,
  withAnnualBudget,
} from '../src/model/solver';
import { createControlDraft } from '../src/config/constructors';

const mock = (fn: (x: number) => number) => async (x: number) => fn(x);

describe('bisection solver', () => {
  it('finds the smallest passing x for an increasing step function', async () => {
    // Jumps to 1.0 at x = 250000.
    const f = mock((x) => (x >= 250000 ? 1 : 0.4));
    const r = await solveIncreasing(f, 0.9, 0, 100000, 10_000_000, 1000);
    expect(r.capped).toBe(false);
    expect(r.value!).toBeGreaterThanOrEqual(250000);
    expect(r.value!).toBeLessThanOrEqual(251000);
    expect(r.evals).toBeLessThan(40);
  });
  it('returns start when the target is already met', async () => {
    const f = mock(() => 0.95);
    const r = await solveIncreasing(f, 0.9, 0, 100000, 10_000_000, 1000);
    expect(r).toEqual({ value: 0, evals: 1, capped: false });
  });
  it('reports capped when the cap is reached first', async () => {
    const f = mock(() => 0.4);
    const r = await solveIncreasing(f, 0.9, 0, 100000, 500000, 1000);
    expect(r.value).toBe(null);
    expect(r.capped).toBe(true);
  });
  it('finds the largest passing x for a decreasing step function', async () => {
    // Passes while x <= 120000.
    const f = mock((x) => (x <= 120000 ? 1 : 0.3));
    const r = await solveDecreasing(f, 0.9, 300000, 50000, -100000, 100);
    expect(r.capped).toBe(false);
    expect(r.value!).toBeLessThanOrEqual(120000);
    expect(r.value!).toBeGreaterThanOrEqual(119900);
  });
  it('returns start for decreasing when already met', async () => {
    const f = mock(() => 1);
    const r = await solveDecreasing(f, 0.9, 300000, 50000, -100000, 100);
    expect(r).toEqual({ value: 300000, evals: 1, capped: false });
  });
  it('reports capped when the floor is reached first', async () => {
    const f = mock(() => 0.1);
    const r = await solveDecreasing(f, 0.9, 300000, 50000, 0, 100);
    expect(r.value).toBe(null);
    expect(r.capped).toBe(true);
  });
  it('brackets outward with doubling steps', async () => {
    const seen: number[] = [];
    const f = mock((x) => {
      seen.push(x);
      return x >= 75000 ? 1 : 0;
    });
    const b = await bracket(f, 0.9, 0, 10000, 10_000_000, true);
    expect(b.capped).toBe(false);
    expect(b.lo).toBeLessThan(75000);
    expect(b.hi).toBeGreaterThanOrEqual(75000);
    expect(seen).toEqual([10000, 30000, 70000, 150000]);
  });
  it('bisect honors the tolerance on a smooth function', async () => {
    const f = mock((x) => x / 1000000);
    const r = await bisect(f, 0.5, 0, 1000000, 100, true);
    expect(r.value).toBeGreaterThanOrEqual(500000);
    expect(r.value).toBeLessThanOrEqual(500100);
  });
});

describe('solver scenario variants', () => {
  it('tops up the brokerage account without touching the rest', () => {
    const d = createControlDraft() as never as Parameters<
      typeof withExtraAssets
    >[0];
    const before = investableAssets(d);
    expect(before).toBeGreaterThan(0);
    const v = withExtraAssets(d, 250000);
    expect(v.accounts[0].balance).toBe(d.accounts[0].balance + 250000);
    expect(investableAssets(v)).toBe(before + 250000);
    // The source scenario is untouched.
    expect(d.accounts[0].balance).toBe(
      before - d.accounts[1].balance - d.accounts[2].balance,
    );
  });
  it('sets the annual budget while keeping medical fixed', () => {
    const d = createControlDraft() as never as Parameters<
      typeof withAnnualBudget
    >[0];
    const v = withAnnualBudget(d, 123456);
    expect(v.budget.annual).toBe(123456);
    expect(v.budget.included_health).toBe(d.budget.included_health);
    expect(d.budget.annual).not.toBe(123456);
  });
});
