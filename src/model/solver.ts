import type { ScenarioConfig } from './types';

export const SOLVER_TARGETS = [0.5, 0.9, 0.99, 1] as const;

export interface SolveOutcome {
  /** Solved value, or null when the cap/floor was reached first. */
  value: number | null;
  capped: boolean;
  evals: number;
}

/**
 * Bisect a monotone step function to the smallest x with f(x) >= target
 * (increasing) or the largest x with f(x) >= target (decreasing).
 * Callers must bracket first: f(lo) < target <= f(hi) for increasing, with
 * lo/hi swapped for decreasing. Stops when the bracket is within tol.
 */
export async function bisect(
  f: (x: number) => Promise<number>,
  target: number,
  lo: number,
  hi: number,
  tol: number,
  increasing: boolean,
  onEval?: (x: number, y: number) => void,
): Promise<SolveOutcome> {
  let evals = 0;
  for (let i = 0; i < 200 && hi - lo > tol; i++) {
    const mid = (lo + hi) / 2,
      y = await f(mid);
    evals++;
    onEval?.(mid, y);
    if (increasing ? y >= target : y < target) hi = mid;
    else lo = mid;
  }
  // Return the passing side: smallest passing x / largest passing x.
  return { value: increasing ? hi : lo, evals, capped: false };
}

export interface Bracket {
  lo: number;
  hi: number;
  evals: number;
  /** True when the cap/floor stopped the search before bracketing. */
  capped: boolean;
}

/** Double outward from start until f crosses target or the bound is hit. */
export async function bracket(
  f: (x: number) => Promise<number>,
  target: number,
  start: number,
  step: number,
  bound: number,
  increasing: boolean,
  onEval?: (x: number, y: number) => void,
): Promise<Bracket> {
  let evals = 0,
    edge = start,
    width = step;
  for (let i = 0; i < 100; i++) {
    const x = increasing ? edge + width : edge - width;
    if (increasing ? x >= bound : x <= bound) {
      const y = await f(bound);
      evals++;
      onEval?.(bound, y);
      if (increasing ? y >= target : y >= target)
        return increasing
          ? { lo: edge, hi: bound, evals, capped: false }
          : { lo: bound, hi: edge, evals, capped: false };
      return increasing
        ? { lo: edge, hi: bound, evals, capped: true }
        : { lo: bound, hi: edge, evals, capped: true };
    }
    const y = await f(x);
    evals++;
    onEval?.(x, y);
    if (increasing ? y >= target : y >= target)
      return increasing
        ? { lo: edge, hi: x, evals, capped: false }
        : { lo: x, hi: edge, evals, capped: false };
    edge = x;
    width *= 2;
  }
  return { lo: edge, hi: edge, evals, capped: true };
}

/** Solve f(x) >= target over x >= start (increasing) from a bracket. */
export async function solveIncreasing(
  f: (x: number) => Promise<number>,
  target: number,
  start: number,
  step: number,
  cap: number,
  tol: number,
  onEval?: (x: number, y: number) => void,
): Promise<SolveOutcome> {
  const atStart = await f(start);
  onEval?.(start, atStart);
  if (atStart >= target) return { value: start, evals: 1, capped: false };
  const b = await bracket(f, target, start, step, cap, true, onEval);
  if (b.capped) return { value: null, evals: 1 + b.evals, capped: true };
  const r = await bisect(f, target, b.lo, b.hi, tol, true, onEval);
  return { value: r.value, evals: 1 + b.evals + r.evals, capped: false };
}

/** Solve f(x) >= target over x <= start (decreasing) from a bracket. */
export async function solveDecreasing(
  f: (x: number) => Promise<number>,
  target: number,
  start: number,
  step: number,
  floor: number,
  tol: number,
  onEval?: (x: number, y: number) => void,
): Promise<SolveOutcome> {
  const atStart = await f(start);
  onEval?.(start, atStart);
  if (atStart >= target) return { value: start, evals: 1, capped: false };
  const b = await bracket(f, target, start, step, floor, false, onEval);
  if (b.capped) return { value: null, evals: 1 + b.evals, capped: true };
  const r = await bisect(f, target, b.lo, b.hi, tol, false, onEval);
  return { value: r.value, evals: 1 + b.evals + r.evals, capped: false };
}

/** Total investable assets across the three fixed accounts. */
export function investableAssets(s: ScenarioConfig): number {
  return s.accounts.reduce((n, a) => n + a.balance, 0);
}

/** Clone a scenario with extra USD added to the brokerage balance. */
export function withExtraAssets(
  s: ScenarioConfig,
  extraUsd: number,
): ScenarioConfig {
  const c = structuredClone(s);
  c.accounts[0].balance += extraUsd;
  return c;
}

/** Clone a scenario with the total annual budget set (medical fixed). */
export function withAnnualBudget(
  s: ScenarioConfig,
  annual: number,
): ScenarioConfig {
  const c = structuredClone(s);
  c.budget.annual = annual;
  return c;
}
