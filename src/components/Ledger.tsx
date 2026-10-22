import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { startReplay, type CompletedRun } from '../workers/pool';
import type { DetailedReplay } from '../model/engine';
import { ledgerValue } from '../model/ledger-report';
import { downloadLocal, ledgerCsv, plainData } from '../config/downloads';
import { number } from './format';
import { pretty } from './Builder';
import { useI18n } from '../i18n/context';
import { labelFor } from '../i18n/core';
function selectedFieldsFor(usDomicile: boolean, twoPeople: boolean): string[] {
  return [
    'year',
    'age_A',
    ...(twoPeople ? ['age_B'] : []),
    'starting_net_worth_usd',
    'spend_excluding_medical_cny',
    usDomicile ? 'medical_total_usd' : 'medical_total_cny',
    'annual_investment_return',
    ...(usDomicile ? [] : ['fx']),
    'tax_us_A',
    ...(usDomicile ? [] : ['tax_cn_A']),
    'net_worth_usd_real',
  ];
}
const labels: Record<string, string> = {
  starting_net_worth_usd: 'Starting net worth USD',
  starting_liquid_usd: 'Starting liquid USD',
  starting_net_worth_cny: 'Starting net worth CNY',
  spend_excluding_medical_cny: 'Spend CNY (excluding medical)',
  medical_total_cny: 'Medical CNY',
  medical_total_usd: 'Medical USD',
  annual_investment_return: 'Overall annual investment return',
  spend_cny: 'Ordinary spend CNY',
  medical_cny: 'Medical CNY',
  portfolio_return: 'USD portfolio return',
  tax_us_A: 'US income tax A',
  tax_cn_A: 'China income tax A',
  liquid_usd: 'Ending liquid USD',
  net_worth_cny_real: 'Ending net worth CNY (today’s money)',
  net_worth_usd_real: 'Ending net worth USD (today’s money)',
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
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    // Keep the previous replay on screen while the new path loads so the
    // toolbar and table do not unmount and flicker on every switch.
    setLoading(true);
    setError('');
    let job: ReturnType<typeof startReplay> | undefined;
    try {
      job = startReplay(run, run.references, path);
      void job.promise.then(
        (r) => {
          if (active) {
            setReplay(r);
            setSelected(0);
            setLoading(false);
          }
        },
        (e) => {
          if (active) {
            setReplay(undefined);
            setError(e.message);
            setLoading(false);
          }
        },
      );
    } catch (e) {
      setReplay(undefined);
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
    return () => {
      active = false;
      job?.cancel();
    };
  }, [run, path]);
  const usDomicile = run.request.scenario.people.domicile === 'US',
    twoPeople = run.request.scenario.people.B !== undefined;
  const segKeys = ['worst', 'p10', 'median'] as const,
    segIndex = segKeys.findIndex(
      (k) => run.aggregate.representative_paths[k] === path,
    );
  const segGroup = useRef<HTMLDivElement>(null),
    [segThumb, setSegThumb] = useState({ left: 0, width: 0 }),
    [segWidth, setSegWidth] = useState(0);
  // Size every button to the widest label so none overflow, then align the
  // sliding thumb to the active button. Re-measure on every render and on
  // any resize, since layout can shift without a re-render.
  useLayoutEffect(() => {
    const group = segGroup.current;
    if (!group) return;
    const measure = () => {
      const buttons = [...group.querySelectorAll('button')],
        widest = Math.max(0, ...buttons.map((b) => b.scrollWidth));
      setSegWidth((prev) => (prev === widest || widest === 0 ? prev : widest));
      const active = group.querySelector('button.active');
      if (!active) return;
      const g = group.getBoundingClientRect(),
        b = active.getBoundingClientRect();
      setSegThumb((prev) =>
        prev.left === b.left - g.left && prev.width === b.width
          ? prev
          : { left: b.left - g.left, width: b.width },
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(group);
    for (const button of group.querySelectorAll('button')) ro.observe(button);
    return () => ro.disconnect();
  });
  const fields = selectedFieldsFor(usDomicile, twoPeople),
    detail = replay?.years[selected],
    rows = replay?.years.length ?? 0;
  // Derived USD columns divide the CNY report by the year's opening FX.
  const cellValue = (ti: number, f: string): number => {
    if (!replay) return NaN;
    if (f === 'starting_net_worth_usd')
      return (
        ledgerValue(replay, ti, 'starting_net_worth_cny') / replay.market.fx[ti]
      );
    if (f === 'medical_total_usd')
      return (
        ledgerValue(replay, ti, 'medical_total_cny') / replay.market.fx[ti]
      );
    return ledgerValue(replay, ti, f);
  };
  return (
    <section className="panel ledger-panel" aria-busy={loading}>
      <div className="section-title">
        <div>
          <p className="eyebrow">{t('ledger.eyebrow')}</p>
          <h2>{t('ledger.title')}</h2>
        </div>
        <div className="toolbar">
          <div
            className="seg-group"
            role="group"
            aria-label={t('ledger.pathGroup')}
            ref={segGroup}
          >
            {segKeys.map((k, i) => (
              <button
                key={k}
                type="button"
                className={i === segIndex ? 'active' : ''}
                aria-pressed={i === segIndex}
                disabled={loading}
                style={segWidth > 0 ? { width: segWidth } : undefined}
                onClick={() => setPath(run.aggregate.representative_paths[k])}
              >
                {k === 'p10' ? t('ledger.p10') : labelFor(lang, k, pretty(k))}
              </button>
            ))}
            <span
              className="seg-thumb"
              aria-hidden="true"
              style={
                segIndex >= 0 && segThumb.width > 0
                  ? {
                      opacity: 1,
                      width: segThumb.width,
                      left: segThumb.left,
                    }
                  : { opacity: 0 }
              }
            />
          </div>
          {replay && (
            <>
              <button
                className="secondary"
                disabled={loading}
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
                disabled={loading}
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
            </>
          )}
        </div>
      </div>
      {error && <p role="alert">{error}</p>}
      {!replay && !error ? (
        <p role="status">{t('ledger.replaying', { path })}</p>
      ) : (
        replay && (
          <>
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
                  {Array.from({ length: rows }, (_, ti) => ti).map((ti) => (
                    <tr
                      key={ti}
                      className={selected === ti ? 'selected-row' : ''}
                      onClick={() => setSelected(ti)}
                    >
                      {fields.map((f) => {
                        const shocked =
                          (f === 'medical_total_cny' ||
                            f === 'medical_total_usd') &&
                          ledgerValue(replay, ti, 'medical_shock_cny') > 0;
                        return (
                          <td key={f} data-field={f}>
                            {shocked && (
                              <span
                                className="shock-dot"
                                title={t('ledger.shockDot')}
                                aria-label={t('ledger.shockDot')}
                              />
                            )}
                            {displayValue(f, cellValue(ti, f), intlLocale)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
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
