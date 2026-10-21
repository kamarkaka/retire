export function money(
  value: number | null | undefined,
  currency = 'CNY',
  compact = false,
  locale = 'en-US',
): string {
  return value == null || !Number.isFinite(value)
    ? '—'
    : new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: compact ? 1 : 2,
        notation: compact ? 'compact' : 'standard',
      }).format(value);
}
export function percent(value: number | null | undefined, digits = 1): string {
  return value == null || !Number.isFinite(value)
    ? '—'
    : `${(value * 100).toFixed(digits)}%`;
}
export function number(value: number, locale = 'en-US'): string {
  return !Number.isFinite(value)
    ? '—'
    : new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }).format(value);
}
