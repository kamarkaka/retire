import enUI, { type MessageKey } from './en';
import { zh } from './zh';

/** Translated help text for one fields.json path. English is the source. */
export interface FieldText {
  description?: string;
  unit?: string;
  omission?: string;
  constraints?: string;
}

/**
 * Everything one display language needs. `ui` must cover every MessageKey;
 * the data-driven tables fall back to the English source per entry.
 * To add a language: author one file shaped like zh.ts and register it below.
 */
export interface Localization {
  code: string;
  intlLocale: string;
  nativeName: string;
  ui: Record<MessageKey, string>;
  /** Keyed by fields.json path. */
  fields: Record<string, FieldText>;
  /** Keyed by terminal config key, ledger field, or list name. */
  labels: Record<string, string>;
  /** Keyed by enum value. */
  enums: Record<string, string>;
  /** Keyed by the English unit string. */
  units: Record<string, string>;
}

export const en: Localization = {
  code: 'en',
  intlLocale: 'en-US',
  nativeName: 'English',
  ui: { ...enUI },
  fields: {},
  labels: {},
  enums: { US: 'United States', ppp: 'PPP' },
  units: {},
};

const FALLBACK = 'en';
const locales: Record<string, Localization> = { en, zh };

/** Display order for the language switcher. */
export function supportedLanguages(): Localization[] {
  return Object.values(locales);
}

export function intlLocaleFor(code: string): string {
  return locales[code]?.intlLocale ?? locales[FALLBACK].intlLocale;
}

/** First registered match wins; region codes degrade to their base. */
export function resolveLanguage(
  candidates: readonly (string | undefined | null)[],
): string {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const lower = candidate.toLowerCase();
    if (locales[lower]) return lower;
    const base = lower.split('-')[0];
    if (locales[base]) return base;
  }
  return FALLBACK;
}

export type Vars = Record<string, string | number>;

export function translate(lang: string, key: MessageKey, vars?: Vars): string {
  const template = locales[lang]?.ui[key] ?? locales[FALLBACK].ui[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    vars?.[name] === undefined ? match : String(vars[name]),
  );
}

export function fieldText(lang: string, path: string): FieldText {
  const key = path.replace(/\[\d+\]/g, '[]');
  return locales[lang]?.fields[key] ?? {};
}

export function labelFor(lang: string, key: string, fallback: string): string {
  return locales[lang]?.labels[key] ?? fallback;
}

export function enumLabel(
  lang: string,
  value: string,
  fallback: string,
): string {
  return locales[lang]?.enums[value] ?? fallback;
}

export function unitFor(lang: string, unit: string): string {
  return locales[lang]?.units[unit] ?? unit;
}

const STORAGE_KEY = 'retire.language';

export function loadLanguage(): string {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    stored = null;
  }
  const browser: readonly string[] =
    typeof navigator === 'undefined' ? [] : (navigator.languages ?? []);
  return resolveLanguage([stored, ...browser]);
}

export function saveLanguage(code: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* Private browsing: the choice lasts for the session. */
  }
}
