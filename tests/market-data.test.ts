import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { references } from '../src/reference/bundle';
import {
  applyMarketData,
  withMarketData,
  parseMarketData,
  validateMarketData,
  marketDataHash,
  PUBLIC_MARKET_SOURCES,
  type MarketDataSnapshot,
} from '../src/reference/market-data';
import {
  fetchPublicMarketData,
  parsePublicMarketSources,
  type PublicSourceBytes,
  type PublicSourceId,
} from '../scripts/market-data-source';
import { marketDataMiddleware } from '../scripts/market-data-gateway';
import { createExampleDraft } from '../src/config/constructors';
import {
  validateScenario,
  parseScenario,
  exportScenario,
} from '../src/config/config';
import { prepareMarket, generateMarketPath } from '../src/model/market';
import {
  initialAccount,
  growAccount,
  emptyIncome,
  accountBalance,
} from '../src/model/accounts';
import type { BrokerageAccountConfig, DraftScenario } from '../src/model/types';

const directory = 'verification/sources/market-refresh';
const accepted = parseMarketData(
  readFileSync(`${directory}/market-data.json`, 'utf8'),
);
const independent = JSON.parse(
  readFileSync(`${directory}/independent-acceptance.json`, 'utf8'),
);
const raw = Object.fromEntries(
  Object.keys(PUBLIC_MARKET_SOURCES).map((id) => [
    id,
    new Uint8Array(
      readFileSync(
        `${directory}/${id === 'NYU' ? 'history.xls' : id + '.csv'}`,
      ),
    ),
  ]),
) as PublicSourceBytes;

it('M03: the same five public sources reproduce all annual rows and independently checked income yields', async () => {
  const first = parsePublicMarketSources(raw, accepted.fetched_at),
    second = parsePublicMarketSources(raw, '2026-10-20T00:00:00.000Z');
  expect(first).toEqual(accepted);
  expect(second.sha256).toBe(first.sha256);
  expect(first.history).toEqual(references.history);
  expect(first.income_yields.us_stocks.value).toBe(
    independent.independent_stock_yield,
  );
  expect(first.income_yields.us_bonds.value).toBe(
    independent.independent_bond_yield,
  );
  expect(first.income_yields.us_bonds.date).toBe(
    independent.bond_observation_date,
  );
  const calls: PublicSourceId[] = [];
  const refreshed = await fetchPublicMarketData(async (id) => {
    calls.push(id);
    return raw[id];
  });
  expect(calls.sort()).toEqual(Object.keys(PUBLIC_MARKET_SOURCES).sort());
  expect(refreshed.data.sha256).toBe(accepted.sha256);
});

it('M03: missing observations, incomplete fetches and edited package contents fail without replacing accepted data', async () => {
  const bad = {
    ...raw,
    CPIAUCNS: new TextEncoder().encode(
      new TextDecoder()
        .decode(raw.CPIAUCNS)
        .split('\n')
        .filter((row) => !row.startsWith('2020-12-01,'))
        .join('\n'),
    ),
  };
  expect(() => parsePublicMarketSources(bad, accepted.fetched_at)).toThrow(
    /Missing.*December CPI/,
  );
  const calls: string[] = [];
  await expect(
    fetchPublicMarketData(async (id) => {
      calls.push(id);
      if (id === 'DGS10') throw new Error('offline');
      return raw[id];
    }),
  ).rejects.toThrow(/DGS10.*offline.*No data applied/);
  expect(calls).toHaveLength(5);
  const changed = structuredClone(accepted) as MarketDataSnapshot;
  changed.history[0].us_bonds += 0.001;
  expect(() => validateMarketData(changed)).toThrow(/SHA-256/);
  changed.sha256 = marketDataHash(changed);
  changed.sources[0].url = 'https://example.com/private';
  expect(() => validateMarketData(changed)).toThrow(/public source list/);
  expect(references.market_data?.sha256).toBe(accepted.sha256);
});

it('M02 M04: market refresh applies sourced yields and FX while keeping user budgets, window choices and risk parameters', () => {
  const d = createExampleDraft();
  d.budget!.annual = 310000;
  d.market!.fx_sigma = 0.09;
  d.market!.home_cpi_mean = 0.04;
  d.market!.sample_end = 2022;
  const changed = applyMarketData(d, accepted, references);
  expect(changed.budget).toEqual(d.budget);
  expect(changed.accounts).toEqual(d.accounts);
  expect(changed.market!.income_yield_us_stocks).toBe(
    independent.independent_stock_yield,
  );
  expect(changed.market!.income_yield_us_bonds).toBe(
    independent.independent_bond_yield,
  );
  expect(changed.market!.fx_spot).toBe(accepted.latest.usd_cny.value);
  expect(changed.market!.fx_fair_value).toBe(d.market!.fx_fair_value);
  expect(changed.market!.home_cpi_mean).toBe(0.04);
  expect(changed.market!.fx_sigma).toBe(0.09);
  expect(changed.market!.sample_end).toBe(2022);
  expect(d.budget!.annual).toBe(310000);
  const future = structuredClone(accepted) as MarketDataSnapshot;
  future.fetched_at = '2027-10-20T00:00:00.000Z';
  future.history.push({ ...future.history.at(-1)!, year: 2026 });
  future.income_yields.us_stocks.date = '2026-12-31';
  future.sha256 = marketDataHash(future);
  const newRefs = withMarketData(references, validateMarketData(future)),
    whole = createExampleDraft();
  const extended = applyMarketData(whole, future, references);
  expect(extended.market!.sample_end).toBe(2026);
  expect(validateScenario(extended, newRefs).ok).toBe(true);
  expect(references.history).toHaveLength(98);
});

