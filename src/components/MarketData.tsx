import { useEffect, useRef, useState } from 'react';
import type { PublicReferenceBundle } from '../model/types';
import {
  MAX_MARKET_DATA_BYTES,
  parseMarketData,
  marketDataLabel,
  type MarketDataSnapshot,
} from '../reference/market-data';
import { downloadLocal } from '../config/downloads';
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
  disabled,
  onApply,
}: {
  references: PublicReferenceBundle;
  disabled: boolean;
  onApply: (data: Readonly<MarketDataSnapshot>) => void;
}) {
  const { t, lang } = useI18n();
  const [working, setWorking] = useState(false),
    [status, setStatus] = useState<Notice | null>(null),
    [error, setError] = useState<Notice | null>(null);
  const upload = useRef<HTMLInputElement>(null),
    controller = useRef<AbortController | undefined>(undefined),
    generation = useRef(0);
  useEffect(
    () => () => {
      generation.current++;
      controller.current?.abort();
    },
    [],
  );
  const noticeText = (n: Notice) => n.raw ?? t(n.key, n.vars);
  const asNotice = (e: unknown): Notice =>
    e instanceof KeyedError
      ? { key: e.key, vars: e.vars }
      : {
          key: 'market.refreshFailed',
          raw: e instanceof Error ? e.message : String(e),
        };
  const apply = (data: Readonly<MarketDataSnapshot>) => {
    onApply(data);
    setError(null);
    setStatus({
      key: 'market.applied',
      vars: { years: data.history.length },
    });
  };
  const refresh = async () => {
    const own = ++generation.current;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setWorking(true);
    setError(null);
    setStatus({ key: 'market.fetching' });
    const timer = setTimeout(() => abort.abort(), 35000);
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
        throw new KeyedError('market.noEndpoint');
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
      if (own === generation.current) apply(data);
    } catch (e) {
      if (own === generation.current) {
        setStatus(null);
        // User cancels and unmounts bump the generation above; any abort
        // reaching here is the refresh timeout.
        setError(
          abort.signal.aborted ? { key: 'market.timeout' } : asNotice(e),
        );
      }
    } finally {
      clearTimeout(timer);
      if (own === generation.current) {
        setWorking(false);
        controller.current = undefined;
      }
    }
  };
  const cancel = () => {
    generation.current++;
    controller.current?.abort();
    controller.current = undefined;
    setWorking(false);
    setStatus({ key: 'market.canceled' });
    setError(null);
  };
  const importPackage = async (file: File) => {
    const own = ++generation.current;
    setError(null);
    try {
      if (file.size > MAX_MARKET_DATA_BYTES)
        throw new KeyedError('market.tooLarge');
      const data = parseMarketData(await file.text());
      if (own === generation.current) apply(data);
    } catch (e) {
      if (own === generation.current) setError(asNotice(e));
    }
  };
  const data = references.market_data;
  return (
    <section className="market-data panel" aria-label={t('market.title')}>
      <div className="section-title">
        <div>
          <h2>{t('market.title')}</h2>
          <p className="muted">{marketDataLabel(references, lang)}</p>
        </div>
        <div className="toolbar">
          {working ? (
            <button className="secondary" onClick={cancel}>
              {t('market.cancelRefresh')}
            </button>
          ) : (
            <button
              className="secondary"
              disabled={disabled}
              onClick={() => void refresh()}
            >
              {t('market.refresh')}
            </button>
          )}
          <button
            className="secondary"
            disabled={working || disabled}
            onClick={() => upload.current?.click()}
          >
            {t('market.upload')}
          </button>
          {data && (
            <button
              className="secondary"
              onClick={() =>
                downloadLocal(
                  'retire-market-data.json',
                  JSON.stringify(data, null, 2),
                  'application/json',
                )
              }
            >
              {t('market.download')}
            </button>
          )}
        </div>
      </div>
      <input
        className="file-input"
        ref={upload}
        type="file"
        aria-label={t('market.uploadAria')}
        accept=".json,application/json"
        disabled={working || disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void importPackage(file);
          e.target.value = '';
        }}
      />
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
            <p>{t('market.reproduce')}</p>
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
