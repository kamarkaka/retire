import { FLOAT_FIELDS } from './layout';
import { quantileSorted } from './results';

export interface PairedComparison {
  n_paths: number;
  direction: 'current_minus_baseline';
  deltas: Record<
    string,
    {
      p10: number | null;
      p50: number | null;
      p90: number | null;
      paired_count: number;
    }
  >;
}

// Decisions and scalar differences use the retained Float64 summaries, never chart values.
export function comparePairedSummaries(
  baseline: Float64Array,
  current: Float64Array,
  paths: number,
): PairedComparison {
  const width = FLOAT_FIELDS.length;
  if (
    !Number.isSafeInteger(paths) ||
    paths < 1 ||
    baseline.length !== paths * width ||
    current.length !== paths * width
  ) {
    throw new Error('Paired summary shape mismatch');
  }
  const work = new Float64Array(paths);
  const deltas: PairedComparison['deltas'] = {};
  for (let field = 0; field < width; field++) {
    let count = 0;
    for (let id = 0; id < paths; id++) {
      const a = baseline[id * width + field],
        b = current[id * width + field];
      if (Number.isFinite(a) && Number.isFinite(b)) work[count++] = b - a;
    }
    const sorted = work.subarray(0, count).sort();
    deltas[FLOAT_FIELDS[field]] = {
      p10: quantileSorted(sorted, 0.1),
      p50: quantileSorted(sorted, 0.5),
      p90: quantileSorted(sorted, 0.9),
      paired_count: count,
    };
  }
  return { n_paths: paths, direction: 'current_minus_baseline', deltas };
}