it('M02 M04: legacy Custom and FX stress fields are rejected and cannot affect historical returns, FX or the exported config', () => {
  const d = createExampleDraft(),
    v = validateScenario(d, references);
  if (!v.ok) throw new Error(JSON.stringify(v.issues));
  expect(prepareMarket(v.value.scenario, references)).toEqual(
    references.history,
  );
  const legacy = {
    ...d,
    market: {
      ...d.market,
      custom: {
        us_stocks: { mean: -0.3, vol: 0 },
        us_cpi: { mean: 0.4, vol: 0 },
      },
      fx_stress: [{ year: 2035, pct: -0.5 }],
    },
  };
  const imported = parseScenario(exportScenario(legacy as DraftScenario));
  expect(imported.ok).toBe(false);
  if (imported.ok) throw new Error('legacy market fields should fail');
  expect(
    imported.issues.some(
      (i) => i.code === 'unknown_key' && i.path === 'market.custom',
    ),
  ).toBe(true);
  expect(
    parseScenario('schema_version=1\n[market.custom.us_stocks]\nvol="bad"').ok,
  ).toBe(false);
  expect(
    parseScenario('schema_version=1\nmarket.fx_stress=[{year=2035,pct=nan}]')
      .ok,
  ).toBe(false);
});

it('M05 M06: sourced stock/bond income is taxed as income and reinvested, without adding it to historical total return', () => {
  const d = createExampleDraft(),
    v = validateScenario(d, references);
  if (!v.ok) throw new Error(JSON.stringify(v.issues));
  const s = v.value.scenario;
  const account = {
    ...s.accounts[1],
    type: 'brokerage',
    owner: 'A',
    share_A: 1,
    balance: 100000,
    allocation: { us_stocks: 0.4, us_bonds: 0.6, usd_cash: 0 },
  } as BrokerageAccountConfig;
  const state = initialAccount(account),
    income = { A: emptyIncome(), B: emptyIncome() },
    market = generateMarketPath(s, references, 0);
  const expectedReturn = 0.4 * market.us_stocks[0] + 0.6 * market.us_bonds[0];
  const growth = growAccount(account, state, s, 0, market, income);
  expect(growth.growth / 100000).toBeCloseTo(expectedReturn, 12);
  expect(accountBalance(state)).toBeCloseTo(100000 * (1 + expectedReturn), 8);
  expect(income.A.dividends).toBeCloseTo(
    40000 * independent.independent_stock_yield,
    8,
  );
  expect(income.A.interest_us).toBeCloseTo(
    60000 * independent.independent_bond_yield,
    8,
  );
  expect(state.bases.us_stocks).toBeCloseTo(
    40000 * (1 + independent.independent_stock_yield),
    8,
  );
  expect(state.bases.us_bonds).toBeCloseTo(
    60000 * (1 + independent.independent_bond_yield),
    8,
  );
});

it('M03 M11: the refresh gateway accepts only a parameter-free public-data GET and can recover from a source failure', async () => {
  let calls = 0;
  const middleware = marketDataMiddleware(async () => {
    calls++;
    if (calls === 1) throw new Error('FRED unavailable');
    return accepted;
  });
  const server = createServer((req, res) => {
    void middleware(req, res, () => {
      res.writeHead(404);
      res.end();
    });
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('Missing test port');
  const base = `http://127.0.0.1:${address.port}/api/market-data`;
  try {
    expect(
      (await fetch(base, { method: 'POST', body: 'test-only fake config' }))
        .status,
    ).toBe(405);
    expect((await fetch(base + '?source=arbitrary')).status).toBe(400);
    expect(calls).toBe(0);
    const failed = await fetch(base);
    expect(failed.status).toBe(502);
    expect(await failed.json()).toEqual({ error: 'FRED unavailable' });
    const success = await fetch(base);
    expect(success.status).toBe(200);
    expect(success.headers.get('cache-control')).toBe('no-store');
    expect(parseMarketData(await success.text())).toEqual(accepted);
    expect(calls).toBe(2);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
