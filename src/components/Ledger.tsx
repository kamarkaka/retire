import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { startReplay, type CompletedRun } from '../workers/pool';
import type { DetailedReplay } from '../model/engine';
import type { PersonId } from '../model/types';
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
function money(value: number, locale: string): string {
  const wholeMoney = (wholeMoneyCache[locale] ??= new Intl.NumberFormat(
    locale,
    { maximumFractionDigits: 0 },
  ));
  return Number.isFinite(value)
    ? wholeMoney.format(Math.abs(value) < 0.5 ? 0 : value)
    : '—';
}
function pct(value: number): string {
  return Number.isFinite(value) ? `${(value * 100).toFixed(2)}%` : '—';
}
function displayValue(field: string, value: number, locale: string): string {
  if (field === 'annual_investment_return' || field === 'portfolio_return')
    return pct(value);
  if (nonMoneyFields.has(field)) return number(value, locale);
  return money(value, locale);
}
function num(value: unknown): number {
  return typeof value === 'number' ? value : NaN;
}
function rate(tax: number, base: number): number {
  return base !== 0 ? tax / base : NaN;
}
function YearModal({
  run,
  replay,
  ti,
  onClose,
}: {
  run: CompletedRun;
  replay: DetailedReplay;
  ti: number;
  onClose: () => void;
}) {
  const { t, intlLocale } = useI18n();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const detail = replay.years[ti],
    scenario = run.request.scenario,
    members: PersonId[] = scenario.people.B ? ['A', 'B'] : ['A'],
    china = scenario.people.domicile === 'China';
  const fxOpen = replay.market.fx[ti],
    fxClose = ledgerValue(replay, ti, 'fx'),
    usdClose = ledgerValue(replay, ti, 'usd_index');
  const gains = detail.investment_gain,
    gainTotal = gains.us_stocks + gains.us_bonds + gains.usd_cash;
  const equityClose = ledgerValue(replay, ti, 'property_equity_usd'),
    equityOpen =
      detail.report.starting_net_worth_cny / fxOpen -
      detail.report.starting_liquid_usd,
    propChange = equityClose - equityOpen;
  const endUsd = ledgerValue(replay, ti, 'liquid_usd') + equityClose;
  const outflows =
    detail.report.starting_liquid_usd + gainTotal + propChange - endUsd;
  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={t('modal.title', { year: detail.year })}
        data-testid="year-modal"
        style={{ maxWidth: 720 }}
      >
        <div className="section-title">
          <div>
            <h2>{t('modal.title', { year: detail.year })}</h2>
          </div>
          <button className="secondary" onClick={onClose}>
            {t('modal.close')}
          </button>
        </div>
        <h3>{t('modal.investment')}</h3>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>{t('modal.gain')}</th>
              <th>{t('modal.return')}</th>
            </tr>
          </thead>
          <tbody>
            {(
              [
                ['modal.stocks', 'us_stocks'],
                ['modal.bonds', 'us_bonds'],
                ['modal.cash', 'usd_cash'],
              ] as const
            ).map(([key, asset]) => (
              <tr key={asset}>
                <td>{t(key)}</td>
                <td>{money(gains[asset], intlLocale)}</td>
                <td>{pct(replay.market[asset][ti])}</td>
              </tr>
            ))}
            <tr>
              <td>
                <strong>{t('modal.total')}</strong>
              </td>
              <td>
                <strong>{money(gainTotal, intlLocale)}</strong>
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
        <h3>{t('modal.usTax')}</h3>
        {members.map((id) => {
          const status = scenario.people[id]!.us_income_tax_status,
            d = (detail.tax_detail[id] ?? {}) as Record<string, unknown>,
            income = detail.income[id];
          return (
            <div key={id}>
              <h4>
                {t('modal.person', { id })} ·{' '}
                {t(
                  status === 'resident'
                    ? 'modal.resident'
                    : 'modal.nonresident',
                )}
              </h4>
              {status === 'resident' ? (
                <table>
                  <tbody>
                    <tr>
                      <td>{t('modal.agi')}</td>
                      <td>{money(num(d.agi), intlLocale)}</td>
                    </tr>
                    <tr>
                      <td>{t('modal.deduction')}</td>
                      <td>{money(num(d.deduction), intlLocale)}</td>
                    </tr>
                    <tr>
                      <td>{t('modal.taxable')}</td>
                      <td>
                        <strong>{money(num(d.ti), intlLocale)}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td>{t('modal.incomeTax')}</td>
                      <td>{money(num(d.income_tax), intlLocale)}</td>
                    </tr>
                    <tr>
                      <td>{t('modal.niit')}</td>
                      <td>{money(num(d.niit), intlLocale)}</td>
                    </tr>
                    <tr>
                      <td>{t('modal.penalty')}</td>
                      <td>{money(num(d.penalty), intlLocale)}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>{t('modal.totalTax')}</strong>
                      </td>
                      <td>
                        <strong>
                          {money(
                            num(d.income_tax) + num(d.niit) + num(d.penalty),
                            intlLocale,
                          )}
                        </strong>
                      </td>
                    </tr>
                    <tr>
                      <td>{t('modal.effRate')}</td>
                      <td>
                        {pct(
                          rate(
                            num(d.income_tax) + num(d.niit) + num(d.penalty),
                            num(d.ti),
                          ),
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th></th>
                      <th>{t('modal.base')}</th>
                      <th>{t('modal.rate')}</th>
                      <th>{t('modal.tax')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        [
                          'modal.rentalProp',
                          income.rental_net +
                            income.ordinary_property_gain -
                            num(d.ordinary_loss_deduction) +
                            num(d.lt_gain),
                          num(d.rental_tax),
                        ],
                        [
                          'modal.dividends',
                          income.nra_dividends,
                          num(d.dividend_tax),
                        ],
                        [
                          'modal.pension',
                          income.trad_own + income.trad_inherited,
                          num(d.pension_tax),
                        ],
                        [
                          'modal.securities',
                          Math.max(0, income.cap_gain),
                          num(d.security_tax),
                        ],
                        ['modal.penalty', income.early_trad, num(d.penalty)],
                      ] as const
                    ).map(([key, base, tax]) => (
                      <tr key={key}>
                        <td>{t(key)}</td>
                        <td>{money(base, intlLocale)}</td>
                        <td>{pct(rate(tax, base))}</td>
                        <td>{money(tax, intlLocale)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td>
                        <strong>{t('modal.totalTax')}</strong>
                      </td>
                      <td></td>
                      <td></td>
                      <td>
                        <strong>{money(num(d.total), intlLocale)}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
        {china &&
          members.map((id) => {
            const raw = (detail.tax_detail[`${id}_china`] ?? {}) as Record<
                string,
                unknown
              >,
              income = detail.income[id],
              due = ledgerValue(replay, ti, `tax_cn_${id}`),
              before = num(raw.before_credit);
            return (
              <div key={id}>
                <h3>
                  {t('modal.cnTax')} · {t('modal.person', { id })}
                </h3>
                <table>
                  <thead>
                    <tr>
                      <th></th>
                      <th>{t('modal.base')}</th>
                      <th>{t('modal.rate')}</th>
                      <th>{t('modal.tax')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        [
                          'modal.dividends',
                          income.dividends * fxOpen,
                          num(raw.dividend_tax),
                        ],
                        [
                          'modal.interest',
                          income.interest_us * fxOpen,
                          num(raw.interest_tax),
                        ],
                        [
                          'modal.rent',
                          income.rent_gross * fxOpen,
                          num(raw.rent_tax),
                        ],
                        [
                          'modal.securities',
                          Math.max(0, income.cap_gain) * fxOpen,
                          num(raw.securities_tax),
                        ],
                        [
                          'modal.property',
                          Math.max(0, income.property_gain_cny),
                          num(raw.property_tax),
                        ],
                      ] as const
                    ).map(([key, base, tax]) => (
                      <tr key={key}>
                        <td>{t(key)}</td>
                        <td>{money(base, intlLocale)}</td>
                        <td>{pct(rate(tax, base))}</td>
                        <td>{money(tax, intlLocale)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td>{t('modal.beforeCredit')}</td>
                      <td></td>
                      <td></td>
                      <td>{money(before, intlLocale)}</td>
                    </tr>
                    <tr>
                      <td>{t('modal.credit')}</td>
                      <td></td>
                      <td></td>
                      <td>{money(before - due, intlLocale)}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>{t('modal.due')}</strong>
                      </td>
                      <td></td>
                      <td></td>
                      <td>
                        <strong>{money(due, intlLocale)}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        <h3>{t('modal.walk')}</h3>
        <table>
          <tbody>
            <tr>
              <td>{t('modal.start')}</td>
              <td>{money(detail.report.starting_liquid_usd, intlLocale)}</td>
            </tr>
            <tr>
              <td>{t('modal.stocks')}</td>
              <td>{money(gains.us_stocks, intlLocale)}</td>
            </tr>
            <tr>
              <td>{t('modal.bonds')}</td>
              <td>{money(gains.us_bonds, intlLocale)}</td>
            </tr>
            <tr>
              <td>{t('modal.cash')}</td>
              <td>{money(gains.usd_cash, intlLocale)}</td>
            </tr>
            <tr>
              <td>{t('modal.propChange')}</td>
              <td>{money(propChange, intlLocale)}</td>
            </tr>
            <tr>
              <td>{t('modal.outflows')}</td>
              <td>{money(-outflows, intlLocale)}</td>
            </tr>
            <tr>
              <td>
                <strong>{t('modal.endUsd')}</strong>
              </td>
              <td>
                <strong>{money(endUsd, intlLocale)}</strong>
              </td>
            </tr>
            <tr>
              <td>{t('modal.viaFx', { fx: number(fxClose, intlLocale) })}</td>
              <td>{money(endUsd * fxClose, intlLocale)}</td>
            </tr>
            <tr>
              <td>
                <strong>{t('modal.endCny')}</strong>
              </td>
              <td>
                <strong>
                  {money(ledgerValue(replay, ti, 'net_worth_cny'), intlLocale)}
                </strong>
              </td>
            </tr>
            <tr>
              <td>
                {t('modal.viaIndex', { index: number(usdClose, intlLocale) })}
              </td>
              <td>{money(endUsd / usdClose, intlLocale)}</td>
            </tr>
            <tr>
              <td>
                <strong>{t('modal.endReal')}</strong>
              </td>
              <td>
                <strong>
                  {money(
                    ledgerValue(replay, ti, 'net_worth_usd_real'),
                    intlLocale,
                  )}
                </strong>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}
export default function Ledger({ run }: { run: CompletedRun }) {
  const { t, lang, intlLocale } = useI18n();
  const [path, setPath] = useState(run.aggregate.representative_paths.median),
    [replay, setReplay] = useState<DetailedReplay>(),
    [error, setError] = useState(''),
    [selected, setSelected] = useState(0),
    [loading, setLoading] = useState(true),
    [modalYear, setModalYear] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    // Keep the previous replay on screen while the new path loads so the
    // toolbar and table do not unmount and flicker on every switch.
    setLoading(true);
    setModalYear(null);
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
                      onClick={() => {
                        setSelected(ti);
                        setModalYear(ti);
                      }}
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
      {modalYear !== null && replay && modalYear < replay.years.length && (
        <YearModal
          run={run}
          replay={replay}
          ti={modalYear}
          onClose={() => setModalYear(null)}
        />
      )}
    </section>
  );
}
