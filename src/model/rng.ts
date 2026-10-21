import { sha256 } from '@noble/hashes/sha2.js';
import type { ScenarioConfig, PathDraws } from './types';
const rotate = (x: number, k: number) => ((x << k) | (x >>> (32 - k))) >>> 0;
export function xoshiro(state: readonly number[]) {
  const s = Array.from(state, (n) => n >>> 0);
  if (s.length !== 4) throw new Error('Four uint32 state words required');
  return () => {
    const output = Math.imul(rotate(Math.imul(s[1], 5) >>> 0, 7), 9) >>> 0,
      t = (s[1] << 9) >>> 0;
    s[2] = (s[2] ^ s[0]) >>> 0;
    s[3] = (s[3] ^ s[1]) >>> 0;
    s[1] = (s[1] ^ s[2]) >>> 0;
    s[0] = (s[0] ^ s[3]) >>> 0;
    s[2] = (s[2] ^ t) >>> 0;
    s[3] = rotate(s[3], 11);
    return output;
  };
}
export function streamState(
  seed: number,
  pathId: number,
  component: string,
  entityId = '',
): number[] {
  const bytes = sha256(
      new TextEncoder().encode(
        JSON.stringify(['retire-rng-v1', seed, pathId, component, entityId]),
      ),
    ),
    view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const words = [0, 4, 8, 12].map((offset) => view.getUint32(offset, true));
  return words.some(Boolean) ? words : [1, 0, 0, 0];
}
export function uniformStream(
  seed: number,
  pathId: number,
  component: string,
  entityId = '',
) {
  const next = xoshiro(streamState(seed, pathId, component, entityId));
  return () => (next() + 0.5) / 4294967296;
}
export function normalPair(u: number, v: number): [number, number] {
  const r = Math.sqrt(-2 * Math.log(u)),
    a = 2 * Math.PI * v;
  return [r * Math.cos(a), r * Math.sin(a)];
}
export function normals(uniform: () => number, count: number) {
  const values = new Float64Array(count);
  for (let i = 0; i < count; i += 2) {
    const pair = normalPair(uniform(), uniform());
    values[i] = pair[0];
    if (i + 1 < count) values[i + 1] = pair[1];
  }
  return values;
}
export function makeDraws(
  s: ScenarioConfig,
  pathId: number,
  horizon: number,
): PathDraws {
  const seed = s.simulation.seed;
  const person = <T>(f: (id: 'A' | 'B') => T) => ({ A: f('A'), B: f('B') });
  return {
    medical_occurrence: person((id) => {
      const u = uniformStream(seed, pathId, 'medical_occurrence', id);
      return Float64Array.from({ length: horizon }, () => u());
    }),
  };
}
export function bootstrapIndices(
  count: number,
  rows: number,
  blockMean: number,
  u: () => number,
) {
  const result = new Int32Array(count);
  result[0] = Math.floor(u() * rows);
  for (let t = 1; t < count; t++) {
    const jump = u(),
      candidate = u();
    result[t] =
      jump < 1 / blockMean
        ? Math.floor(candidate * rows)
        : (result[t - 1] + 1) % rows;
  }
  return result;
}
