import { useEffect, useState } from 'react';
import { startReplay, type CompletedRun } from '../workers/pool';
import type { DetailedReplay } from '../model/engine';
import { LEDGER_CSV_FIELDS, ledgerValue } from '../model/ledger-report';
import { downloadLocal, ledgerCsv, plainData } from '../config/downloads';
import { number } from './format';
import { pretty } from './Builder';
import { useI18n } from '../i18n/context';
import { labelFor } from '../i18n/core';
const selectedFields = [
  'year',
  'age_A',
  'age_B',
  'starting_liquid_usd',
  'starting_net_worth_cny',
  'spend_excluding_medical_cny',
  'medical_total_cny',
  'annual_investment_return',
  'fx',
  'tax_us_A',
  'tax_cn_A',
  'liquid_usd',
  'net_worth_cny_real',
  'shortfall_cny',
];
const labels: Record<string, string> = {
  starting_liquid_usd: 'Starting liquid USD',
  starting_net_worth_cny: 'Starting net worth CNY',
  spend_excluding_medical_cny: 'Spend CNY (excluding medical)',
  medical_total_cny: 'Medical CNY',
  annual_investment_return: 'Overall annual investment return',
  spend_cny: 'Ordinary spend CNY',
  medical_cny: 'Medical CNY',
  portfolio_return: 'USD portfolio return',
  tax_us_A: 'US income tax A',
  tax_cn_A: 'China income tax A',
  liquid_usd: 'Ending liquid USD',
  net_worth_cny_real: 'Ending net worth CNY (today’s money)',
};
const nonMoneyFields = new Set([
  'year',
  'age_A',
  'age_B',
  'alive_A',
  'alive_B',
  'fx',
  'home_index',
  'usd_index',
  'forced_sale',
  'sale_failed',
  'fx_quota_flag',
]);
const wholeMoneyCache: Record<string, Intl.NumberFormat> = {};
function displayValue(field: string, value: number, locale: string): string {
  if (field === 'annual_investment_return' || field === 'portfolio_return')
    return Number.isFinite(value) ? `${(value * 100).toFixed(2)}%` : '—';
  if (nonMoneyFields.has(field)) return number(value, locale);
  const wholeMoney = (wholeMoneyCache[locale] ??= new Intl.NumberFormat(
    locale,
    { maximumFractionDigits: 0 },
  ));
  return Number.isFinite(value)
    ? wholeMoney.format(Math.abs(value) < 0.5 ? 0 : value)
    : '—';
}
export default function Ledger({ run }: { run: CompletedRun }) {
  const { t, lang, intlLocale } = useI18n();
  const [path, setPath] = useState(run.aggregate.representative_paths.median),
    [replay, setReplay] = useState<DetailedReplay>(),
    [error, setError] = useState(''),
    [selected, setSelected] = useState(0),
    [all, setAll] = useState(false),
    [page, setPage] = useState(0);
  useEffect(() => {
    let active = true;
    setReplay(undefined);
    setError('');
    let job: ReturnType<typeof startReplay> | undefined;
    try {
      job = startReplay(run, run.references, path);
      void job.promise.then(
        (r) => {
          if (active) {
            setReplay(r);
            setSelected(0);
            setPage(0);
          }
        },
        (e) => {
          if (active) setError(e.message);
        },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    return () => {
      active = false;
      job?.cancel();
    };
  }, [run, path]);
  const fields = all ? LEDGER_CSV_FIELDS : selectedFields,
    detail = replay?.years[selected],
    rows = replay?.years.length ?? 0;
  return (
    <section className="panel ledger-panel">
      <div className="section-title">
        <div>
          <p className="eyebrow">{t('ledger.eyebrow')}</p>
          <h2>{t('ledger.title')}</h2>
        </div>
        <div className="toolbar">
          {(['worst', 'p10', 'median'] as const).map((k) => (
            <button
              key={k}
              type="button"
              className="small"
              onClick={() => setPath(run.aggregate.representative_paths[k])}
            >
              {k === 'p10' ? t('ledger.p10') : labelFor(lang, k, pretty(k))}
            </button>
          ))}
          <label className="inline-label">
            {t('ledger.pathId')}
            <input
              type="number"
              aria-label={t('ledger.pathIdAria')}
              min={0}
              max={run.request.manifest.n_paths - 1}
              value={path}
              onChange={(e) => {
                const id = Number(e.target.value);
                if (
                  Number.isSafeInteger(id) &&
                  id >= 0 &&
                  id < run.request.manifest.n_paths
                )
                  setPath(id);
              }}
            />
          </label>
        </div>
      </div>
      {error && <p role="alert">{error}</p>}
      {!replay && !error ? (
        <p role="status">{t('ledger.replaying', { path })}</p>
      ) : (
        replay && (
          <>
            <div className="toolbar ledger-toolbar">
              <span data-testid="ledger-ready">
                {t('ledger.summary', {
                  path,
                  years: replay.years.length,
                })}
              </span>
              <label className="inline-label">
                <input
                  type="checkbox"
                  checked={all}
                  onChange={(e) => setAll(e.target.checked)}
                />
                {t('ledger.allColumns', { count: LEDGER_CSV_FIELDS.length })}
              </label>
              <button
                className="secondary"
                disabled={rows === 0}
                onClick={() => {
                  setSelected(replay.years.length - 1);
                  setPage(Math.floor((replay.years.length - 1) / 100));
                }}
              >
                {t('ledger.lastYear')}
              </button>
              <button
                className="secondary"
                onClick={() =>
                  downloadLocal(
                    `retire-path-${path}.csv`,
                    ledgerCsv(run, replay),
                    'text/csv;charset=utf-8',
                  )
                }
              >
                {t('ledger.downloadCsv')}
              </button>
              <button
                className="secondary"
                onClick={() =>
                  downloadLocal(
                    `retire-path-${path}-provenance.json`,
                    JSON.stringify(
                      {
                        manifest: run.request.manifest,
                        replay: plainData(replay),
                      },
                      null,
                      2,
                    ),
                    'application/json',
                  )
                }
              >
                {t('ledger.downloadProv')}
              </button>
            </div>
            <p className="snapshot-note" data-testid="path-stop">
              {replay.stop.reason === 'max_age'
                ? t('ledger.stopMaxAge', { year: replay.stop.year })
                : replay.stop.year_index < 0
                  ? t('ledger.stopBefore')
                  : t('ledger.stopDepleted', { year: replay.stop.year })}
            </p>
            <p className="ledger-explanation">{t('ledger.explainer')}</p>
            <div className="table-scroll">
              <table aria-label={t('ledger.table')}>
                <thead>
                  <tr>
                    {fields.map((f) => (
                      <th key={f}>
                        {labelFor(lang, f, labels[f] ?? pretty(f))}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from(
                    { length: Math.min(100, rows - page * 100) },
                    (_, i) => i + page * 100,
                  ).map((ti) => (
                    <tr
                      key={ti}
                      className={selected === ti ? 'selected-row' : ''}
                      onClick={() => setSelected(ti)}
                    >
                      {fields.map((f) => (
                        <td key={f} data-field={f}>
                          {displayValue(
                            f,
                            ledgerValue(replay, ti, f),
                            intlLocale,
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="toolbar">
              <button
                className="small"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                {t('ledger.prevRows')}
              </button>
              <span>
                {t('ledger.rowsOf', {
                  a: rows === 0 ? 0 : page * 100 + 1,
                  b: Math.min(rows, (page + 1) * 100),
                  c: rows,
                })}
              </span>
              <button
                className="small"
                disabled={(page + 1) * 100 >= rows}
                onClick={() => setPage(page + 1)}
              >
                {t('ledger.nextRows')}
              </button>
            </div>
            <div className="year-detail">
              <h3>
                {t('ledger.yearTitle', {
                  year: detail?.year ?? t('ledger.yearOutside'),
                })}
              </h3>
              {detail ? (
                <>
                  <p>
                    {t('ledger.fxNote', {
                      open: number(replay.market.fx[selected], intlLocale),
                      close: number(replay.market.fx[selected + 1], intlLocale),
                    })}
                  </p>
                  <pre data-testid="year-provenance">
                    {JSON.stringify(
                      {
                        report: detail.report,
                        medical_detail: detail.medical_detail,
                        phases: detail.phases,
                        income: detail.income,
                        accounts: detail.accounts,
                        properties: detail.properties,
                        sales: detail.sales,
                        tax_detail: detail.tax_detail,
                        capital_loss_carryforward:
                          detail.capital_loss_carryforward,
                        closing_memo: detail.terminal,
                      },
                      null,
                      2,
                    )}
                  </pre>
                </>
              ) : (
                <p>{t('ledger.noYear')}</p>
              )}
            </div>
          </>
        )
      )}
    </section>
  );
}
