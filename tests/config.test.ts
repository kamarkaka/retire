import { describe, it, expect } from 'vitest';
import {
  parseScenario,
  normalizeScenario,
  exportScenario,
  canonicalScenarioText,
  validateScenario,
} from '../src/config/config';
import {
  createControlDraft,
  createExampleDraft,
  createHouseholdDraft,
  createEmptyDraft,
} from '../src/config/constructors';
import { hashObject } from '../src/model/canonical';
import tables from '../src/reference/tax-tables.json';
import type { DraftScenario } from '../src/model/types';
import { references } from '../src/reference/bundle';

describe('M02 portable draft configuration', () => {
  it('round trips constructors, text labels and omitted required values', () => {
    for (const draft of [
      createControlDraft(),
      createExampleDraft(),
      createHouseholdDraft(),
      createEmptyDraft(),
    ]) {
      const normalized = normalizeScenario(draft);
      expect(normalized.ok).toBe(true);
      const imported = parseScenario(exportScenario(draft));
      expect(imported.ok).toBe(true);
      if (imported.ok && normalized.ok)
        expect(hashObject(imported.value)).toBe(hashObject(normalized.value));
    }
    const d = createExampleDraft();
    d.properties![0].id = '南京 🏡 / $ 𠮷';
    const r = parseScenario(exportScenario(d));
    expect(r.ok && r.value.properties?.[0].id).toBe('南京 🏡 / $ 𠮷');
  });
  it('rejects syntax, unknown nested fields, NaN, fractional integers and oversized files', () => {
    for (const text of [
      'a = [',
      'schema_version=1\n[market]\nunknown=3',
      'schema_version=1\n[market]\nfx_spot=nan',
      'schema_version=1\n[simulation]\nn_paths=1.5',
      'schema_version=1\n[simulation]\nkind="typo"',
      'schema_version=1\n[simulation]\nkind="household"\nunknown=3',
      ' '.repeat(2097153),
    ])
      expect(parseScenario(text).ok).toBe(false);
  });
  it('rejects legacy simulation metadata instead of migrating it', () => {
    const draft = createExampleDraft();
    for (const kind of ['example', 'control', 'household']) {
      const legacy = {
        ...draft,
        simulation: {
          ...draft.simulation,
          kind,
          assumptions: ['Old free-text note'],
          unresolved_inputs: ['Old checklist item'],
          legal_rules_verified: true,
          verification_note: 'Old verification text',
        },
      };
      const parsed = parseScenario(exportScenario(legacy as DraftScenario));
      expect(parsed.ok).toBe(false);
      if (parsed.ok) throw new Error('legacy metadata should fail');
      expect(
        parsed.issues.some(
          (i) => i.code === 'unknown_key' && i.path === 'simulation.kind',
        ),
      ).toBe(true);
    }
  });
  it('rejects versionless files with no migration path', () => {
    const current = exportScenario(createExampleDraft()).replace(
      'schema_version = 1\n',
      '',
    );
    const r = parseScenario(current);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('versionless file should fail');
    expect(r.issues).toEqual([
      {
        code: 'unsupported_version',
        path: 'schema_version',
        message: 'Only schema version 1 is supported',
      },
    ]);
    expect(
      parseScenario('[simulation]\nkind="example"\n[[properties]]\nname="old"')
        .ok,
    ).toBe(false);
  });
  it('defaults last-resort sales on, drops the retired proceeds account on import, and rejects the retired liquid-below sale', () => {
    const empty = normalizeScenario(createEmptyDraft());
    expect(empty.ok).toBe(true);
    if (empty.ok)
      expect(empty.value.withdrawals?.last_resort_property_sale).toBe(true);
    const optedOut = createEmptyDraft();
    optedOut.withdrawals = { last_resort_property_sale: false };
    const kept = normalizeScenario(optedOut);
    expect(kept.ok).toBe(true);
    if (kept.ok)
      expect(kept.value.withdrawals?.last_resort_property_sale).toBe(false);
    const legacy = parseScenario(
      exportScenario(createExampleDraft()).replace(
        '[[properties]]\n',
        '[[properties]]\nproceeds_account = "pre_tax"\n',
      ),
    );
    expect(legacy.ok).toBe(true);
    if (legacy.ok)
      expect(legacy.value.properties![0]).not.toHaveProperty(
        'proceeds_account',
      );
    const labeled = createExampleDraft();
    labeled.properties![0].label = '123 Main St';
    const relabeled = parseScenario(exportScenario(labeled));
    expect(relabeled.ok).toBe(true);
    if (relabeled.ok)
      expect(relabeled.value.properties![0].label).toBe('123 Main St');
    expect(
      parseScenario(
        'schema_version=1\n[[properties]]\nstrategy="sell_when_liquid_below"',
      ).ok,
    ).toBe(false);
    expect(
      parseScenario('schema_version=1\n[[properties]]\nsell_liquid_years=3').ok,
    ).toBe(false);
  });
  it('canonicalizes keys by UTF16, preserves array order, distinguishes omissions and zero', () => {
    expect(
      canonicalScenarioText({ z: 1, a: [3, 2], n: -0, x: undefined }),
    ).toBe('{"a":[3,2],"n":0,"z":1}');
    expect(() => canonicalScenarioText([undefined])).toThrow();
    expect(hashObject({})).not.toBe(hashObject({ n: 0 }));
  });
  it('always runs on bundled reference tables with no per-draft overrides', () => {
    const v = validateScenario(createExampleDraft(), references);
    expect(v.ok).toBe(true);
    if (!v.ok) throw new Error(JSON.stringify(v.issues));
    expect(v.value.effective_tax_tables).toEqual(tables);
  });
});

