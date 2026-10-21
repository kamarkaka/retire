import history from './history.json' with { type: 'json' };
import tables from './tax-tables.json' with { type: 'json' };
import sourceRows from './source-gates.json' with { type: 'json' };
import { hashObject, freezePlain } from '../model/canonical';
import { calibrateHistory } from './calibration';
import type { HistoricalRow, PublicReferenceBundle, SourceGate, TaxTables } from '../model/types';
export const REFERENCE_LABEL='Synthetic demonstration data · not observed historical returns';
const calibration=calibrateHistory(history as HistoricalRow[]);
export const references: PublicReferenceBundle=freezePlain({
  history: history as HistoricalRow[],tax_tables:tables as unknown as TaxTables,sources:sourceRows as SourceGate[],
  versions:{history:'synthetic-demo-v1',calibration:'retire-population-v1',tax_tables:'spec-2026-unverified-v1',legal_sources:'retire-sources-fixed-horizon-v2'},
  hashes:{history:hashObject(history),calibration:hashObject(calibration),tax_tables:hashObject(tables),legal_sources:hashObject(sourceRows)},
});
