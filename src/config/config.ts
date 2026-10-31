import { parse, stringify } from 'smol-toml';
import { fields, fieldTree, checkDraft, type SchemaNode } from './schema';
import { canonicalText, hashObject, freezePlain } from '../model/canonical';
import type {
  DraftScenario,
  ScenarioConfig,
  TaxTables,
  FieldIssue,
  Result,
  PublicReferenceBundle,
  RunnableScenario,
  RunRequest,
} from '../model/types';
import { FIXED_ACCOUNT_ORDER } from '../model/types';
import defaultTables from '../reference/tax-tables.json' with { type: 'json' };
import { BUILD_VERSION } from '../build-info';
import { LEDGER_REPORT_VERSION } from '../model/layout';

export const MAX_CONFIG_BYTES = 2 * 1024 * 1024;
type ObjectValue = Record<string, unknown>;
function defaultNode(node: SchemaNode, value: unknown, path: string): unknown {
  if (node.item)
    return Array.isArray(value)
      ? value.map((v, i) => defaultNode(node.item!, v, `${path}[${i}]`))
      : (value ?? []);
  if (node.wildcard)
    return Object.fromEntries(
      Object.entries((value ?? {}) as object).map(([k, v]) => [
        k,
        defaultNode(node.wildcard!, v, `${path}.${k}`),
      ]),
    );
  if (Object.keys(node.children).length) {
    const obj = structuredClone((value ?? {}) as ObjectValue);
    for (const [k, n] of Object.entries(node.children)) {
      // Conditional account keys must remain omitted for other wrappers.
      if (path.startsWith('accounts[')) {
        if (k === 'rule_of_55' && obj.type !== 'pre_tax') continue;
        if (k === 'allow_early_trad' && obj.type !== 'pre_tax') continue;
      }
      // B absent = one-person household; defaults must not materialize B.
      if (path === 'people' && k === 'B' && obj.B === undefined) continue;
      const next = defaultNode(n, obj[k], path ? `${path}.${k}` : k);
      if (
        next !== undefined &&
        (typeof next !== 'object' ||
          Array.isArray(next) ||
          Object.keys(next as object).length ||
          obj[k] !== undefined)
      )
        obj[k] = next;
    }
    return obj;
  }
  return (
    value ??
    (node.field?.default_kind === 'documented'
      ? structuredClone(node.field.default)
      : undefined)
  );
}
export function normalizeScenario(draft: DraftScenario): Result<DraftScenario> {
  const checked = checkDraft(draft);
  if (!checked.ok) return checked;
  const pre = checked.value as DraftScenario;
  // Explicit values are preserved so hand-written TOML still validates strictly.
  // Ownership derives before defaults: a missing one-person share must become
  // 1 rather than the joint default, while an explicit 0.5 must still fail.
  if (pre.properties && pre.people?.B === undefined)
    for (const p of pre.properties) if (p.share_A === undefined) p.share_A = 1;
  const normalized = defaultNode(fieldTree, pre, '') as DraftScenario;
  // Tax status derives after defaults so an unchecked citizenship box (which
  // defaults to non-citizen) still resolves to nonresident treatment. Every
  // non-citizen, green-card holders included, is modeled as an NRA for now.
  for (const id of ['A', 'B'] as const) {
    const p = normalized.people?.[id];
    if (p && p.us_income_tax_status === undefined) {
      if (p.us_citizen === true) p.us_income_tax_status = 'resident';
      else if (p.us_citizen === false) p.us_income_tax_status = 'nonresident';
    }
  }
  return { ok: true, value: normalized };
}
export function parseScenario(text: string): Result<DraftScenario> {
  if (new TextEncoder().encode(text).byteLength > MAX_CONFIG_BYTES)
    return {
      ok: false,
      issues: [
        { code: 'range', path: '', message: 'Configuration exceeds 2 MiB' },
      ],
    };
  let data: unknown;
  try {
    data = parse(text);
  } catch (e) {
    return {
      ok: false,
      issues: [
        {
          code: 'syntax',
          path: '',
          message: e instanceof Error ? e.message : String(e),
        },
      ],
    };
  }
  // Retired proceeds_account: sale proceeds always land in Non-retirement
  // liquid assets, so older files that still carry the key keep loading.
  const properties = (data as { properties?: unknown }).properties;
  if (Array.isArray(properties))
    for (const p of properties)
      if (p && typeof p === 'object') delete p.proceeds_account;
  const checked = checkDraft(data);
  if (!checked.ok) return checked;
  if (checked.value.schema_version !== 1)
    return {
      ok: false,
      issues: [
        {
          code: 'unsupported_version',
          path: 'schema_version',
          message: 'Only schema version 1 is supported',
        },
      ],
    };
  return normalizeScenario(checked.value);
}
export function exportScenario(draft: DraftScenario): string {
  const clean = JSON.parse(canonicalText(draft));
  return stringify(clean);
}
export const canonicalScenarioText = canonicalText;

