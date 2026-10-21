import { describe, it, expect } from 'vitest';
import oracles from '../verification/fixtures/oracles.json' with { type: 'json' };
import {
  runProductCase,
  compareActual,
  RETIRED_CASE_IDS,
  type VerificationCase,
} from '../src/verification/cases';
describe('M00 independent numeric oracles exercised by the product', () => {
  for (const fixture of oracles.cases.filter(
    (c) => c.oracle_kind === 'numeric' && !RETIRED_CASE_IDS.includes(c.id),
  ))
    it(fixture.id, () => {
      const c = fixture as unknown as VerificationCase,
        result = runProductCase(c);
      expect(
        compareActual(
          c.expected,
          result.actual,
          c.tolerance,
          result.excluded_expected_fields,
        ),
      ).toEqual([]);
    });
});
