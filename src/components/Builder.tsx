import { useRef, useState } from 'react';
import { fieldTree, type SchemaNode } from '../config/schema';
import { fixedAccounts } from '../config/constructors';
import type { DraftScenario } from '../model/types';
import { FIXED_ACCOUNT_ORDER } from '../model/types';
import RandomSeedButton from './RandomSeedButton';
import NumberInput from './NumberInput';
import ConfigField, { GuideModeContext, useGuideMode } from './ConfigField';
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
    ? t('field.annualBudget')
    : path === 'budget.included_health'
      ? t('field.medicalExpenses')
      : path === 'budget.flex_enabled'
        ? t('field.flexEnabled')
        : path === 'medical.late_life_care.enabled'
          ? t('field.careEnabled')
          : path.endsWith('.rule_of_55')
            ? t('field.ruleOf55')
            : path.endsWith('.allow_early_trad')
              ? t('field.allowEarly')
              : path.endsWith('.cola')
                ? t('field.colaLabel')
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
    .replace(/\b(us|usd|cny|cpi|fx|ss|nra|ftc|rmd|hoa)\b/g, (x) =>
      x.toUpperCase(),
    )
    .replace(/^./, (x) => x.toUpperCase());
}
function schemaDefault(path: string): unknown {
  let node: SchemaNode | undefined = fieldTree;
  for (const key of path.split('.')) {
    node = node?.children[key.replace(/\[\]$/, '')];
    if (!node) return undefined;
  }
  return node.field?.default;
}
function pathText(keys: Key[]): string {
  return keys
    .map((k, i) => (typeof k === 'number' ? `[${k}]` : `${i ? '.' : ''}${k}`))
    .join('');
}
const ACCOUNT_TITLES = {
  brokerage: 'accounts.brokerage',
  pre_tax: 'accounts.preTax',
  after_tax: 'accounts.afterTax',
} as const;
const ALLOC_KEYS = ['us_stocks', 'us_bonds', 'usd_cash'] as const;
const ALLOC_LABELS = {
  us_stocks: 'accounts.stocks',
  us_bonds: 'accounts.bonds',
  usd_cash: 'accounts.cash',
} as const;
function itemTemplate(keys: Key[], draft: DraftScenario): unknown {
  const kind = keys[0];
  // A new cost starts unnamed, like a new property starts unlabeled:
  // the list header shows the "One-time cost N" fallback until the user
  // names it by clicking the header.
  if (kind === 'one_time')
    return {
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
function itemLabelOf(item: unknown, key: string): string | undefined {
  const label = (item as Record<string, unknown> | null)?.[key];
  return typeof label === 'string' ? label : undefined;
}
// Which lists edit their display text through the list header instead of
// a field: properties edit `label`, one-time costs edit `name`.
const EDITABLE_TITLES: Record<
  string,
  { key: string; itemLabel: MessageKey; placeholder: MessageKey }
> = {
  properties: {
    key: 'label',
    itemLabel: 'properties.itemLabel',
    placeholder: 'properties.labelPlaceholder',
  },
  one_time: {
    key: 'name',
    itemLabel: 'one_time.itemLabel',
    placeholder: 'one_time.namePlaceholder',
  },
};
// A list header doubles as its display text: the header shows the text
// when one is set and falls back to "Property N" / "One-time cost N"
// otherwise. Clicking it swaps in an input; Enter or blur commits,
// Escape cancels, and clearing restores the fallback.
function EditableListTitle({
  fallback,
  label,
  fieldPath,
  placeholder,
  onCommit,
}: {
  fallback: string;
  label: string | undefined;
  fieldPath: string;
  placeholder: string;
  onCommit: (label: string | undefined) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const doneRef = useRef(false);
  const display = label?.trim() ? label : fallback;
  const finish = (commit: boolean) => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (commit) {
      const next = text.trim();
      onCommit(next ? next : undefined);
    }
    setEditing(false);
  };
  if (!editing)
    return (
      <button
        type="button"
        className="list-title"
        title={display}
        onClick={() => {
          doneRef.current = false;
          setText(label ?? '');
          setEditing(true);
        }}
      >
        {display}
      </button>
    );
  return (
    <input
      className="list-title-input"
      autoFocus
      aria-label={fieldPath}
      type="text"
      value={text}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      onFocus={(e) => e.currentTarget.select()}
      onBlur={() => finish(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        else if (e.key === 'Escape') finish(false);
      }}
    />
  );
}
// Heroicons outline trash icon, matching the mode-select hero style.
function TrashIcon() {
  return (
    <svg
      className="trash-icon"
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
}
export function Editor({
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
  const guide = useGuideMode();
  const value = read(draft, keys),
    path = pathText(keys),
    terminal = String(keys.at(-1) ?? ''),
    label = labelFor(lang, terminal, pretty(terminal));
  const update = (v: unknown) => {
    onChange(assign(draft, keys, v));
  };
  if (node.item) {
    const items = Array.isArray(value) ? value : [];
    const editableTitle = EDITABLE_TITLES[terminal];
    return (
      <div className="list-editor">
        <p className="muted">{t('list.count', { count: items.length })}</p>
        {items.map((_, i) => (
          <div className="list-item" key={i}>
            <div className="list-toolbar">
              {editableTitle ? (
                <EditableListTitle
                  fallback={t('list.item', {
                    label: t(editableTitle.itemLabel),
                    index: i + 1,
                  })}
                  label={itemLabelOf(items[i], editableTitle.key)}
                  fieldPath={`${path}[${i}].${editableTitle.key}`}
                  placeholder={t(editableTitle.placeholder)}
                  onCommit={(nextLabel) => {
                    const next = [...items];
                    const item = {
                      ...(next[i] as Record<string, unknown>),
                    };
                    if (nextLabel === undefined) delete item[editableTitle.key];
                    else item[editableTitle.key] = nextLabel;
                    next[i] = item;
                    update(next);
                  }}
                />
              ) : (
                <strong>{t('list.item', { label, index: i + 1 })}</strong>
              )}
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
                <TrashIcon />
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
    const children = Object.entries(node.children).filter(([k]) => {
      if (
        keys[0] === 'medical' &&
        keys.at(-1) === 'late_life_care' &&
        k !== 'enabled' &&
        draft.medical?.late_life_care?.enabled !== true
      )
        return false;
      if (
        keys[0] === 'people' &&
        keys.length === 1 &&
        k === 'B' &&
        draft.people?.B === undefined
      )
        return false;
      return true;
    });
    const renderChild = ([key, n]: [string, SchemaNode]) => {
      if (Object.keys(n.children).length || n.item || n.wildcard) {
        // Person sections are never foldable: they hold only a few fields,
        // including the required birth year, and folding hides them.
        if (
          keys.length === 1 &&
          keys[0] === 'people' &&
          (key === 'A' || key === 'B')
        )
          return (
            <section className="subsection person-section" key={key}>
              <h3>
                {key === 'A' ? t('tutorial.personA') : t('tutorial.personB')}
              </h3>
              <Editor
                node={n}
                keys={[...keys, key]}
                draft={draft}
                onChange={onChange}
              />
            </section>
          );
        // The pension section is never foldable either: it holds only
        // three fields, and folding hides the annual amount.
        if (keys.length === 2 && keys[0] === 'people' && key === 'pension')
          return (
            <section className="subsection pension-section" key={key}>
              <h3>{labelFor(lang, key, pretty(key))}</h3>
              <Editor
                node={n}
                keys={[...keys, key]}
                draft={draft}
                onChange={onChange}
              />
            </section>
          );
        return (
          <details
            className={
              key === 'allocation'
                ? 'subsection allocation-fields'
                : 'subsection'
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
        );
      }
      return (
        <Editor
          node={n}
          key={key}
          keys={[...keys, key]}
          draft={draft}
          onChange={onChange}
        />
      );
    };
    if (
      keys.length === 2 &&
      keys[0] === 'people' &&
      (keys[1] === 'A' || keys[1] === 'B')
    ) {
      // Birth year and citizenship stay on one structural row at every
      // width; the generic two-column grid collapses to one column on
      // narrower viewports and would stack them.
      const identity = children.filter(
        ([k]) => k === 'birth_year' || k === 'us_citizen',
      );
      const rest = children.filter(
        ([k]) => k !== 'birth_year' && k !== 'us_citizen',
      );
      return (
        <div className="person-fields">
          {identity.length > 0 && (
            <div className="person-identity-row">
              {identity.map(renderChild)}
            </div>
          )}
          {rest.map(renderChild)}
        </div>
      );
    }
    if (keys.length === 3 && keys[0] === 'people' && keys[2] === 'pension') {
      // Annual, start age, and Cola stay on one structural row at every
      // width, for the same reason as the identity row above.
      return <div className="pension-row">{children.map(renderChild)}</div>;
    }
    if (keys[0] === 'one_time' && keys.length === 2) {
      // The name lives in the list header and the currency lives on the
      // amount input; neither is shown as a field.
      const shown = children.filter(([k]) => k !== 'name' && k !== 'currency');
      return <div className="field-grid">{shown.map(renderChild)}</div>;
    }
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
      // share_A is derived from household size (1 solo, 0.5 joint), the id
      // is an internal identifier, sale proceeds always land in
      // Non-retirement liquid assets, and the label lives in the list
      // header; none of the four is shown as a field.
      const shown = children.filter(
          ([k]) =>
            k !== 'share_A' &&
            k !== 'id' &&
            k !== 'label' &&
            k !== 'proceeds_account',
        ),
        core = shown.filter(([k]) => !advanced.includes(k)),
        extra = shown.filter(([k]) => advanced.includes(k));
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
          {label} {!guide && <span>{unit}</span>}
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
  // An omitted value takes its declared default, so show the default as
  // the input's value instead of a "Default: …" placeholder. The draft
  // stays sparse; normalization still applies the default.
  const effective = value ?? (f.default === null ? undefined : f.default);
  // Money inputs carry the currency symbol as a prefix: pensions and
  // account balances are always USD, while the budget follows the
  // domicile currency.
  const moneySymbol =
    (terminal === 'annual' && keys.at(-2) === 'pension') ||
    (keys[0] === 'accounts' && terminal === 'balance')
      ? '$'
      : path === 'budget.annual' || path === 'budget.included_health'
        ? draft.people?.domicile === 'US'
          ? '$'
          : '¥'
        : null;
  // A one-time amount carries its currency as a dropdown prefix instead
  // of a separate field: the select edits the sibling currency value.
  const oneTimeIndex =
    terminal === 'amount' &&
    keys[0] === 'one_time' &&
    typeof keys[1] === 'number'
      ? keys[1]
      : null;
  const oneTimeCurrency =
    oneTimeIndex === null
      ? undefined
      : read(draft, ['one_time', oneTimeIndex, 'currency']);
  // Fields gated by a toggle only apply while the toggle is on. An
  // omitted toggle takes its schema default, so resolve the gate the same
  // way the gated field resolves its own effective value.
  const gateOn = (gatePath: string, value: unknown) =>
    (value ?? schemaDefault(gatePath)) === true;
  // Sell year only applies to the Sell year strategy; otherwise it is
  // greyed out, like the toggle-gated fields below.
  const propertySellYearGated =
    terminal === 'sell_year' &&
    keys[0] === 'properties' &&
    typeof keys[1] === 'number' &&
    (read(draft, ['properties', keys[1], 'strategy']) ??
      schemaDefault('properties[].strategy')) !== 'sell_year';
  const gatedDisabled =
    propertySellYearGated ||
    ((path === 'budget.flex_cut' || path === 'budget.flex_raise') &&
      !gateOn('budget.flex_enabled', draft.budget?.flex_enabled)) ||
    ((path === 'medical.shock_prob_at_60' ||
      path === 'medical.shock_prob_doubling_years' ||
      path === 'medical.shock_median') &&
      !gateOn('medical.shock_enabled', draft.medical?.shock_enabled)) ||
    ((path === 'medical.late_life_care.start_age' ||
      path === 'medical.late_life_care.monthly' ||
      path === 'medical.late_life_care.real_growth') &&
      !gateOn(
        'medical.late_life_care.enabled',
        draft.medical?.late_life_care?.enabled,
      ));
  return (
    <ConfigField
      path={path}
      label={
        path === 'budget.annual' ||
        path === 'budget.included_health' ||
        path === 'budget.flex_enabled' ||
        path === 'medical.late_life_care.enabled' ||
        path.endsWith('.rule_of_55') ||
        path.endsWith('.allow_early_trad') ||
        path.endsWith('.cola')
          ? fieldLabel(draft, path, t)
          : label
      }
      unit={unit}
      description={description}
      className={[
        type === 'boolean' ? 'check-field' : '',
        gatedDisabled ? 'is-disabled' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      footnote={`${omission} · ${constraints}`}
    >
      {(attributes) =>
        type === 'boolean' ? (
          <input
            {...attributes}
            type="checkbox"
            aria-label={path}
            checked={effective === true}
            onChange={(e) => update(e.target.checked)}
          />
        ) : type.startsWith('enum ') ? (
          <select
            {...attributes}
            aria-label={path}
            value={String(effective ?? '')}
            onChange={(e) => update(e.target.value || undefined)}
          >
            <option value="">{t('field.select')}</option>
            {type
              .slice(5)
              .split('|')
              .map((v) => (
                <option key={v} value={v}>
                  {enumLabel(lang, v, pretty(v))}
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
              value={effective as number | undefined}
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
            value={String(effective ?? '')}
            placeholder={placeholder}
            onChange={(e) => update(e.target.value || undefined)}
          />
        ) : oneTimeIndex !== null ? (
          <span className="currency-field">
            <select
              className="currency-select"
              aria-label={`one_time[${oneTimeIndex}].currency`}
              value={String(oneTimeCurrency ?? '')}
              onChange={(e) =>
                onChange(
                  assign(
                    draft,
                    ['one_time', oneTimeIndex, 'currency'],
                    e.target.value || undefined,
                  ),
                )
              }
            >
              <option value="CNY">¥</option>
              <option value="USD">$</option>
            </select>
            <NumberInput
              {...attributes}
              aria-label={path}
              step={type === 'integer' ? '1' : 'any'}
              value={effective as number | undefined}
              placeholder={placeholder}
              onChange={update}
            />
          </span>
        ) : moneySymbol !== null ? (
          <span className="currency-field">
            <span className="currency-symbol" aria-hidden="true">
              {moneySymbol}
            </span>
            <NumberInput
              {...attributes}
              aria-label={path}
              step={type === 'integer' ? '1' : 'any'}
              value={effective as number | undefined}
              placeholder={placeholder}
              onChange={update}
            />
          </span>
        ) : (
          <NumberInput
            {...attributes}
            aria-label={path}
            disabled={gatedDisabled}
            step={type === 'integer' ? '1' : 'any'}
            value={effective as number | undefined}
            placeholder={placeholder}
            onChange={update}
          />
        )
      }
    </ConfigField>
  );
}
export function PersonCountControl({
  draft,
  onChange,
}: {
  draft: DraftScenario;
  onChange: (d: DraftScenario) => void;
}) {
  const { t } = useI18n();
  if (draft.people?.B === undefined)
    return (
      <div className="toolbar">
        <button
          type="button"
          className="secondary"
          onClick={() => onChange(assign(draft, ['people', 'B'], {}))}
        >
          <span aria-hidden="true">+</span> {t('adv.addPerson')}
        </button>
      </div>
    );
  return (
    <div className="toolbar">
      <button
        type="button"
        className="secondary danger"
        onClick={() => {
          const next = structuredClone(draft);
          if (next.people) delete (next.people as Record<string, unknown>).B;
          onChange(next);
        }}
      >
        {t('adv.removePerson')}
      </button>
    </div>
  );
}
// Derived/retired person facts, hidden from the Builder. Tax status is derived
// from citizenship during normalization; sex has no model effect.
const HIDDEN_PERSON_KEYS = new Set(['us_income_tax_status', 'sex']);
export function PeopleEditor({
  draft,
  onChange,
}: {
  draft: DraftScenario;
  onChange: (d: DraftScenario) => void;
}) {
  const people = fieldTree.children.people,
    visible = (node: SchemaNode | undefined): SchemaNode | undefined =>
      node && {
        ...node,
        children: Object.fromEntries(
          Object.entries(node.children).filter(
            ([key]) => !HIDDEN_PERSON_KEYS.has(key),
          ),
        ),
      };
  return (
    <>
      <Editor
        node={{
          ...people,
          children: {
            ...people.children,
            A: visible(people.children.A)!,
            ...(people.children.B ? { B: visible(people.children.B)! } : {}),
          },
        }}
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
  const { t } = useI18n();
  const budget = fieldTree.children.budget;
  const core = {
    children: Object.fromEntries(
      Object.entries(budget.children).filter(
        ([key]) => key !== 'included_health',
      ),
    ),
  };
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
        <MedicalEditor draft={draft} onChange={onChange} />
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
// Medical expenses lead, then age growth, shocks, and late-life care laid
// flat in one grid — no foldable sections, and the shock/care inputs stay
// visible (greyed out by the leaf gate) instead of hidden. Shared by the
// Power guide (Step 3) and the Builder Budget tab, under its Medical group.
export function MedicalEditor({
  draft,
  onChange,
}: {
  draft: DraftScenario;
  onChange: (d: DraftScenario) => void;
}) {
  const medical = fieldTree.children.medical,
    care = medical.children.late_life_care;
  return (
    <div className="field-grid medical-grid">
      <Editor
        node={fieldTree.children.budget.children.included_health}
        keys={['budget', 'included_health']}
        draft={draft}
        onChange={onChange}
      />
      {Object.entries(medical.children)
        .filter(([key]) => key !== 'late_life_care')
        .map(([key, node]) => (
          <Editor
            key={key}
            node={node}
            keys={['medical', key]}
            draft={draft}
            onChange={onChange}
          />
        ))}
      {Object.entries(care.children).map(([key, node]) => (
        <Editor
          key={key}
          node={node}
          keys={['medical', 'late_life_care', key]}
          draft={draft}
          onChange={onChange}
        />
      ))}
    </div>
  );
}
const ADVANCED_MARKET: Record<string, string[]> = {
  markets: ['sample_start', 'sample_end', 'block_mean_years'],
  inflation: [
    'home_cpi_mean',
    'home_cpi_phi',
    'home_cpi_sigma',
    'home_cpi_start',
  ],
  fx: [
    'fx_adjust_speed',
    'fx_sigma',
    'fx_real_trend',
    'fx_drift',
    'fx_spread',
    'fx_quota_usd_per_person',
  ],
};
const ERAS = [
  ['full', 1928, 2025, 'market.eraFull'],
  ['postwar', 1946, 2025, 'market.eraPostwar'],
  ['modern', 1980, 2025, 'market.eraModern'],
  ['high_inflation', 1966, 1982, 'market.eraHighInflation'],
  ['depression', 1929, 1939, 'market.eraDepression'],
  ['crashes', 2000, 2009, 'market.eraCrashes'],
  ['recent', 2000, 2025, 'market.eraRecent'],
] as const;
export function MarketEditor({
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
              key !== 'medical_excess_inflation' &&
              key !== 'outlook_shift',
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
  // An unset window takes the schema defaults (full history), so a
  // blank draft reads as Full history instead of Custom.
  const sampleStart =
      draft.market?.sample_start ?? schemaDefault('market.sample_start'),
    sampleEnd = draft.market?.sample_end ?? schemaDefault('market.sample_end');
  const era =
    ERAS.find(
      ([, start, end]) => sampleStart === start && sampleEnd === end,
    )?.[0] ?? 'custom';
  return (
    <div className="config-groups">
      <div className="field-grid">
        <ConfigField
          path="market.era"
          label={t('market.era')}
          description={t('market.eraHint')}
        >
          {(attributes) => (
            <select
              {...attributes}
              aria-label="market.era"
              value={era}
              onChange={(e) => {
                const preset = ERAS.find(([id]) => id === e.target.value);
                if (preset)
                  onChange(
                    assign(draft, ['market'], {
                      ...draft.market,
                      sample_start: preset[1],
                      sample_end: preset[2],
                    }),
                  );
              }}
            >
              {ERAS.map(([id, , , key]) => (
                <option key={id} value={id}>
                  {t(key)}
                </option>
              ))}
              <option value="custom">{t('market.eraCustom')}</option>
            </select>
          )}
        </ConfigField>
        <Editor
          node={market.children.outlook_shift}
          keys={['market', 'outlook_shift']}
          draft={draft}
          onChange={onChange}
        />
      </div>
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
export function FixedAccountsEditor({
  draft,
  onChange,
}: {
  draft: DraftScenario;
  onChange: (d: DraftScenario) => void;
}) {
  const { t } = useI18n();
  const accounts = draft.accounts ?? [];
  const ok =
    accounts.length === FIXED_ACCOUNT_ORDER.length &&
    FIXED_ACCOUNT_ORDER.every(
      (name, i) => accounts[i]?.name === name && accounts[i]?.type === name,
    );
  if (!ok)
    return (
      <div className="config-groups">
        <p className="muted">{t('accounts.repairNotice')}</p>
        <button
          type="button"
          className="secondary"
          onClick={() => onChange({ ...draft, accounts: fixedAccounts() })}
        >
          {t('accounts.repair')}
        </button>
      </div>
    );
  const twoPeople = draft.people?.B !== undefined,
    item = fieldTree.children.accounts.item!;
  return (
    <div className="config-groups">
      {FIXED_ACCOUNT_ORDER.map((name, i) => {
        const allocation = (draft.accounts?.[i]?.allocation ?? {}) as Partial<
          Record<(typeof ALLOC_KEYS)[number], number>
        >;
        return (
          <section
            className="config-group"
            key={name}
            aria-labelledby={`account-group-${name}`}
          >
            <h3 id={`account-group-${name}`}>{t(ACCOUNT_TITLES[name])}</h3>
            <p className="muted">
              {t('accounts.order', { index: i + 1 })}
              {twoPeople && (
                <>
                  {' · '}
                  {t('accounts.jointOwnership')}
                </>
              )}
            </p>
            <div className="account-balance-row">
              <Editor
                node={item.children.balance}
                keys={['accounts', i, 'balance']}
                draft={draft}
                onChange={onChange}
              />
              <div
                className="allocation-inline"
                role="group"
                aria-label={t('accounts.allocation')}
              >
                {ALLOC_KEYS.map((k) => (
                  <label key={k}>
                    {t(ALLOC_LABELS[k])}
                    <NumberInput
                      aria-label={`accounts[${i}].allocation.${k}`}
                      step="any"
                      value={allocation[k]}
                      onChange={(v) =>
                        onChange(
                          assign(draft, ['accounts', i, 'allocation', k], v),
                        )
                      }
                    />
                  </label>
                ))}
              </div>
            </div>
            {name === 'pre_tax' && (
              <div className="field-grid">
                <Editor
                  node={item.children.rule_of_55}
                  keys={['accounts', i, 'rule_of_55']}
                  draft={draft}
                  onChange={onChange}
                />
                <Editor
                  node={item.children.allow_early_trad}
                  keys={['accounts', i, 'allow_early_trad']}
                  draft={draft}
                  onChange={onChange}
                />
              </div>
            )}
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
  // Surplus cash always lands in Non-retirement liquid assets; no control needed.
  return <FixedAccountsEditor draft={draft} onChange={onChange} />;
}
export function PropertiesEditor({
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
      <GuideModeContext.Provider value={true}>
        <section className="builder-section">
          {section === 'market' ? (
            <MarketEditor draft={draft} onChange={onChange} />
          ) : section === 'budget' ? (
            <BudgetEditor draft={draft} onChange={onChange} />
          ) : section === 'people' ? (
            <>
              <div className="people-editor">
                <PeopleEditor draft={draft} onChange={onChange} />
              </div>
              <PersonCountControl draft={draft} onChange={onChange} />
            </>
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
      </GuideModeContext.Provider>
    </div>
  );
}
