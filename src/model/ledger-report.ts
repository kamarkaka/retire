import { LEDGER_FIELDS, LEDGER_REPORT_FIELDS, LI } from './layout';
import type { AnnualLedgerReport, ReplayResult } from './types';

export const LEDGER_CSV_FIELDS = [
  ...LEDGER_FIELDS.slice(0, 3),
  ...LEDGER_REPORT_FIELDS,
  ...LEDGER_FIELDS.slice(3),
];
const reportFields = new Set<string>(LEDGER_REPORT_FIELDS);
export function ledgerValue(
  replay: ReplayResult,
  yearIndex: number,
  field: string,
): number {
  if (reportFields.has(field))
    return (
      replay.years[yearIndex]?.report[field as keyof AnnualLedgerReport] ?? NaN
    );
  const index = LI[field];
  return index === undefined
    ? NaN
    : replay.ledger[yearIndex * LEDGER_FIELDS.length + index];
}
