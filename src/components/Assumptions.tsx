import { marketDataLabel } from '../reference/market-data';
import { calibrateChinaFx } from '../reference/fred';
import type { PublicReferenceBundle } from '../model/types';
import type { CompletedRun } from '../workers/pool';
import type { scenarioSummary } from '../model/preview';
import { useI18n } from '../i18n/context';

export default function Assumptions({
  references,
  hash,
  projection,
  summary,
  run,
}: {
  references: PublicReferenceBundle;
  hash: string;
  projection: unknown;
  summary?: ReturnType<typeof scenarioSummary>;
  run?: CompletedRun;
}) {
  const { t, lang } = useI18n();
  const data = references.market_data;
  return (
    <section className="panel assumptions">
      <h2>{t('assumptions.title')}</h2>
      <h3>{t('assumptions.marketTitle')}</h3>
      <p>
        {t('assumptions.marketP1', {
          label: marketDataLabel(references, lang),
          count: references.history.length,
        })}
      </p>
      <p>{t('assumptions.marketP2')}</p>
      <p>{t('assumptions.marketP3')}</p>
      {data && (
        <details>
          <summary>{t('assumptions.sourcesTitle')}</summary>
          <p>{t('assumptions.fetched', { date: data.fetched_at })}</p>
          <ul>
            {data.sources.map((s) => (
              <li key={s.id}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.id}
                </a>{' '}
                {t('assumptions.rawSha')} <code>{s.sha256}</code>
              </li>
            ))}
          </ul>
          <pre>
            {JSON.stringify(
              calibrateChinaFx(data.china_cpi, data.usd_cny),
              null,
              2,
            )}
          </pre>
        </details>
      )}
      {projection !== undefined && (
        <pre>{JSON.stringify(projection, null, 2)}</pre>
      )}
      <h3>{t('assumptions.stopTitle')}</h3>
      <p>{t('assumptions.stopBody')}</p>
      <h3>{t('assumptions.healthTitle')}</h3>
      <p>{t('assumptions.healthBody')}</p>
      {summary && (
        <p>
          {t('assumptions.medicalFactor', {
            factor: summary.medical_factor.toFixed(4),
            real: summary.real_medical_factor.toFixed(4),
            ccy: summary.currency,
          })}
        </p>
      )}
      <h3>{t('assumptions.ssTitle')}</h3>
      <p>{t('assumptions.ssBody')}</p>
      <h3>{t('assumptions.fxTitle')}</h3>
      <p>{t('assumptions.fxBody')}</p>
      <h3>{t('assumptions.taxTitle')}</h3>
      <p>{t('assumptions.taxBody')}</p>
      <h3>{t('assumptions.pensionTitle')}</h3>
      <p>{t('assumptions.pensionBody')}</p>
      <h3>{t('assumptions.flexTitle')}</h3>
      <p>{t('assumptions.flexBody')}</p>
      <details>
        <summary>
          {t('assumptions.registry', {
            open: references.sources.filter((s) => s.status === 'unverified')
              .length,
          })}
        </summary>
        <ul>
          {references.sources.map((s) => (
            <li key={s.id}>
              <code>{s.id}</code> — {s.status}
            </li>
          ))}
        </ul>
      </details>
      <h3>{t('assumptions.snapshot')}</h3>
      <p>
        {t('assumptions.configHash')}{' '}
        <code data-testid="draft-hash">{hash}</code>
      </p>
      {run && <pre>{JSON.stringify(run.request.manifest, null, 2)}</pre>}
    </section>
  );
}
