import { sha256 } from '@noble/hashes/sha2.js';

export function canonicalText(value: unknown): string {
  function visit(v: unknown, inArray = false): unknown {
    if (v === undefined) {
      if (inArray) throw new Error('Undefined array element');
      return undefined;
    }
    if (typeof v === 'number') {
      if (!Number.isFinite(v)) throw new Error('Nonfinite canonical number');
      return Object.is(v, -0) ? 0 : v;
    }
    if (Array.isArray(v)) return v.map((x) => visit(x, true));
    if (v && typeof v === 'object') {
      if (ArrayBuffer.isView(v))
        throw new Error('Canonical manifest must contain plain data');
      return Object.fromEntries(
        Object.keys(v)
          .sort()
          .filter((k) => (v as Record<string, unknown>)[k] !== undefined)
          .map((k) => [k, visit((v as Record<string, unknown>)[k])]),
      );
    }
    if (v === null || typeof v === 'string' || typeof v === 'boolean') return v;
    throw new Error('Unsupported canonical value');
  }
  return JSON.stringify(visit(value));
}
export function hashBytes(bytes: Uint8Array): string {
  return Array.from(sha256(bytes), (x) => x.toString(16).padStart(2, '0')).join(
    '',
  );
}
export function hashText(text: string): string {
  return hashBytes(new TextEncoder().encode(text));
}
export function hashObject(value: unknown): string {
  return hashText(canonicalText(value));
}
export function freezePlain<T>(value: T): T {
  if (value && typeof value === 'object' && !ArrayBuffer.isView(value)) {
    Object.values(value).forEach(freezePlain);
    Object.freeze(value);
  }
  return value;
}
