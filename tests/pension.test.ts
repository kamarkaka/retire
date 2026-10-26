import { describe, it, expect } from 'vitest';
import { createControlDraft } from '../src/config/constructors';
import { validateScenario, makeRunRequest } from '../src/config/config';
import { replayPathLedger } from '../src/model/engine';
import { LEDGER_FIELDS, LI } from '../src/model/layout';
import { arithmeticReferences } from '../verification/market-tapes';
import type { DraftScenario, PersonId } from '../src/model/types';

function run(
  setup: (d: DraftScenario) => void,
  opts: { rate?: number; nraPensionRate?: number } = {},
) {
  const d = createControlDraft();
  d.simulation!.max_age = 42;
  d.budget!.annual = d.budget!.included_health = 0;
  setup(d);
  const rate = opts.rate ?? 0.03,
    base = arithmeticReferences(rate, rate),
    refs =
      opts.nraPensionRate === undefined
        ? base
        : {
            ...base,
            tax_tables: {
              ...base.tax_tables,
              us: {
                ...base.tax_tables.us,
                nra: {
                  ...base.tax_tables.us.nra,
                  own_pension: opts.nraPensionRate,
                },
              },
            },
          };
  const v = validateScenario(d, refs);
  if (!v.ok) throw new Error(JSON.stringify(v.issues));
  return replayPathLedger(makeRunRequest(v.value.scenario, refs), refs, 0);
}
const bill = (
  r: ReturnType<typeof run>,
  t: number,
  f: 'tax_us_A' | 'tax_us_B' | 'tax_cn_A',
) => r.ledger[t * LEDGER_FIELDS.length + LI[f]];
const pensionOf = (r: ReturnType<typeof run>, t: number, id: PersonId) =>
  r.years[t].income[id].pension;

describe('pension and annuity income', () => {
  it('pays from the start age with no COLA when disabled', () => {
    const r = run((d) => {
      d.people!.A!.pension = { annual: 50000, start_age: 40, cola: false };
    });
    expect(pensionOf(r, 0, 'A')).toBe(50000);
    expect(pensionOf(r, 1, 'A')).toBe(50000);
    expect(pensionOf(r, 2, 'A')).toBe(50000);
  });
  it('gates payouts before the start age', () => {
    const r = run((d) => {
      d.people!.A!.pension = { annual: 50000, start_age: 41, cola: false };
    });
    expect(pensionOf(r, 0, 'A')).toBe(0);
    expect(pensionOf(r, 1, 'A')).toBe(50000);
  });
  it('grows COLA payouts with US inflation', () => {
    const r = run((d) => {
      d.people!.A!.pension = { annual: 50000, start_age: 40, cola: true };
    });
    expect(pensionOf(r, 0, 'A')).toBe(50000);
    expect(pensionOf(r, 1, 'A')).toBeCloseTo(51500, 8);
    expect(pensionOf(r, 2, 'A')).toBeCloseTo(53045, 8);
  });
  it('taxes resident pensions as ordinary US income', () => {
    // Zero returns isolate the pension from same-year interest on the
    // deposited cash, which is itself taxable.
    const plain = run(() => {}, { rate: 0 });
    const withPension = run(
      (d) => {
        d.people!.A!.pension = { annual: 50000, start_age: 40, cola: false };
      },
      { rate: 0 },
    );
    expect(bill(withPension, 0, 'tax_us_A')).toBeGreaterThan(
      bill(plain, 0, 'tax_us_A'),
    );
    const agiPlain = (plain.years[0].tax_detail.A as { agi: number }).agi,
      agiPension = (withPension.years[0].tax_detail.A as { agi: number }).agi;
    expect(agiPension - agiPlain).toBeCloseTo(50000, 8);
  });
  it('routes NRA pensions through the table flat rate', () => {
    const plain = run(
      (d) => {
        d.people!.B!.pension = { annual: 0, start_age: 40, cola: false };
      },
      { rate: 0, nraPensionRate: 0.3 },
    );
    const withPension = run(
      (d) => {
        d.people!.B!.pension = { annual: 100000, start_age: 40, cola: false };
      },
      { rate: 0, nraPensionRate: 0.3 },
    );
    expect(pensionOf(withPension, 0, 'B')).toBe(100000);
    expect(
      bill(withPension, 0, 'tax_us_B') - bill(plain, 0, 'tax_us_B'),
    ).toBeCloseTo(30000, 8);
  });
  it('never taxes the pension principal in China', () => {
    const plain = run(
      (d) => {
        d.people!.domicile = 'China';
      },
      { rate: 0 },
    );
    const withPension = run(
      (d) => {
        d.people!.domicile = 'China';
        d.people!.A!.pension = { annual: 50000, start_age: 40, cola: false };
      },
      { rate: 0 },
    );
    expect(bill(withPension, 0, 'tax_cn_A')).toBe(bill(plain, 0, 'tax_cn_A'));
  });
  it('rejects negative payouts and absurd start ages', () => {
    const bad = createControlDraft();
    bad.people!.A!.pension = { annual: -1, start_age: 200, cola: true };
    const v = validateScenario(bad, arithmeticReferences(0.03, 0.03));
    expect(v.ok).toBe(false);
    if (v.ok) throw new Error('bad pension should fail');
    expect(v.issues.some((i) => i.path === 'people.A.pension.annual')).toBe(
      true,
    );
    expect(v.issues.some((i) => i.path === 'people.A.pension.start_age')).toBe(
      true,
    );
  });
});
