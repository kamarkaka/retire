import type { CompletedRun } from '../workers/pool';
import type { DetailedReplay } from '../model/engine';
import { LEDGER_CSV_FIELDS, ledgerValue } from '../model/ledger-report';
export function downloadLocal(
  name: string,
  text: string,
  type = 'text/plain;charset=utf-8',
) {
  const url = URL.createObjectURL(new Blob([text], { type })),
    link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function plainData(value: unknown): unknown {
  if (ArrayBuffer.isView(value))
    return Array.from(value as unknown as ArrayLike<number>);
  if (Array.isArray(value)) return value.map(plainData);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, plainData(v)]),
    );
  return value;
}
export function runManifestText(run: CompletedRun) {
  return JSON.stringify(
    {
      scientific: run.request.manifest,
      execution: run.execution,
      market_data: run.references.market_data,
      aggregate: plainData(run.aggregate),
      scope:
        'NYU/FRED historical market reference; source registry lists the checked tax subset and remaining open legal sources',
    },
    null,
    2,
  );
}
export function ledgerCsv(run: CompletedRun, replay: DetailedReplay) {
  const m = run.request.manifest;
  const comments = [
    `# run_id=${run.execution.run_id}`,
    `# path_id=${replay.path_id}`,
    `# seed=${m.seed}`,
    `# n_paths=${m.n_paths}`,
    `# horizon=${m.horizon}`,
    `# active_years=${replay.years.length}`,
    `# stop=${JSON.stringify(replay.stop)}`,
    `# scenario_sha256=${m.scenario_sha256}`,
    `# model_version=${m.model_version}`,
    `# build_version=${m.build_version}`,
    `# rng_version=${m.rng_version}`,
    `# ledger_report_version=${m.ledger_report_version}`,
    `# history_sha256=${m.reference_hashes.history}`,
    `# scientific_manifest=${JSON.stringify(m)}`,
    '# Starting balances precede all current-year cash flows and use opening FX. Other wealth/FX/index fields value year end. Full Float64 precision; CSV contains only simulated years.',
    "# spend_excluding_medical_cny includes the ordinary annual budget and one-time costs; medical_total_cny includes the single Budget health base, both people's shocks, and late-life care. Care is always additional.",
    '# annual_investment_return is a decimal, balance-weighted return across USD financial accounts after opening-year cash flows, measured at opening FX before tax and FX changes; property is excluded.',
    '# tax_us_A/B and tax_cn_A/B are that year computed bills, paid the same year; China bills are net of the same-year US credit.',
  ];
  const rows = Array.from({ length: replay.years.length }, (_, t) =>
    LEDGER_CSV_FIELDS.map((field) => {
      const v = ledgerValue(replay, t, field);
      return Number.isFinite(v) ? String(v) : '';
    }).join(','),
  );
  return [...comments, LEDGER_CSV_FIELDS.join(','), ...rows].join('\n') + '\n';
}