it('M02 household baseline uses bundled reference tax rates', () => {
  expect(tables.us.rates[0]).toBe(0.1);
  expect(tables.us.std_deduction.mfs).toBe(16100);
  expect(tables.cn.flat_rate).toBe(0.2);
  expect(validateScenario(createHouseholdDraft(), references).ok).toBe(false);
});

it('rejects legacy mortality inputs instead of migrating them', () => {
  const d = createExampleDraft(),
    legacy = {
      ...d,
      people: {
        domicile: d.people!.domicile,
        A: {
          ...d.people!.A,
          gompertz_mode: 1,
          gompertz_dispersion: 1,
          death_age: 61,
        },
        B: {
          ...d.people!.B,
          gompertz_mode: 150,
          gompertz_dispersion: 100,
          death_age: 59,
        },
      },
    };
  const p = parseScenario(exportScenario(legacy as DraftScenario));
  expect(p.ok).toBe(false);
  if (p.ok) throw new Error('legacy mortality should fail');
  expect(
    p.issues.some(
      (i) => i.code === 'unknown_key' && i.path === 'people.A.death_age',
    ),
  ).toBe(true);
  for (const text of [
    'schema_version=1\n[people.A]\ndeath_age="bad"',
    'schema_version=1\n[people.A]\ngompertz_dispersion=nan',
  ])
    expect(parseScenario(text).ok).toBe(false);
});