function walkRequired(
  node: SchemaNode,
  value: unknown,
  path: string,
  issues: FieldIssue[],
): void {
  const required = node.field?.omission.startsWith('required');
  if (node.item) {
    if (!Array.isArray(value)) {
      issues.push({
        code: 'missing',
        path,
        message: 'Required list is missing',
      });
      return;
    }
    value.forEach((v, i) =>
      walkRequired(node.item!, v, `${path}[${i}]`, issues),
    );
    return;
  }
  if (node.wildcard) {
    if (value)
      Object.entries(value as object).forEach(([k, v]) =>
        walkRequired(node.wildcard!, v, `${path}.${k}`, issues),
      );
    return;
  }
  if (Object.keys(node.children).length) {
    const obj = (value ?? {}) as ObjectValue;
    for (const [k, n] of Object.entries(node.children)) {
      if (path.startsWith('accounts[') && k === 'rule_of_55') continue;
      if (path === 'people' && k === 'B' && obj.B === undefined) continue; // B absent = one-person household.
      walkRequired(n, obj[k], path ? `${path}.${k}` : k, issues);
    }
    return;
  }
  if (required && (value === undefined || value === '' || value === null))
    issues.push({
      code: 'missing',
      path,
      message: 'Required value is missing',
    });
}
export function validateScenario(
  draft: DraftScenario,
  refs: PublicReferenceBundle,
): Result<{
  scenario: RunnableScenario;
  effective_tax_tables: Readonly<TaxTables>;
}> {
  const result = normalizeScenario(draft);
  if (!result.ok) return result;
  const d = result.value,
    issues: FieldIssue[] = [];
  walkRequired(fieldTree, d, '', issues);
  const add = (
    path: string,
    message: string,
    code: FieldIssue['code'] = 'range',
  ) => issues.push({ path, message, code });
  const range = (
    v: number | undefined,
    lo: number,
    hi: number,
    path: string,
  ) => {
    if (v !== undefined && (v < lo || v > hi))
      add(path, `Must be between ${lo} and ${hi}`);
  };
  if (d.schema_version !== 1)
    add(
      'schema_version',
      'Only schema version 1 is supported',
      'unsupported_version',
    );
  const s = d.simulation,
    m = d.market;
  range(s?.n_paths, 1, 100000, 'simulation.n_paths');
  range(s?.seed, 0, 4294967295, 'simulation.seed');
  range(s?.start_year, 1900, 2200, 'simulation.start_year');
  range(s?.max_age, 18, 200, 'simulation.max_age');
  if (m) {
    const first = refs.history[0]?.year ?? 1928,
      last = refs.history.at(-1)?.year ?? 2025;
    range(m.sample_start, first, last, 'market.sample_start');
    range(m.sample_end, first, last, 'market.sample_end');
    if (m.sample_end! - m.sample_start! < 9)
      add('market.sample_end', 'Select at least 10 years');
    if (!(m.block_mean_years! >= 1))
      add('market.block_mean_years', 'Must be at least 1');
    range(m.outlook_shift, -0.1, 0.1, 'market.outlook_shift');
    for (const k of ['fx_spot', 'fx_fair_value'] as const)
      if (!(m[k]! > 0)) add(`market.${k}`, 'Must be positive');
    for (const k of [
      'home_cpi_phi',
      'fx_drift',
      'home_cpi_mean',
      'home_cpi_start',
      'medical_excess_inflation',
      'fx_real_trend',
    ] as const)
      range(
        m[k],
        k === 'fx_drift' ? -0.2 : -0.5,
        k === 'fx_drift' ? 0.2 : 0.5,
        `market.${k}`,
      );
    for (const k of ['home_cpi_sigma', 'fx_sigma'] as const)
      range(m[k], 0, 0.5, `market.${k}`);
    range(m.fx_adjust_speed, 0, 1, 'market.fx_adjust_speed');
    range(m.fx_spread, 0, 1 - Number.EPSILON, 'market.fx_spread');
    for (const k of [
      'income_yield_us_stocks',
      'income_yield_us_bonds',
    ] as const)
      range(m[k], 0, 1, `market.${k}`);
    range(
      m.fx_quota_usd_per_person,
      0,
      Number.MAX_VALUE,
      'market.fx_quota_usd_per_person',
    );
  }
  for (const id of ['A', 'B'] as const) {
    const p = d.people?.[id];
    if (!p) continue;
    const path = `people.${id}`,
      age = s?.start_year! - p.birth_year!;
    range(age, 18, 100, `${path}.birth_year`);
    range(p.pension?.annual, 0, Number.MAX_VALUE, `${path}.pension.annual`);
    range(p.pension?.start_age, 0, 120, `${path}.pension.start_age`);
    if (p.us_income_tax_status === 'unresolved')
      add(path, 'Resolve income residency', 'unsupported_status');
    if (p.us_citizen && p.us_income_tax_status !== 'resident')
      add(
        `${path}.us_income_tax_status`,
        'A US citizen uses the resident income-tax branch',
        'unsupported_status',
      );
    if (!p.us_citizen && p.us_income_tax_status === 'resident')
      add(
        path,
        'Non-US citizens, including green-card holders, use the nonresident (NRA) branch; the resident-alien branch is not implemented',
        'unsupported_status',
      );
  }
  const hasB = d.people?.B !== undefined;
  const births = [d.people?.A?.birth_year, d.people?.B?.birth_year].filter(
    (y): y is number => typeof y === 'number',
  );
  const youngest = s?.start_year! - Math.max(...births);
  if (births.length && s?.max_age! < youngest)
    add(
      'simulation.max_age',
      hasB
        ? 'Must cover the younger person’s starting age'
        : 'Must cover the person’s starting age',
    );
  const ids = d.properties?.map((x) => x.id);
  if (ids && (ids.some((x) => !x?.trim()) || new Set(ids).size !== ids.length))
    add('properties', 'Property IDs must be unique and nonempty', 'reference');
  const accounts = d.accounts ?? [];
  const fixedOk =
    accounts.length === FIXED_ACCOUNT_ORDER.length &&
    FIXED_ACCOUNT_ORDER.every(
      (name, i) => accounts[i].name === name && accounts[i].type === name,
    );
  if (!fixedOk)
    add(
      'accounts',
      'Accounts must be the fixed three in order: brokerage, after_tax, pre_tax',
      'reference',
    );
  accounts.forEach((a, i) => {
    const path = `accounts[${i}]`;
    range(a.balance, 0, Number.MAX_VALUE, `${path}.balance`);
    const ao = a as ObjectValue;
    const forbidden =
      a.type === 'pre_tax' ? [] : ['rule_of_55', 'allow_early_trad'];
    forbidden.forEach((k) => {
      if (ao[k] !== undefined)
        add(`${path}.${k}`, 'Key is forbidden for this account type');
    });
    if (!(a as { allocation?: unknown }).allocation)
      add(`${path}.allocation`, 'Required allocation is missing', 'missing');
    const allocation =
      (a as { allocation?: Record<string, number> }).allocation ?? {};
    if (
      Math.abs(
        Object.values(allocation).reduce<number>((n, v) => n + (v ?? 0), 0) - 1,
      ) > 1e-6 ||
      Object.values(allocation).some((v) => v! < 0)
    )
      add(`${path}.allocation`, 'Nonnegative allocation must sum to 1');
  });
  d.properties?.forEach((p, i) => {
    const path = `properties[${i}]`;
    for (const k of ['share_A', 'land_share', 'selling_cost'] as const)
      range(p[k], 0, 1, `${path}.${k}`);
    for (const k of [
      'value',
      'cost_basis',
      'depreciation_taken',
      'mortgage_balance',
      'mortgage_rate',
      'mortgage_years_left',
      'rent_monthly',
      'maintenance_annual',
      'property_tax_annual',
      'insurance_annual',
      'hoa_monthly',
    ] as const)
      range(p[k], 0, Number.MAX_VALUE, `${path}.${k}`);
    if (p.mortgage_balance! > 0 && !(p.mortgage_years_left! > 0))
      add(
        `${path}.mortgage_years_left`,
        'Positive mortgage requires remaining years',
      );
    if (!hasB && p.share_A !== undefined && p.share_A !== 1)
      add(
        `${path}.share_A`,
        'A one-person household holds every property fully as Person A',
      );
  });
  d.one_time?.forEach((v, i) =>
    range(v.amount, 0, Number.MAX_VALUE, `one_time[${i}].amount`),
  );
  range(d.budget?.annual, 0, Number.MAX_VALUE, 'budget.annual');
  range(d.budget?.flex_cut, 0, 1, 'budget.flex_cut');
  range(d.budget?.flex_raise, 0, 1, 'budget.flex_raise');
  range(
    d.budget?.included_health,
    0,
    Number.MAX_VALUE,
    'budget.included_health',
  );
  range(d.medical?.shock_prob_at_60, 0, 1, 'medical.shock_prob_at_60');
  if (!(d.medical?.shock_prob_doubling_years! > 0))
    add('medical.shock_prob_doubling_years', 'Must be positive');
  range(d.medical?.age_growth, -0.5, 0.5, 'medical.age_growth');
  range(d.medical?.shock_median, 0, Number.MAX_VALUE, 'medical.shock_median');
  const tables = defaultTables as unknown as TaxTables;
  const care = d.medical?.late_life_care;
  if (care?.enabled) {
    range(care.start_age, 0, 200, 'medical.late_life_care.start_age');
    range(care.monthly, 0, Number.MAX_VALUE, 'medical.late_life_care.monthly');
    range(care.real_growth, -0.5, 0.5, 'medical.late_life_care.real_growth');
  }
  if ((d.budget?.included_health ?? 0) > (d.budget?.annual ?? 0))
    add(
      'budget.included_health',
      'Included health cannot exceed the annual budget',
    );
  return issues.length
    ? { ok: false, issues }
    : {
        ok: true,
        value: {
          scenario: d as RunnableScenario,
          effective_tax_tables: freezePlain(tables),
        },
      };
}

