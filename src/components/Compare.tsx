import { useEffect, useState } from 'react';
import {
  pairedRuns,
  completedBytes,
  startComparison,
  type CompletedRun,
} from '../workers/pool';
import type { PairedComparison } from '../model/comparison';
import { money, percent } from './format';
import { downloadLocal } from '../config/downloads';
import { exportScenario } from '../config/config';
import { useI18n } from '../i18n/context';
import Ledger from './Ledger';

const comparedFields = [
  ['terminal_net_worth_usd_real', 'compare.preTaxWealth'],
  ['terminal_net_heirs_usd_real', 'compare.netHeirs'],
  ['lifetime_income_tax_cash_usd_real', 'compare.lifetimeTax'],
  ['terminal_income_due_usd_real', 'compare.terminalDue'],
] as const;

export default function Compare({
  run,
  baseline,
  onPin,
  onUnpin,
}: {
  run: CompletedRun;
  baseline?: CompletedRun;
  onPin: () => void;
  onUnpin: () => void;
}) {
  const { t, intlLocale } = useI18n();
  const [comparison, setComparison] = useState<PairedComparison>(),
    [error, setError] = useState('');
  const [showLedger, setShowLedger] = useState(false);
  const paired = baseline ? pairedRuns(baseline, run) : false;
  useEffect(() => {
    let active = true,
      job: ReturnType<typeof startComparison> | undefined;
    setComparison(undefined);
    setError('');
    if (baseline && paired) {
      try {
        job = startComparison(baseline, run);
        void job.promise.then(
          (result) => {
            if (active) setComparison(result);
          },
          (e) => {
            if (active) setError(e.message);
          },
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    }
    return () => {
      active = false;
      job?.cancel();
    };
  }, [baseline, run, paired]);

  return (
    <section className="panel">
      <div className="section-title">
        <h2>{t('compare.title')}</h2>
        {baseline ? (
          <button className="secondary" onClick={onUnpin}>
            {t('compare.unpin')}
          </button>
        ) : (
          <button className="secondary" onClick={onPin}>
            {t('export.pin')}
          </button>
        )}
      </div>
      {baseline ? (
        <>
          <p data-testid="comparison-compatibility">
            {paired ? t('compare.paired') : t('compare.unpaired')}
          </p>
          <div className="table-scroll">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>{t('compare.metric')}</th>
                  <th>{t('compare.baseline')}</th>
                  <th>{t('compare.current')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{t('compare.configuration')}</td>
                  <td>
                    <code>
                      {baseline.request.manifest.scenario_sha256.slice(0, 12)}
                    </code>
                  </td>
                  <td>
                    <code>
                      {run.request.manifest.scenario_sha256.slice(0, 12)}
                    </code>
                  </td>
                </tr>
                <tr>
                  <td>{t('compare.fundingSuccess')}</td>
                  <td>{percent(baseline.aggregate.success_probability)}</td>
                  <td>{percent(run.aggregate.success_probability)}</td>
                </tr>
                {comparedFields.map(([field, labelKey]) => (
                  <tr key={field}>
                    <td>{t('compare.medianSuffix', { label: t(labelKey) })}</td>
                    <td>
                      {money(
                        baseline.aggregate.monetary_quantiles[field].p50,
                        'USD',
                        false,
                        intlLocale,
                      )}
                    </td>
                    <td>
                      {money(
                        run.aggregate.monetary_quantiles[field].p50,
                        'USD',
                        false,
                        intlLocale,
                      )}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td>{t('compare.pathsSeed')}</td>
                  <td>
                    {baseline.request.manifest.n_paths} /{' '}
                    {baseline.request.manifest.seed}
                  </td>
                  <td>
                    {run.request.manifest.n_paths} / {run.request.manifest.seed}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {paired && (
            <>
              <h3>{t('compare.deltasTitle')}</h3>
              <p>{t('compare.deltasHint')}</p>
              {error ? (
                <p role="alert">{error}</p>
              ) : comparison ? (
                <>
                  <div className="table-scroll">
                    <table data-testid="paired-deltas">
                      <thead>
                        <tr>
                          <th>{t('compare.metric')}</th>
                          <th>{t('chart.p10')}</th>
                          <th>{t('chart.median')}</th>
                          <th>{t('chart.p90')}</th>
                          <th>{t('compare.matched')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparedFields.map(([field, labelKey]) => {
                          const d = comparison.deltas[field];
                          return (
                            <tr key={field}>
                              <td>{t(labelKey)}</td>
                              <td>{money(d.p10, 'USD', false, intlLocale)}</td>
                              <td>{money(d.p50, 'USD', false, intlLocale)}</td>
                              <td>{money(d.p90, 'USD', false, intlLocale)}</td>
                              <td>{d.paired_count}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <button
                    className="small"
                    onClick={() =>
                      downloadLocal(
                        'retire-paired-comparison.json',
                        JSON.stringify(
                          {
                            baseline: baseline.request.manifest,
                            current: run.request.manifest,
                            comparison,
                          },
                          null,
                          2,
                        ),
                        'application/json',
                      )
                    }
                  >
                    {t('compare.downloadPaired')}
                  </button>
                </>
              ) : (
                <p role="status">{t('compare.computing')}</p>
              )}
            </>
          )}
          <p className="muted">
            {t('compare.retained', {
              mib: (completedBytes(baseline) / 1048576).toFixed(2),
            })}
          </p>
          <button
            className="secondary"
            onClick={() =>
              downloadLocal(
                'retire-baseline.toml',
                exportScenario(baseline.request.scenario),
              )
            }
          >
            {t('compare.downloadBaseline')}
          </button>
          <button
            className="secondary"
            onClick={() => setShowLedger(!showLedger)}
          >
            {showLedger ? t('compare.hideLedger') : t('compare.showLedger')}
          </button>
          {showLedger && (
            <>
              <h3>
                {t('compare.baselineLedger', {
                  seed: baseline.request.manifest.seed,
                })}
              </h3>
              <Ledger key={baseline.execution.run_id} run={baseline} />
            </>
          )}
        </>
      ) : (
        <p>{t('compare.empty')}</p>
      )}
    </section>
  );
}
