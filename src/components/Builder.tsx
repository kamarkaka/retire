import { useState } from 'react';
import { fieldTree, type SchemaNode } from '../config/schema';
import { accountTemplate, createExampleDraft } from '../config/constructors';
import type { DraftScenario } from '../model/types';
import RandomSeedButton from './RandomSeedButton';
import NumberInput from './NumberInput';
import ConfigField from './ConfigField';
import { useI18n } from '../i18n/context';
import type { MessageKey } from '../i18n/en';
import { enumLabel, fieldText, labelFor, unitFor } from '../i18n/core';

const sectionKeys = [
  'simulation',
  'people',
  'budget',
  'accounts',
  'properties',
  'market',
  'schema_version',
] as const;
const sectionLabels: Record<string, MessageKey> = {
  simulation: 'section.simulation',
  people: 'section.people',
  budget: 'section.budget',
  accounts: 'section.accounts',
  properties: 'section.properties',
  market: 'section.market',
  schema_version: 'section.schema_version',
};
const fieldLabel = (
  draft: DraftScenario,
  path: string,
  t: (key: MessageKey, vars?: Record<string, string | number>) => string,
) =>
  path === 'budget.annual'
    ? t('field.annualBudget', {
        ccy: draft.people?.domicile === 'US' ? 'USD' : 'CNY',
      })
    : path === 'budget.included_health'
      ? t('field.medicalExpenses')
      : path.endsWith('.rule_of_55')
        ? t('field.ruleOf55')
        : path.endsWith('.allow_early_trad')
          ? t('field.allowEarly')
          : pretty(path.split('.').pop()!);