export function makeRunRequest(
  scenario: RunnableScenario,
  refs: PublicReferenceBundle,
): RunRequest {
  const snapshot = structuredClone(scenario),
    tables = refs.tax_tables as TaxTables;
  const a = snapshot.simulation.start_year - snapshot.people.A.birth_year,
    b = snapshot.people.B
      ? snapshot.simulation.start_year - snapshot.people.B.birth_year
      : -1;
  return freezePlain({
    scenario: snapshot,
    effective_tax_tables: tables,
    manifest: {
      manifest_version: 'retire-manifest-v1',
      canonical_version: 'retire-canonical-v1',
      schema_version: 1,
      model_version: 'retire-model-v6',
      rng_version: 'retire-rng-v1',
      draw_version: 'retire-draws-v4',
      longevity_policy: 'both-alive-to-younger-max-age',
      stopping_policy: 'younger-max-age-or-nonpositive-net-worth',
      result_layout_version: 'retire-results-v2',
      ledger_report_version: LEDGER_REPORT_VERSION,
      build_version: BUILD_VERSION,
      scenario_sha256: hashObject(snapshot),
      effective_tax_tables_sha256: hashObject(tables),
      reference_versions: structuredClone(refs.versions),
      reference_hashes: structuredClone(refs.hashes),
      seed: snapshot.simulation.seed,
      n_paths: snapshot.simulation.n_paths,
      start_year: snapshot.simulation.start_year,
      start_age_A: a,
      start_age_B: b,
      horizon: snapshot.people.B
        ? Math.max(
            snapshot.simulation.max_age - a + 1,
            snapshot.simulation.max_age - b + 1,
          )
        : snapshot.simulation.max_age - a + 1,
      property_stream_ids: snapshot.properties.map((p) => p.id).sort(),
      verified_source_ids: refs.sources
        .filter((g) => g.status === 'verified')
        .map((g) => g.id),
    },
  });
}
export function fieldDefinition(path: string) {
  return fields.find((f) => f.path === path.replace(/\[\d+\]/g, '[]'));
}
