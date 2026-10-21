import { useEffect, useState } from 'react';
import type { PublicReferenceBundle } from '../model/types';
import {
  parseMarketData,
  marketDataLabel,
  type MarketDataSnapshot,
} from '../reference/market-data';
import { percent } from './format';
import { useI18n } from '../i18n/context';
import type { MessageKey } from '../i18n/en';
import type { Vars } from '../i18n/core';

/** Localizable failure; raw engine/server text stays untranslated. */
class KeyedError extends Error {
  constructor(
    readonly key: MessageKey,
    readonly vars: Vars = {},
  ) {
    super(key);
  }
}

interface Notice {
  key: MessageKey;
  vars?: Vars;
  raw?: string;
}

export default function MarketData({
  references,
  onApply,
}: {
  references: PublicReferenceBundle;
  onApply: (data: Readonly<MarketDataSnapshot>) => void;
}) {
  const { t, lang } = useI18n();
  const [status, setStatus] = useState<Notice | null>(null),
    [error, setError] = useState<Notice | null>(null);
  const noticeText = (n: Notice) => n.raw ?? t(n.key, n.vars);
  // Server-managed data loads once on mount. There is no user refresh: the
  // server cron owns fetching. A missing endpoint means static hosting, where
  // the bundled data stands and uploads still work.
  useEffect(() => {
    const abort = new AbortController();
    let active = true;
    const load = async () => {
      try {
        const response = await fetch(
          new URL('api/market-data', document.baseURI),
          {
            method: 'GET',
            credentials: 'omit',
            cache: 'no-store',
            signal: abort.signal,
            headers: { accept: 'application/json' },
          },
        );
        if (!response.headers.get('content-type')?.includes('application/json'))
          return;
        const text = await response.text();
        if (!response.ok) {
          let raw: string | undefined;
          try {
            raw = JSON.parse(text).error;
          } catch {}
          throw raw ? new Error(raw) : new KeyedError('market.refreshFailed');
        }
        const data = parseMarketData(text);
        if (data.history.at(-1)!.year < references.history.at(-1)!.year)
          throw new KeyedError('market.fewerYears');
        if (!active) return;
        onApply(data);
        setError(null);
        setStatus({
          key: 'market.applied',
          vars: { years: data.history.length },
        });
      } catch (e) {
        if (!active || abort.signal.aborted) return;
        setStatus(null);
        setError(
          e instanceof KeyedError
            ? { key: e.key, vars: e.vars }
            : {
                key: 'market.refreshFailed',
                raw: e instanceof Error ? e.message : String(e),
              },
        );
      }
    };
    void load();
    return () => {
      active = false;
      abort.abort();
    };
  }, []);
  const data = references.market_data;
  return (
    <section className="market-data panel" aria-label={t('market.title')}>
      <div className="section-title">
        <div>
          <h2>{t('market.title')}</h2>
          <p className="muted">{marketDataLabel(references, lang)}</p>
          {data && (
            <p className="muted">
              {t('market.asOf', { date: data.fetched_at })}
            </p>
          )}
        </div>
      </div>
      <p>{t('market.intro')}</p>
      {data && (
        <>
          <div className="market-data-values">
            <p>
              <strong>{t('market.stockYield')}</strong>
              <span data-testid="stock-income-value">
                {percent(data.income_yields.us_stocks.value, 3)}
              </span>
              <small>
                {t('market.stockNote', {
                  date: data.income_yields.us_stocks.date,
                })}
              </small>
            </p>
            <p>
              <strong>{t('market.bondYield')}</strong>
              <span data-testid="bond-income-value">
                {percent(data.income_yields.us_bonds.value, 3)}
              </span>
              <small>
                {t('market.bondNote', {
                  date: data.income_yields.us_bonds.date,
                })}
              </small>
            </p>
            <p>
              <strong>{t('market.spotFx')}</strong>
              <span data-testid="source-fx-value">
                {data.latest.usd_cny.value}
              </span>
              <small>
                {t('market.fxNote', { date: data.latest.usd_cny.date })}
              </small>
            </p>
          </div>
          <p className="muted">{t('market.yieldNote')}</p>
          <details>
            <summary>{t('market.sourcesTitle')}</summary>
            <p>
              {t('market.fetched', { date: data.fetched_at })}{' '}
              <code data-testid="market-data-hash">{data.sha256}</code>
            </p>
            <ul>
              {data.sources.map((s) => (
                <li key={s.id}>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.id}
                  </a>{' '}
                  {t('market.retrieved', { date: s.retrieved_at })}{' '}
                  <code>{s.sha256}</code>
                </li>
              ))}
            </ul>
            <p>
              {t('market.cpi', {
                us: percent(data.latest.us_cpi.value),
                usDate: data.latest.us_cpi.date,
                cn: percent(data.latest.cn_cpi.value),
                cnDate: data.latest.cn_cpi.date,
              })}
            </p>
          </details>
        </>
      )}
      {status && (
        <p role="status" data-testid="market-refresh-status">
          {noticeText(status)}
        </p>
      )}
      {error && (
        <p role="alert">
          {noticeText(error)} {t('market.errorSuffix')}
        </p>
      )}
    </section>
  );
}
