import { it, expect } from 'vitest';
import { comparePairedSummaries } from '../src/model/comparison';
import { FI, FLOAT_FIELDS } from '../src/model/layout';

it('M10 paired median is the median of matched differences, with independent Type7 values', () => {
  const a = new Float64Array(3 * FLOAT_FIELDS.length).fill(NaN),
    b = a.slice();
  [0, 100, 1000].forEach((v, id) => {
    a[id * FLOAT_FIELDS.length + FI.terminal_net_heirs_cny_real] = v;
  });
  [100, 90, 2000].forEach((v, id) => {
    b[id * FLOAT_FIELDS.length + FI.terminal_net_heirs_cny_real] = v;
  });
  expect(
    comparePairedSummaries(a, b, 3).deltas.terminal_net_heirs_cny_real,
  ).toEqual({ p10: 12, p50: 100, p90: 820, paired_count: 3 });
  expect(Array.from(a).filter(Number.isFinite)).toEqual([0, 100, 1000]);
});
it('M10 paired differences require both observations; missing-age cohorts remain missing', () => {
  const a = new Float64Array(2 * FLOAT_FIELDS.length).fill(NaN),
    b = a.slice();
  a[FI.net_worth_at_A85_cny_real] = 1;
  b[FLOAT_FIELDS.length + FI.net_worth_at_A85_cny_real] = 3;
  expect(
    comparePairedSummaries(a, b, 2).deltas.net_worth_at_A85_cny_real,
  ).toEqual({ p10: null, p50: null, p90: null, paired_count: 0 });
});
it('M10 comparison rejects incompatible buffer shapes', () => {
  expect(() =>
    comparePairedSummaries(new Float64Array(1), new Float64Array(1), 1),
  ).toThrow('shape mismatch');
});