type Key = string | number;
function read(root: unknown, keys: Key[]): unknown {
  return keys.reduce<unknown>(
    (obj, key) =>
      obj && typeof obj === 'object'
        ? (obj as Record<Key, unknown>)[key]
        : undefined,
    root,
  );
}
function assign(
  root: DraftScenario,
  keys: Key[],
  value: unknown,
): DraftScenario {
  const copy = structuredClone(root) as Record<Key, unknown>;
  let obj = copy;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!obj[key] || typeof obj[key] !== 'object')
      obj[key] = typeof keys[i + 1] === 'number' ? [] : {};
    obj = obj[key] as Record<Key, unknown>;
  }
  if (value === undefined) delete obj[keys.at(-1)!];
  else obj[keys.at(-1)!] = value;
  return copy as DraftScenario;
}
export function pretty(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b(usd|cny|cpi|fx|ss|nra|ftc|rmd|hoa)\b/g, (x) => x.toUpperCase())
    .replace(/^./, (x) => x.toUpperCase());
}
function pathText(keys: Key[]): string {
  return keys
    .map((k, i) => (typeof k === 'number' ? `[${k}]` : `${i ? '.' : ''}${k}`))
    .join('');
}
function itemTemplate(keys: Key[], draft: DraftScenario): unknown {
  const kind = keys[0];
  if (kind === 'accounts') return accountTemplate();
  if (kind === 'one_time')
    return {
      name: 'new_cost',
      year: 2030,
      amount: 0,
      currency: draft.people?.domicile === 'US' ? 'USD' : 'CNY',
    };
  if (kind === 'properties')
    return {
      id: `property-${crypto.randomUUID()}`,
      share_A: 0.5,
      strategy: 'hold',
    };
  return {};
}
function Editor({
  node,
  keys,
  draft,
  onChange,
}: {
  node: SchemaNode;
  keys: Key[];
  draft: DraftScenario;
  onChange: (d: DraftScenario) => void;
}) {
  const { t, lang } = useI18n();
  const value = read(draft, keys),
    path = pathText(keys),
    terminal = String(keys.at(-1) ?? ''),
    label = labelFor(lang, terminal, pretty(terminal));
  const update = (v: unknown) => {
    if (keys[0] === 'accounts' && keys.at(-1) === 'type' && v !== undefined) {
      const accountKeys = keys.slice(0, -1),
        old = read(draft, accountKeys) as Record<string, unknown>;
      const template = accountTemplate(
        v as Parameters<typeof accountTemplate>[0],
      );
      const keepAllocation =
        old.type !== 'cash_cny' &&
        old.type !== 'cash_usd' &&
        v !== 'cash_cny' &&
        v !== 'cash_usd';
      onChange(
        assign(draft, accountKeys, {
          ...template,
          ...(keepAllocation
            ? {
                allocation:
                  old.allocation ??
                  (template as { allocation?: unknown }).allocation,
              }
            : {}),
          name: old.name,
          balance: old.balance,
          share_A: old.share_A,
          interest_rate: v === 'cash_usd' ? old.interest_rate : undefined,
          owner:
            old.owner === 'joint' && (v === 'pre_tax' || v === 'after_tax')
              ? 'A'
              : old.owner,
        }),
      );
    } else onChange(assign(draft, keys, v));
  };
  if (node.item) {
    const items = Array.isArray(value) ? value : [];
    return (
      <div className="list-editor">
        <p className="muted">{t('list.count', { count: items.length })}</p>
        {items.map((_, i) => (
          <div className="list-item" key={i}>
            <div className="list-toolbar">
              <strong>{t('list.item', { label, index: i + 1 })}</strong>
              <button
                type="button"
                className="small"
                disabled={i === 0}
                aria-label={t('list.moveUp', { path: `${path}[${i}]` })}
                onClick={() => {
                  const next = [...items];
                  [next[i - 1], next[i]] = [next[i], next[i - 1]];
                  update(next);
                }}
              >
                ↑
              </button>
              <button
                type="button"
                className="small"
                disabled={i === items.length - 1}
                aria-label={t('list.moveDown', { path: `${path}[${i}]` })}
                onClick={() => {
                  const next = [...items];
                  [next[i + 1], next[i]] = [next[i], next[i + 1]];
                  update(next);
                }}
              >
                ↓
              </button>
              <button
                type="button"
                className="small danger"
                aria-label={t('list.removeItem', { path: `${path}[${i}]` })}
                onClick={() => update(items.filter((_, j) => j !== i))}
              >
                {t('list.remove')}
              </button>
            </div>
            <Editor
              node={node.item!}
              keys={[...keys, i]}
              draft={draft}
              onChange={onChange}
            />
          </div>
        ))}
        <button
          type="button"
          className="secondary"
          aria-label={t('list.addItem', { path })}
          onClick={() => update([...items, itemTemplate(keys, draft)])}
        >
          {t('list.add', { label: label.toLowerCase() })}
        </button>
      </div>
    );
  }
  if (Object.keys(node.children).length) {
    const account =
      keys[0] === 'accounts'
        ? (read(draft, keys.slice(0, 2)) as {
            type?: string;
            allocation?: Record<string, number>;
          })
        : undefined;
    const children = Object.entries(node.children).filter(([k]) => {
      if (
        keys[0] === 'medical' &&
        keys.at(-1) === 'late_life_care' &&
        k !== 'enabled' &&
        draft.medical?.late_life_care?.enabled !== true
      )
        return false;
      if (keys[0] === 'accounts' && keys.length === 2) {
        if (k === 'allocation')
          return account?.type !== 'cash_cny' && account?.type !== 'cash_usd';
        if (k === 'interest_rate') return account?.type === 'cash_usd';
        if (k === 'rule_of_55') return account?.type === 'pre_tax';
        if (k === 'allow_early_trad') return account?.type === 'pre_tax';
      }
      if (
        keys[0] === 'people' &&
        keys.length === 1 &&
        k === 'B' &&
        draft.people?.B === undefined
      )
        return false;
      return true;
    });
    const renderChild = ([key, n]: [string, SchemaNode]) =>
      Object.keys(n.children).length || n.item || n.wildcard ? (
        <details
          className={
            key === 'allocation' ? 'subsection allocation-fields' : 'subsection'
          }
          key={key}
          open
        >
          <summary>{labelFor(lang, key, pretty(key))}</summary>
          <Editor
            node={n}
            keys={[...keys, key]}
            draft={draft}
            onChange={onChange}
          />
        </details>
      ) : (
        <Editor
          node={n}
          key={key}
          keys={[...keys, key]}
          draft={draft}
          onChange={onChange}
        />
      );
    if (keys[0] === 'properties' && keys.length === 2) {
      const advanced = [
        'land_share',
        'depreciation_taken',
        'maintenance_annual',
        'property_tax_annual',
        'insurance_annual',
        'hoa_monthly',
        'rent_real_growth',
        'selling_cost',
      ];
      const core = children.filter(([k]) => !advanced.includes(k)),
        extra = children.filter(([k]) => advanced.includes(k));
      return (
        <div className="field-grid">
          {core.map(renderChild)}
          <details className="subsection" open>
            <summary>{t('builder.advancedProperty')}</summary>
            <div className="field-grid">{extra.map(renderChild)}</div>
          </details>
        </div>
      );
    }
    return <div className="field-grid">{children.map(renderChild)}</div>;
  }
  const f = node.field;
  if (!f) return null;
  const type = f.type;
  const help = fieldText(lang, path),
    description = help.description ?? f.description,
    omission = help.omission ?? f.omission,
    constraints = help.constraints ?? f.constraints,
    unit = unitFor(lang, f.unit);
  if (type.endsWith('[]')) {
    const values = (value ?? []) as unknown[],
      pairs = type === '[number,number][]';
    return (
      <div className="field list-field">
        <div className="list-field-title">
          {label} <span>{unit}</span>
        </div>
        {values.map((v, i) => (
          <div className="primitive-row" key={i}>
            {pairs ? (
              (v as number[]).map((n, j) => (
                <ConfigField
                  key={j}
                  path={`${path}[${i}][${j}]`}
                  label={t('field.bracket', {
                    index: i + 1,
                    part: t(
                      j === 0 ? 'field.bracketLower' : 'field.bracketRate',
                    ),
                  })}
                  unit={j === 0 ? 'CNY' : t('field.bracketUnitRate')}
                  description={t('field.bracketDesc', {
                    description,
                    part: t(
                      j === 0
                        ? 'field.bracketDescLower'
                        : 'field.bracketDescRate',
                    ),
                    index: i + 1,
                  })}
                >
                  {(attributes) => (
                    <NumberInput
                      {...attributes}
                      aria-label={`${path}[${i}][${j}]`}
                      step="any"
                      value={n}
                      onChange={(number) => {
                        const next = structuredClone(values) as unknown[][];
                        next[i][j] = number;
                        update(next);
                      }}
                    />
                  )}
                </ConfigField>
              ))
            ) : (
              <ConfigField
                path={`${path}[${i}]`}
                label={t('list.item', { label, index: i + 1 })}
                unit={unit}
                description={t('field.entryDesc', {
                  description,
                  index: i + 1,
                })}
              >
                {(attributes) =>
                  type === 'number[]' ? (
                    <NumberInput
                      {...attributes}
                      aria-label={`${path}[${i}]`}
                      step="any"
                      value={v as number | undefined}
                      onChange={(number) => {
                        const next = [...values];
                        next[i] = number;
                        update(next);
                      }}
                    />
                  ) : (
                    <input
                      {...attributes}
                      aria-label={`${path}[${i}]`}
                      type="text"
                      value={String(v ?? '')}
                      onChange={(e) => {
                        const next = [...values];
                        next[i] = e.target.value;
                        update(next);
                      }}
                    />
                  )
                }
              </ConfigField>
            )}
            <button
              className="small danger"
              type="button"
              aria-label={t('list.removeItem', { path: `${path}[${i}]` })}
              onClick={() => update(values.filter((_, j) => j !== i))}
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          className="small"
          aria-label={t('list.addItem', { path })}
          onClick={() =>
            update([...values, pairs ? [0, 0] : type === 'number[]' ? 0 : ''])
          }
        >
          {t('list.addShort')}
        </button>
        <small>{constraints}</small>
      </div>
    );
  }
  const placeholder =
    f.default === null
      ? t('field.required')
      : t('field.default', { value: String(f.default) });
  return (
    <ConfigField
      path={path}
      label={
        path === 'budget.annual' ||
        path === 'budget.included_health' ||
        path.endsWith('.rule_of_55') ||
        path.endsWith('.allow_early_trad')
          ? fieldLabel(draft, path, t)
          : label
      }
      unit={unit}
      description={description}
      className={type === 'boolean' ? 'check-field' : ''}
      footnote={`${omission} · ${constraints}`}
    >
      {(attributes) =>
        type === 'boolean' ? (
          <input
            {...attributes}
            type="checkbox"
            aria-label={path}
            checked={value === true}
            onChange={(e) => update(e.target.checked)}
          />
        ) : type.startsWith('enum ') ? (
          <select
            {...attributes}
            aria-label={path}
            value={String(value ?? '')}
            onChange={(e) => update(e.target.value || undefined)}
          >
            <option value="">{t('field.select')}</option>
            {type
              .slice(5)
              .split('|')
              .map((v) => (
                <option key={v} value={v}>
                  {enumLabel(
                    lang,
                    v,
                    keys[0] === 'people' && keys.at(-1) === 'sex'
                      ? v === 'F'
                        ? 'Female'
                        : 'Male'
                      : keys[0] === 'accounts' && keys.at(-1) === 'type'
                        ? ({
                            brokerage: 'Brokerage',
                            pre_tax: 'Pre-tax',
                            after_tax: 'After-tax',
                            cash_cny: 'Cash CNY',
                            cash_usd: 'Cash USD',
                          }[v] ?? pretty(v))
                        : pretty(v),
                  )}
                </option>
              ))}
          </select>
        ) : path === 'simulation.seed' ? (
          <span className="seed-control">
            <NumberInput
              {...attributes}
              aria-label={path}
              min={0}
              max={4294967295}
              step={1}
              value={value as number | undefined}
              placeholder={placeholder}
              onChange={update}
            />
            <RandomSeedButton label={t('seed.label')} onGenerate={update} />
          </span>
        ) : type === 'string' ? (
          <input
            {...attributes}
            aria-label={path}
            type="text"
            value={String(value ?? '')}
            placeholder={placeholder}
            onChange={(e) => update(e.target.value || undefined)}
          />
        ) : (
          <NumberInput
            {...attributes}
            aria-label={path}
            step={type === 'integer' ? '1' : 'any'}
            value={value as number | undefined}
            placeholder={placeholder}
            onChange={update}
          />
        )
      }
    </ConfigField>
  );
}
function HouseholdSizeToggle({
  draft,
  onChange,
}: {
  draft: DraftScenario;
  onChange: (d: DraftScenario) => void;
}) {
  const { t } = useI18n();
  const size = draft.people?.B === undefined ? 1 : 2;
  const setSize = (n: number) =>
    onChange(
      n === 1
        ? assign(draft, ['people', 'B'], undefined)
        : assign(draft, ['people', 'B'], draft.people?.B ?? {}),
    );
  return (
    <div
      className="toolbar toggle-group"
      role="group"
      aria-label={t('household.group')}
    >
      {[1, 2].map((n) => (
        <button
          key={n}
          type="button"
          className="secondary"
          aria-pressed={size === n}
          onClick={() => setSize(n)}
        >
          {n === 1 ? t('household.one') : t('household.two')}
        </button>
      ))}
    </div>
  );
}
function PeopleEditor({
  draft,
  onChange,
}: {
  draft: DraftScenario;
  onChange: (d: DraftScenario) => void;
}) {
  return (
    <>
      <Editor
        node={fieldTree.children.people}
        keys={['people']}
        draft={draft}
        onChange={onChange}
      />
    </>
  );
}
function BudgetEditor({
  draft,
  onChange,
}: {
  draft: DraftScenario;
  onChange: (d: DraftScenario) => void;
}) {
  const { t, lang } = useI18n();
  const budget = fieldTree.children.budget,
    medical = fieldTree.children.medical;
  const core = {
    children: Object.fromEntries(
      Object.entries(budget.children).filter(
        ([key]) => key !== 'included_health',
      ),
    ),
  };
  const shocks = {
    children: Object.fromEntries(
      Object.entries(medical.children).filter(([key]) =>
        key.startsWith('shock'),
      ),
    ),
  };
  const base = Object.keys(medical.children).filter(
    (key) => !key.startsWith('shock') && key !== 'late_life_care',
  );
  return (
    <div className="config-groups">
      <section className="config-group" aria-labelledby="budget-group-core">
        <h3 id="budget-group-core">{t('budget.core')}</h3>
        <Editor
          node={core}
          keys={['budget']}
          draft={draft}
          onChange={onChange}
        />
      </section>
      <section className="config-group" aria-labelledby="budget-group-medical">
        <h3 id="budget-group-medical">{t('budget.medical')}</h3>
        <div className="field-grid">
          <Editor
            node={budget.children.included_health}
            keys={['budget', 'included_health']}
            draft={draft}
            onChange={onChange}
          />
          {base.map((key) => (
            <Editor
              key={key}
              node={medical.children[key]}
              keys={['medical', key]}
              draft={draft}
              onChange={onChange}
            />
          ))}
          <details className="subsection" open>
            <summary>{t('budget.shocks')}</summary>
            <Editor
              node={shocks}
              keys={['medical']}
              draft={draft}
              onChange={onChange}
            />
          </details>
          <details className="subsection" open>
            <summary>
              {labelFor(lang, 'late_life_care', pretty('late_life_care'))}
            </summary>
            <Editor
              node={medical.children.late_life_care}
              keys={['medical', 'late_life_care']}
              draft={draft}
              onChange={onChange}
            />
          </details>
        </div>
      </section>
      <section className="config-group" aria-labelledby="budget-group-one-time">
        <h3 id="budget-group-one-time">{t('budget.oneTime')}</h3>
        <Editor
          node={fieldTree.children.one_time}
          keys={['one_time']}
          draft={draft}
          onChange={onChange}
        />
      </section>
    </div>
  );
}
const ADVANCED_MARKET: Record<string, string[]> = {
  markets: ['sample_start', 'sample_end', 'block_mean_years'],
  inflation: ['home_cpi_phi', 'home_cpi_sigma'],
  fx: [
    'fx_adjust_speed',
    'fx_sigma',
    'fx_real_trend',
    'fx_drift',
    'fx_spread',
    'fx_quota_usd_per_person',
  ],
};
function MarketEditor({
  draft,
  onChange,
}: {
  draft: DraftScenario;
  onChange: (d: DraftScenario) => void;
}) {
  const { t } = useI18n();
  const market = fieldTree.children.market;
  const groups = [
    {
      id: 'markets',
      label: t('market.markets'),
      children: {
        ...Object.fromEntries(
          Object.entries(market.children).filter(
            ([key]) =>
              !key.startsWith('fx_') &&
              !key.startsWith('home_cpi_') &&
              key !== 'medical_excess_inflation',
          ),
        ),
      },
    },
    {
      id: 'inflation',
      label: t('market.inflation'),
      children: {
        ...Object.fromEntries(
          Object.entries(market.children).filter(
            ([key]) =>
              key.startsWith('home_cpi_') || key === 'medical_excess_inflation',
          ),
        ),
      },
    },
    {
      id: 'fx',
      label: t('market.fx'),
      children: Object.fromEntries(
        Object.entries(market.children).filter(([key]) =>
          key.startsWith('fx_'),
        ),
      ),
    },
  ];
  const setMarket = (patch: Record<string, unknown>) =>
    onChange(assign(draft, ['market'], { ...draft.market, ...patch }));
  return (
    <div className="config-groups">
      <div className="toolbar" role="group" aria-label={t('market.presets')}>
        <button
          type="button"
          className="secondary"
          onClick={() => setMarket({ ...createExampleDraft().market })}
        >
          {t('market.sampleDefaults')}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() =>
            setMarket({
              fx_sigma: 0,
              fx_drift: 0,
              fx_real_trend: 0,
              home_cpi_sigma: 0,
            })
          }
        >
          {t('market.stablePrices')}
        </button>
      </div>
      <p className="muted">{t('market.presetsHint')}</p>
      {groups.map((group) => {
        const advanced = ADVANCED_MARKET[group.id] ?? [],
          core = Object.fromEntries(
            Object.entries(group.children).filter(
              ([key]) => !advanced.includes(key),
            ),
          ),
          extra = Object.fromEntries(
            Object.entries(group.children).filter(([key]) =>
              advanced.includes(key),
            ),
          );
        return (
          <section
            className="config-group"
            key={group.id}
            aria-labelledby={`market-group-${group.id}`}
          >
            <h3 id={`market-group-${group.id}`}>{group.label}</h3>
            {group.id === 'markets' && (
              <p className="muted" data-testid="cny-cash-interest-note">
                {t('market.cnyCashNote')}
              </p>
            )}
            <Editor
              node={{ ...market, children: core }}
              keys={['market']}
              draft={draft}
              onChange={onChange}
            />
            <details className="subsection" open>
              <summary>
                {t('market.advanced', { label: group.label.toLowerCase() })}
              </summary>
              <Editor
                node={{ ...market, children: extra }}
                keys={['market']}
                draft={draft}
                onChange={onChange}
              />
            </details>
          </section>
        );
      })}
    </div>
  );
}
function AccountsEditor({
  draft,
  onChange,
}: {
  draft: DraftScenario;
  onChange: (d: DraftScenario) => void;
}) {
  return (
    <div className="config-groups">
      <div className="field-grid">
        <Editor
          node={fieldTree.children.withdrawals.children.surplus_account}
          keys={['withdrawals', 'surplus_account']}
          draft={draft}
          onChange={onChange}
        />
      </div>
      <Editor
        node={fieldTree.children.accounts}
        keys={['accounts']}
        draft={draft}
        onChange={onChange}
      />
    </div>
  );
}
function PropertiesEditor({
  draft,
  onChange,
}: {
  draft: DraftScenario;
  onChange: (d: DraftScenario) => void;
}) {
  return (
    <div className="config-groups">
      <div className="field-grid">
        <Editor
          node={
            fieldTree.children.withdrawals.children.last_resort_property_sale
          }
          keys={['withdrawals', 'last_resort_property_sale']}
          draft={draft}
          onChange={onChange}
        />
      </div>
      <Editor
        node={fieldTree.children.properties}
        keys={['properties']}
        draft={draft}
        onChange={onChange}
      />
    </div>
  );
}
export default function Builder({
  draft,
  onChange,
  section: controlled,
  onSectionChange,
}: {
  draft: DraftScenario;
  onChange: (d: DraftScenario) => void;
  section?: string;
  onSectionChange?: (section: string) => void;
}) {
  const { t } = useI18n();
  const [uncontrolled, setUncontrolled] = useState('simulation');
  const section = controlled ?? uncontrolled,
    setSection = (key: string) => {
      setUncontrolled(key);
      onSectionChange?.(key);
    };
  return (
    <div className="builder">
      <nav className="section-nav" aria-label={t('builder.sections')}>
        {sectionKeys.map((key) => (
          <button
            key={key}
            type="button"
            className={section === key ? 'selected' : ''}
            onClick={() => setSection(key)}
          >
            {t(sectionLabels[key])}
          </button>
        ))}
      </nav>
      <section className="builder-section">
        <div className="section-title">
          <h2>{t(sectionLabels[section] ?? 'section.simulation')}</h2>
          {section === 'people' && (
            <HouseholdSizeToggle draft={draft} onChange={onChange} />
          )}
        </div>
        {section === 'market' ? (
          <MarketEditor draft={draft} onChange={onChange} />
        ) : section === 'budget' ? (
          <BudgetEditor draft={draft} onChange={onChange} />
        ) : section === 'people' ? (
          <PeopleEditor draft={draft} onChange={onChange} />
        ) : section === 'accounts' ? (
          <AccountsEditor draft={draft} onChange={onChange} />
        ) : section === 'properties' ? (
          <PropertiesEditor draft={draft} onChange={onChange} />
        ) : (
          <Editor
            node={fieldTree.children[section]}
            keys={[section]}
            draft={draft}
            onChange={onChange}
          />
        )}
      </section>
    </div>
  );
}
