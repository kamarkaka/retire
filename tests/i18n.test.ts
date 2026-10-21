import { describe, it, expect } from 'vitest';
import enUI, { type MessageKey } from '../src/i18n/en';
import { zh } from '../src/i18n/zh';
import {
  enumLabel,
  fieldText,
  labelFor,
  resolveLanguage,
  supportedLanguages,
  translate,
  unitFor,
} from '../src/i18n/core';
import { fields } from '../src/config/schema';
import { LEDGER_CSV_FIELDS } from '../src/model/ledger-report';
import { LI } from '../src/model/layout';

const keys = Object.keys(enUI) as MessageKey[];

describe('language registry', () => {
  it('lists English and Chinese with distinct locales', () => {
    const codes = supportedLanguages().map((l) => l.code);
    expect(codes).toContain('en');
    expect(codes).toContain('zh');
    const intl = Object.fromEntries(
      supportedLanguages().map((l) => [l.code, l.intlLocale]),
    );
    expect(intl.en).toBe('en-US');
    expect(intl.zh).toBe('zh-CN');
  });

  it('resolves exact codes, regional variants, and fallbacks', () => {
    expect(resolveLanguage(['zh'])).toBe('zh');
    expect(resolveLanguage(['zh-CN', 'en'])).toBe('zh');
    expect(resolveLanguage(['en-US'])).toBe('en');
    expect(resolveLanguage(['fr', 'zh-TW'])).toBe('zh');
    expect(resolveLanguage(['fr'])).toBe('en');
    expect(resolveLanguage([])).toBe('en');
    expect(resolveLanguage([undefined, null])).toBe('en');
  });
});

describe('translate', () => {
  it('looks up UI strings with interpolation', () => {
    expect(translate('en', 'run.start')).toBe('Run simulation');
    expect(translate('zh', 'run.start')).toBe('运行模拟');
    expect(translate('en', 'run.issues', { count: 3 })).toBe(
      '3 items to resolve',
    );
    expect(translate('zh', 'run.issues', { count: 3 })).toBe('还有 3 项待处理');
  });

  it('falls back to English, then to the key', () => {
    expect(translate('fr', 'run.start')).toBe('Run simulation');
    expect(translate('en', 'missing.key' as MessageKey)).toBe('missing.key');
  });

  it('leaves unknown placeholders intact', () => {
    expect(translate('en', 'run.issues')).toBe('{count} items to resolve');
  });
});

describe('data-driven lookups', () => {
  it('normalizes array indices for field help', () => {
    expect(fieldText('zh', 'one_time[0].name').description).toBe(
      zh.fields['one_time[].name'].description,
    );
    expect(fieldText('en', 'one_time[0].name')).toEqual({});
  });

  it('falls back to the English source per entry', () => {
    expect(labelFor('zh', 'unknown_key', 'Unknown Key')).toBe('Unknown Key');
    expect(labelFor('fr', 'seed', 'Seed')).toBe('Seed');
    expect(enumLabel('zh', 'unknown', 'Unknown')).toBe('Unknown');
    expect(unitFor('zh', 'unknown unit')).toBe('unknown unit');
    expect(labelFor('zh', 'seed', 'Seed')).toBe('随机种子');
  });
});

describe.each(
  supportedLanguages()
    .map((l) => l.code)
    .filter((code) => code !== 'en'),
)('locale coverage gates (%s)', (code) => {
  const locale = supportedLanguages().find((l) => l.code === code)!;

  it('translates every UI key with identical placeholders', () => {
    expect(Object.keys(locale.ui).sort()).toEqual([...keys].sort());
    const vars = (s: string) =>
      [...s.matchAll(/\{(\w+)\}/g)]
        .map((m) => m[1])
        .sort()
        .join(',');
    const mismatched = keys.filter((k) => vars(enUI[k]) !== vars(locale.ui[k]));
    expect(mismatched).toEqual([]);
  });

  it('translates every config field', () => {
    const missing = fields
      .map((f) => f.path)
      .filter(
        (p) =>
          !locale.fields[p]?.description ||
          !locale.fields[p]?.omission ||
          !locale.fields[p]?.constraints,
      );
    expect(missing).toEqual([]);
  });

  it('translates every terminal label key', () => {
    const terminals = new Set(fields.map((f) => f.path.split('.').pop()!));
    const missing = [...terminals].filter((k) => !locale.labels[k]);
    expect(missing).toEqual([]);
  });

  it('translates every enum value', () => {
    const values = new Set<string>();
    for (const f of fields) {
      const match = f.type.match(/^enum (.*)$/);
      if (match) match[1].split('|').forEach((v) => values.add(v));
    }
    const missing = [...values].filter((v) => !locale.enums[v]);
    expect(missing).toEqual([]);
  });

  it('translates every unit string', () => {
    const units = new Set(fields.map((f) => f.unit));
    const missing = [...units].filter((u) => !locale.units[u]);
    expect(missing).toEqual([]);
  });

  it('translates every ledger column', () => {
    expect(LEDGER_CSV_FIELDS.length).toBeGreaterThan(0);
    const missing = LEDGER_CSV_FIELDS.filter((f) => !locale.labels[f]);
    expect(missing).toEqual([]);
    expect(Object.keys(LI).length).toBeGreaterThan(0);
  });
});
