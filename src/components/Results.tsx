import { useMemo, useState } from 'react';
import type { CompletedRun } from '../workers/pool';
import Chart from './Chart';
import { money, percent } from './format';
import { useI18n } from '../i18n/context';
import type { EChartsCoreOption } from 'echarts/core';
const base = {
  grid: { left: 70, right: 24, top: 20, bottom: 45 },
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    axisLine: { lineStyle: { color: '#c5ceca' } },
    axisLabel: { color: '#697873' },
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: '#e8eeea' } },
    axisLabel: { color: '#697873' },
  },
};
export default function Results({ run }: { run: CompletedRun }) {
  const { t, intlLocale } = useI18n();
  const [unit, setUnit] = useState<'real_cny' | 'real_usd' | 'nominal_cny'>(
      'real_usd',
    ),
    a = run.aggregate,
    m = run.request.manifest;
  const wealth = useMemo<EChartsCoreOption>(() => {
    const bands =
        unit === 'real_cny'
          ? a.net_worth_bands
          : unit === 'real_usd'
            ? a.net_worth_usd_bands
            : a.nominal_bands,
      currency = unit === 'real_usd' ? 'USD' : 'CNY',
      years = Array.from({ length: m.horizon }, (_, t) =>
        String(m.start_year + t),
      );
    const values = (f: number) =>
      years.map((_, t) =>
        Number.isFinite(bands[t * 3 + f]) ? bands[t * 3 + f] : null,
      );
    return {
      ...base,
      xAxis: { ...base.xAxis, data: years },
      yAxis: {
        ...base.yAxis,
        axisLabel: {
          formatter: (n: number) => money(n, currency, true, intlLocale),
          color: '#697873',
        },
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: { dataIndex: number }[]) => {
          const ti = params[0]?.dataIndex ?? 0;
          return `<b>${t('chart.tooltipTitle', { year: m.start_year + ti, age: m.start_age_A + ti })}</b><br>${t('chart.p10')}: ${money(bands[ti * 3], currency, false, intlLocale)}<br>${t('chart.median')}: ${money(bands[ti * 3 + 1], currency, false, intlLocale)}<br>${t('chart.p90')}: ${money(bands[ti * 3 + 2], currency, false, intlLocale)}`;
        },
      },
      series: [
        {
          type: 'line',
          data: values(0),
          stack: 'band',
          lineStyle: { opacity: 0 },
          areaStyle: { opacity: 0 },
          symbol: 'none',
          silent: true,
        },
        {
          type: 'line',
          data: years.map((_, t) =>
            Number.isFinite(bands[t * 3 + 2])
              ? bands[t * 3 + 2] - bands[t * 3]
              : null,
          ),
          stack: 'band',
          lineStyle: { opacity: 0 },
          areaStyle: { color: '#43827b', opacity: 0.16 },
          symbol: 'none',
          silent: true,
        },
        {
          name: t('chart.median'),
          type: 'line',
          data: values(1),
          lineStyle: { color: '#1f6259', width: 3 },
          itemStyle: { color: '#1f6259' },
          symbol: 'none',
        },
      ],
    };
  }, [a, m, unit, t, intlLocale]);
  const funding = useMemo<EChartsCoreOption>(
    () => ({
      ...base,
      grid: { left: 50, right: 20, top: 30, bottom: 40 },
      legend: { bottom: 0, textStyle: { fontSize: 11 } },
      xAxis: {
        ...base.xAxis,
        data: Array.from({ length: m.horizon }, (_, t) => m.start_year + t),
      },
      yAxis: {
        ...base.yAxis,
        min: 0,
        max: 1,
        axisLabel: { formatter: (n: number) => `${n * 100}%` },
      },
      series: [
        {
          name: t('chart.funded'),
          type: 'line',
          data: Array.from(a.yearly_alive_not_depleted),
          symbol: 'none',
          lineStyle: { color: '#1f6259', width: 2 },
        },
      ],
    }),
    [a, m, t],
  );
  const fx = useMemo<EChartsCoreOption>(
    () => ({
      ...base,
      grid: { left: 45, right: 20, top: 30, bottom: 40 },
      xAxis: {
        ...base.xAxis,
        data: Array.from({ length: m.horizon + 1 }, (_, t) => m.start_year + t),
      },
      yAxis: { ...base.yAxis, scale: true },
      series: [0, 1, 2].map((q) => ({
        name: [t('chart.p10'), t('chart.median'), t('chart.p90')][q],
        type: 'line',
        data: Array.from(
          { length: m.horizon + 1 },
          (_, ti) => a.market_bands.fx[ti * 3 + q],
        ),
        symbol: 'none',
        lineStyle: {
          color: q === 1 ? '#1f6259' : '#afc8c0',
          width: q === 1 ? 2 : 1,
          type: q === 1 ? 'solid' : 'dashed',
        },
      })),
    }),
    [a, m, t],
  );
  const depletion = useMemo<EChartsCoreOption>(
    () => ({
      ...base,
      grid: { left: 50, right: 20, top: 25, bottom: 40 },
      xAxis: {
        ...base.xAxis,
        boundaryGap: true,
        data: a.depletion_histogram.map((v) => v.age),
        name: t('chart.ageAxis'),
      },
      yAxis: { ...base.yAxis, minInterval: 1, name: t('chart.pathsAxis') },
      series: [
        {
          type: 'bar',
          data: a.depletion_histogram.map((v) => v.count),
          itemStyle: { color: '#a27c50' },
        },
      ],
    }),
    [a, t],
  );
  const k = a.monetary_quantiles;
  return (
    <section className="results" aria-label={t('tabs.results')}>
      <div className="results-title">
        <div>
          <p className="eyebrow">{t('results.eyebrow')}</p>
          <h2>{t('results.title')}</h2>
        </div>
        <span className="chip">
          {t('results.paths', {
            paths: a.n_paths.toLocaleString(intlLocale),
            seconds: (run.execution.elapsed_ms! / 1000).toFixed(2),
          })}
        </span>
      </div>
      <div className="metric-grid">
        <article className="metric">
          <span>{t('results.fundingTitle')}</span>
          <strong data-testid="success-probability">
            {percent(a.success_probability)}
          </strong>
          <small>{t('results.fundingHint')}</small>
        </article>
        <article className="metric">
          <span>{t('results.terminalTitle')}</span>
          <strong data-testid="terminal-assets">
            {money(k.terminal_net_worth_usd_real.p50, 'USD', true, intlLocale)}
          </strong>
          <small>{t('results.terminalHint')}</small>
        </article>
        <article className="metric">
          <span>{t('results.heirsTitle')}</span>
          <strong data-testid="net-heirs">
            {money(k.terminal_net_heirs_usd_real.p50, 'USD', true, intlLocale)}
          </strong>
          <small>{t('results.heirsHint')}</small>
        </article>
      </div>
      <article className="chart-card">
        <div className="chart-header">
          <div>
            <h3>{t('results.wealthTitle')}</h3>
            <p>{t('results.wealthHint')}</p>
          </div>
          <select
            aria-label={t('results.unitsAria')}
            value={unit}
            onChange={(e) => setUnit(e.target.value as typeof unit)}
          >
            <option value="real_cny">{t('results.unitRealCny')}</option>
            <option value="real_usd">{t('results.unitRealUsd')}</option>
            <option value="nominal_cny">{t('results.unitNominalCny')}</option>
          </select>
        </div>
        <Chart option={wealth} label={t('results.wealthChart')} />
        <p className="chart-note">{t('results.wealthNote')}</p>
      </article>
      <div className="two-columns">
        <article className="chart-card">
          <h3>{t('results.fundingChart')}</h3>
          <p>
            {t('results.fundingDenom', {
              paths: a.n_paths.toLocaleString(intlLocale),
            })}
          </p>
          <Chart option={funding} label={t('results.fundingChartLabel')} />
        </article>
        <article className="chart-card">
          <h3>{t('results.fxTitle')}</h3>
          <p>{t('results.fxHint')}</p>
          <Chart option={fx} label={t('results.fxChart')} />
        </article>
      </div>
      <article className="chart-card">
        <h3>{t('results.depletionTitle')}</h3>
        <p>
          {a.depletion_histogram.length
            ? t('results.depletionSome')
            : t('results.depletionNone')}
        </p>
        <Chart option={depletion} label={t('results.depletionChart')} />
      </article>
      <article className="panel">
        <h3>{t('results.taxTitle')}</h3>
        <div className="stat-grid">
          <div>
            <span>{t('results.forcedSale')}</span>
            <b>{percent(a.forced_sale_probability)}</b>
          </div>
          <div>
            <span>{t('results.lifetimeTax')}</span>
            <b>
              {money(
                k.lifetime_income_tax_cash_usd_real.p50,
                'USD',
                false,
                intlLocale,
              )}
            </b>
          </div>
          <div>
            <span>{t('results.terminalDue')}</span>
            <b>
              {money(
                k.terminal_income_due_usd_real.p50,
                'USD',
                false,
                intlLocale,
              )}
            </b>
          </div>
        </div>
        <p className="muted">{t('results.taxNote')}</p>
      </article>
    </section>
  );
}