it('rejects retired Social Security inputs from older files', () => {
  const d = createExampleDraft();
  const old = {
    ...d,
    social_security: {
      enabled: true,
      trust_fund_cut: 0.2,
      trust_fund_cut_year: 2048,
    },
    people: {
      domicile: d.people!.domicile,
      A: {
        ...d.people!.A,
        ss_monthly_usd: 2200,
        ss_claim_age: 67,
        ss_payable_abroad: true,
      },
      B: d.people!.B,
    },
  };
  const parsed = parseScenario(exportScenario(old as DraftScenario));
  expect(parsed.ok).toBe(false);
  if (parsed.ok) throw new Error('legacy SS should fail');
  expect(
    parsed.issues.some(
      (i) => i.code === 'unknown_key' && i.path === 'social_security',
    ),
  ).toBe(true);
  expect(
    parseScenario('schema_version=1\n[social_security]\nenabled="maybe"').ok,
  ).toBe(false);
});
it('rejects a retired budget mode from older files', () => {
  const d = createExampleDraft();
  for (const mode of ['initial', 'real_ceiling']) {
    const legacy = { ...d, budget: { ...d.budget, mode } };
    const parsed = parseScenario(exportScenario(legacy as DraftScenario));
    expect(parsed.ok).toBe(false);
    if (parsed.ok) throw new Error('legacy budget mode should fail');
    expect(
      parsed.issues.some(
        (i) => i.code === 'unknown_key' && i.path === 'budget.mode',
      ),
    ).toBe(true);
  }
  expect(parseScenario('schema_version=1\n[budget]\nmode="invalid"').ok).toBe(
    false,
  );
});
it('rejects retired per-person domicile inputs without consolidating them', () => {
  const d = createExampleDraft(),
    base = exportScenario(d).replace('domicile = "China"\n', '');
  for (const [a, b] of [
    ['China', 'China'],
    ['US', 'US'],
    ['US', 'China'],
  ] as const) {
    const raw = base
      .replace('[people.A]\n', `[people.A]\ndomicile = "${a}"\n`)
      .replace('[people.B]\n', `[people.B]\ndomicile = "${b}"\n`);
    const parsed = parseScenario(raw);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) throw new Error('legacy domicile should fail');
    expect(
      parsed.issues.some(
        (i) => i.code === 'unknown_key' && i.path === 'people.A.domicile',
      ),
    ).toBe(true);
  }
  expect(
    parseScenario('schema_version=1\n[people.A]\ncn_domiciled="maybe"').ok,
  ).toBe(false);
  expect(
    parseScenario('schema_version=1\n[people.A]\ncn_domiciled=true').ok,
  ).toBe(false);
});
it('rejects retired Section 1231 loss history from older files', () => {
  const d = createExampleDraft();
  const parsed = parseScenario(
    exportScenario(d) +
      '\n[[people.A.section1231_prior_losses]]\nincome_year=2025\namount=20000\n',
  );
  expect(parsed.ok).toBe(false);
  if (parsed.ok) throw new Error('legacy 1231 should fail');
  expect(parsed.issues.some((i) => i.code === 'unknown_key')).toBe(true);
});
it('rejects retired holding declarations from older files', () => {
  const d = createExampleDraft(),
    legacy = {
      ...d,
      holding_profiles: {
        legacy_1: {
          instrument_type: 'stock_fund',
          issuer_domicile: 'US',
          resident_income_kind: 'qualified_dividend',
          nra_income_kind: 'dividend',
          classification_basis: 'assumed',
          classification_note: 'legacy',
        },
      },
      accounts: d.accounts!.map((a) => ({
        ...a,
        holdings: {
          usd_cash: {
            instrument_type: 'x',
            issuer_domicile: 'US',
            resident_income_kind: 'ordinary_income',
            nra_income_kind: 'exempt_interest',
            classification_basis: 'assumed',
            classification_note: 'legacy',
          },
        },
        holding_profiles: { usd_cash: 'legacy_1' },
      })),
    };
  const parsed = parseScenario(exportScenario(legacy as DraftScenario));
  expect(parsed.ok).toBe(false);
  if (parsed.ok) throw new Error('legacy holdings should fail');
  expect(
    parsed.issues.some(
      (i) => i.code === 'unknown_key' && i.path === 'holding_profiles',
    ),
  ).toBe(true);
  expect(legacy.accounts[0]).toHaveProperty('holdings');
});
it('rejects retired account type names on import', () => {
  const d = createExampleDraft();
  const raw = exportScenario(d)
    .replaceAll('type = "brokerage"', 'type = "taxable"')
    .replaceAll('type = "pre_tax"', 'type = "trad"')
    .replaceAll('type = "after_tax"', 'type = "roth"')
    .replaceAll('type = "cash_cny"', 'type = "cny_cash"');
  expect(parseScenario(raw).ok).toBe(false);
  const saving = exportScenario(d).replace(
    'type = "brokerage"',
    'type = "savings"',
  );
  expect(parseScenario(saving).ok).toBe(false);
});
it('rejects retired Cash CNY interest fields from older files', () => {
  const d = createExampleDraft(),
    legacy = {
      ...d,
      market: { ...d.market, cny_cash_real_rate: 0.5, cny_cash_floor: 0.5 },
    };
  const parsed = parseScenario(exportScenario(legacy as DraftScenario));
  expect(parsed.ok).toBe(false);
  if (parsed.ok) throw new Error('legacy CNY interest should fail');
  expect(
    parsed.issues.some(
      (i) => i.code === 'unknown_key' && i.path === 'market.cny_cash_real_rate',
    ),
  ).toBe(true);
  expect(legacy.market.cny_cash_real_rate).toBe(0.5);
  expect(
    parseScenario('schema_version=1\n[market]\ncny_cash_real_rate="invalid"')
      .ok,
  ).toBe(false);
});
it('rejects a previous recurring-spending config instead of migrating it', () => {
  const d = createExampleDraft();
  const old = {
    ...d,
    spending: [
      { name: 'living', monthly: 23000, currency: 'CNY', flexible: true },
    ],
    spending_rule: { enabled: true, cut: 0.1 },
  };
  const p = parseScenario(exportScenario(old as DraftScenario));
  expect(p.ok).toBe(false);
  if (p.ok) throw new Error('legacy spending should fail');
  expect(
    p.issues.some((i) => i.code === 'unknown_key' && i.path === 'spending'),
  ).toBe(true);
  expect(
    parseScenario('schema_version=1\nspending=[{name="bad",monthly=nan}]').ok,
  ).toBe(false);
});

