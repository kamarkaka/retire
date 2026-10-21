import { describe, it, expect } from 'vitest';
import {
  createControlDraft,
  createExampleDraft,
} from '../src/config/constructors';
import { validateScenario, makeRunRequest } from '../src/config/config';
import { replayPathLedger } from '../src/model/engine';
import { LEDGER_FIELDS, LI } from '../src/model/layout';
import { arithmeticReferences } from '../verification/market-tapes';

function run(opts: {
  couple: boolean;
  domicile: 'US' | 'China';
  aStatus: 'resident' | 'nonresident';
  bStatus: 'resident' | 'nonresident';
  balance?: number;
}) {
  const d = createControlDraft();
  d.simulation!.max_age = 42;
  d.people!.domicile = opts.domicile;
  d.people!.A!.us_citizen = opts.aStatus === 'resident';
  d.people!.A!.us_income_tax_status = opts.aStatus;
  if (!opts.couple) delete d.people!.B;
  else {
    d.people!.B!.us_citizen = opts.bStatus === 'resident';
    d.people!.B!.us_income_tax_status = opts.bStatus;
  }
  const account = d.accounts![0];
  if (account.type !== 'brokerage')
    throw new Error('Expected brokerage control');
  account.balance = opts.balance ?? 5000000;
  d.budget!.annual = d.budget!.included_health = 0;
  d.market!.fx_spot = d.market!.fx_fair_value = 1;
  d.market!.home_cpi_mean = d.market!.home_cpi_start = 0;
  const refs = arithmeticReferences(0.03, 0),
    v = validateScenario(d, refs);
  if (!v.ok) throw new Error(JSON.stringify(v.issues));
  const req = makeRunRequest(v.value.scenario, refs),
    r = replayPathLedger(req, refs, 0);
  const at = (t: number, f: number) => r.ledger[t * LEDGER_FIELDS.length + f];
  return {
    req,
    years: r.years.length,
    bill: {
      usA: at(1, LI.tax_us_A),
      usB: at(1, LI.tax_us_B),
      cnA: at(1, LI.tax_cn_A),
      cnB: at(1, LI.tax_cn_B),
    },
    absent: { ageB: at(1, LI.age_B), aliveB: at(1, LI.alive_B) },
  };
}
// Reference-table hand derivations (3% arithmetic tape, $5M cash at MFS/single schedules):
// year-1 interest is about $153.6k solo ($76.8k per joint half); MFS tax on $76.8k is $8,066.
// Cash growth is taxed as interest with stepped-up basis, so tax-payment withdrawals add no gains.
// China bills are net of the same-year US credit: $15,360 raw less $8,066 eligible paid = $7,294.
// single/MFS coincide below $105,700 but NIIT thresholds differ (single $200k, MFS $125k).
describe('one-or-two-person households with one domicile country', () => {
  it('runs a one-person US household with absent-person sentinels', () => {
    const r = run({
      couple: false,
      domicile: 'US',
      aStatus: 'resident',
      bStatus: 'nonresident',
    });
    expect(r.years).toBe(3);
    expect(r.req.manifest.start_age_B).toBe(-1);
    expect(r.req.manifest.horizon).toBe(3);
    expect(r.absent).toEqual({ ageB: -1, aliveB: 0 });
    expect(r.bill.usA).toBeCloseTo(25635.9152, 4);
    expect(r.bill.usB).toBe(0);
    expect(r.bill.cnA).toBe(0);
    expect(r.bill.cnB).toBe(0);
  });
  it('uses single-filer US schedules for one person and married-separate for two', () => {
    const single = run({
      couple: false,
      domicile: 'US',
      aStatus: 'resident',
      bStatus: 'nonresident',
    });
    // The couple holds twice the balance so A's even half earns the same
    // income the single filer earns in full.
    const couple = run({
      couple: true,
      domicile: 'US',
      aStatus: 'resident',
      bStatus: 'nonresident',
      balance: 10000000,
    });
    // Same starting income; the couple pays more because the MFS NIIT threshold ($125k) bites while single ($200k) does not.
    // The joint pool also funds A's tax from shared capital, so A's year-1 base runs slightly above the single trajectory.
    expect(single.bill.usA).toBeCloseTo(25635.9152, 4);
    expect(couple.bill.usA).toBeCloseTo(26827.89772, 4);
    expect(couple.bill.usA).toBeGreaterThan(single.bill.usA);
  });
  it('routes China tax by household domicile for every member', () => {
    const china = run({
      couple: true,
      domicile: 'China',
      aStatus: 'resident',
      bStatus: 'nonresident',
    });
    // Shared $5M pool: each earns $76,800 in year 1. A pays MFS $8,066 with $7,294 China due after the same-year credit;
    // NRA B pays no US tax and the full $15,360 China bill.
    expect(china.bill.usA).toBeCloseTo(8066, 4);
    expect(china.bill.usB).toBe(0);
    expect(china.bill.cnA).toBeCloseTo(7294, 4);
    expect(china.bill.cnB).toBeCloseTo(15360, 4);
    const us = run({
      couple: true,
      domicile: 'US',
      aStatus: 'resident',
      bStatus: 'nonresident',
    });
    expect(us.bill.cnA).toBe(0);
    expect(us.bill.cnB).toBe(0);
    expect(us.bill.usA).toBeGreaterThan(0);
  });
  it('selects the resident or NRA branch per member in every household', () => {
    const bResident = run({
      couple: true,
      domicile: 'China',
      aStatus: 'resident',
      bStatus: 'resident',
    });
    expect(bResident.bill.usA).toBeCloseTo(8066, 4);
    expect(bResident.bill.usB).toBeCloseTo(8066, 4);
    expect(bResident.bill.cnA).toBeCloseTo(7294, 4);
    expect(bResident.bill.cnB).toBeCloseTo(7294, 4);
    const aResident = run({
      couple: false,
      domicile: 'China',
      aStatus: 'resident',
      bStatus: 'nonresident',
    });
    expect(aResident.bill.usA).toBeCloseTo(25598, 4);
    expect(aResident.bill.usB).toBe(0);
    expect(aResident.bill.cnA).toBeCloseTo(5122, 4);
    expect(aResident.bill.cnB).toBe(0);
    const aNra = run({
      couple: false,
      domicile: 'China',
      aStatus: 'nonresident',
      bStatus: 'nonresident',
    });
    expect(aNra.bill.usA).toBe(0);
    expect(aNra.bill.usB).toBe(0);
    expect(aNra.bill.cnA).toBeCloseTo(30720, 4);
    expect(aNra.bill.cnB).toBe(0);
    const bNraUS = run({
      couple: true,
      domicile: 'US',
      aStatus: 'resident',
      bStatus: 'nonresident',
    });
    expect(bNraUS.bill.usB).toBe(0);
    expect(bNraUS.bill.usA).toBeGreaterThan(0);
  });
  it('rejects second-person references in a one-person household', () => {
    const owned = createControlDraft();
    delete owned.people!.B;
    expect(validateScenario(owned, arithmeticReferences(0.03, 0)).ok).toBe(
      true,
    );
    // Ownership keys are retired; any per-account owner is an unknown key.
    const joint = createControlDraft();
    delete joint.people!.B;
    (joint.accounts![0] as Record<string, unknown>).owner = 'joint';
    const vJoint = validateScenario(joint, arithmeticReferences(0.03, 0));
    if (vJoint.ok) throw new Error('retired owner key should fail');
    expect(
      vJoint.issues.some(
        (i) => i.code === 'unknown_key' && i.path === 'accounts.0.owner',
      ),
    ).toBe(true);
    const soleB = createControlDraft();
    delete soleB.people!.B;
    (soleB.accounts![0] as Record<string, unknown>).owner = 'B';
    expect(validateScenario(soleB, arithmeticReferences(0.03, 0)).ok).toBe(
      false,
    );
    const care = createControlDraft();
    delete care.people!.B;
    care.medical!.late_life_care = {
      enabled: true,
      start_age: 60,
      age_of: 'B',
      monthly: 1000,
      real_growth: 0,
    } as never;
    const vCare = validateScenario(care, arithmeticReferences(0.03, 0));
    if (vCare.ok) throw new Error('removed care selector should fail');
    expect(
      vCare.issues.some(
        (i) =>
          i.code === 'unknown_key' &&
          i.path === 'medical.late_life_care.age_of',
      ),
    ).toBe(true);
    const example = createExampleDraft();
    delete example.people!.B;
    const vExample = validateScenario(example, arithmeticReferences(0.03, 0));
    if (vExample.ok)
      throw new Error('example second-person holdings should fail');
    expect(
      vExample.issues.some((i) => i.path === 'properties[0].share_A'),
    ).toBe(true);
    const emptyB = createControlDraft();
    emptyB.people!.B = {};
    const vEmpty = validateScenario(emptyB, arithmeticReferences(0.03, 0));
    if (vEmpty.ok) throw new Error('empty B should fail');
    expect(vEmpty.issues.some((i) => i.path === 'people.B.birth_year')).toBe(
      true,
    );
  });
});
