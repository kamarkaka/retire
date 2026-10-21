import history from './history.json' with { type: 'json' };
import tables from './tax-tables.json' with { type: 'json' };
import sourceRows from './source-gates.json' with { type: 'json' };
import provenance from './provenance.json' with { type: 'json' };
import chinaCpi from './cn-cpi.json' with { type: 'json' };
import yearEndFx from './usdcny.json' with { type: 'json' };
import marketData from './market-data.json' with { type: 'json' };
import { validateMarketData, withMarketData } from './market-data';
import { hashObject, freezePlain } from '../model/canonical';
import { calibrateHistory } from './calibration';
import { calibrateChinaFx } from './fred';
import type {
  HistoricalRow,
  PublicReferenceBundle,
  SourceGate,
  TaxTables,
} from '../model/types';
export const REFERENCE_PROVENANCE = freezePlain(provenance);
export const REFERENCE_LABEL =
  'NYU/FRED historical US market data · 1928–2025 · China inflation and FX are modeled';
export const CHINA_CPI_REFERENCE = freezePlain(chinaCpi);
export const FX_REFERENCE = freezePlain(yearEndFx);
export const OBSERVED_CALIBRATION = freezePlain(
  calibrateChinaFx(chinaCpi, yearEndFx),
);
const calibration = calibrateHistory(history as HistoricalRow[]);
if (
  hashObject(history) !== provenance.history_sha256 ||
  hashObject(calibration) !== provenance.calibration_sha256
)
  throw new Error(
    'Bundled history/calibration does not match the accepted source',
  );
if (
  hashObject(chinaCpi) !== provenance.china_cpi_sha256 ||
  hashObject(yearEndFx) !== provenance.usdcny_sha256
)
  throw new Error(
    'Bundled China/FX calibration references do not match the accepted source',
  );
const acceptedBase: PublicReferenceBundle = freezePlain({
  history: history as HistoricalRow[],
  tax_tables: tables as unknown as TaxTables,
  sources: sourceRows as SourceGate[],
  versions: {
    history: provenance.version,
    calibration: 'retire-population-v1',
    tax_tables: 'spec-2026-unverified-v1',
    legal_sources: 'retire-sources-fixed-horizon-v2',
  },
  hashes: {
    history: hashObject(history),
    calibration: hashObject(calibration),
    tax_tables: hashObject(tables),
    legal_sources: hashObject(sourceRows),
  },
});
export const references = withMarketData(
  acceptedBase,
  validateMarketData(marketData),
);