it.each<[string, (d: DraftScenario) => void]>([
  [
    'accounts.0.cost_basis',
    (d) => {
      const a = d.accounts![0];
      if (a.type !== 'brokerage') throw new Error('Expected taxable fixture');
      Object.assign(a, { cost_basis: -1 });
    },
  ],
  [
    'one_time[0].amount',
    (d) => {
      d.one_time = [
        {
          name: 'bad',
          year: 2030,
          amount: -1,
          currency: 'CNY',
        },
      ];
    },
  ],
  [
    'budget.annual',
    (d) => {
      d.budget!.annual = -1;
    },
  ],
  [
    'tax_tables',
    (d) => {
      (d as unknown as Record<string, unknown>).tax_tables = {
        us: { niit_rate: 0 },
      };
    },
  ],
])('M02 rejects invalid financial input at %s', (path, edit) => {
  const d = createExampleDraft();
  edit(d);
  const result = validateScenario(d, references);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.issues.some((i) => i.path === path)).toBe(true);
});

it('M02 derives hidden household facts from citizenship and household size', () => {
  const joint = createExampleDraft();
  delete joint.people!.A!.us_income_tax_status;
  delete joint.people!.B!.us_income_tax_status;
  delete joint.properties![0].share_A;
  const n = normalizeScenario(joint);
  expect(n.ok).toBe(true);
  if (!n.ok) throw new Error(JSON.stringify(n.issues));
  expect(n.value.people!.A!.us_income_tax_status).toBe('resident');
  expect(n.value.people!.B!.us_income_tax_status).toBe('nonresident');
  expect(n.value.properties![0].share_A).toBe(0.5);
  expect(validateScenario(joint, references).ok).toBe(true);

  const solo = createExampleDraft();
  delete solo.people!.B;
  delete solo.people!.A!.us_income_tax_status;
  delete solo.properties![0].share_A;
  const s = normalizeScenario(solo);
  expect(s.ok).toBe(true);
  if (!s.ok) throw new Error(JSON.stringify(s.issues));
  expect(s.value.properties![0].share_A).toBe(1);
  expect(validateScenario(solo, references).ok).toBe(true);

  // Explicit contradictions in hand-written TOML still block the run.
  const bad = createExampleDraft();
  bad.people!.A!.us_income_tax_status = 'nonresident';
  const v = validateScenario(bad, references);
  expect(v.ok).toBe(false);
  if (v.ok) throw new Error('citizen/nonresident should fail');
  expect(v.issues.some((i) => i.path === 'people.A.us_income_tax_status')).toBe(
    true,
  );
});
