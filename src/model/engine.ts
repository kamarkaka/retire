import type {
  RunRequest,
  PublicReferenceBundle,
  CompactPathResult,
  ReplayResult,
  PersonId,
  IncomeLedger,
  ScenarioConfig,
  AccountState,
  PropertyState,
  TerminalMemo,
  AnnualLedgerReport,
} from './types';
import { generateMarketPath } from './market';
import { makeDraws } from './rng';
import { consumption } from './consumption';
import {
  initialAccount,
  accountBalance,
  emptyIncome,
  withdrawAccount,
  depositAccount,
  growAccount,
  rebalance,
  access,
  rmdAmount,
} from './accounts';
import {
  initialProperty,
  closingQuote,
  executeSale,
  classifyPropertySales,
  propertyCash,
  growProperty,
  type SaleRecord,
} from './property';
import { calculateUS, chinaTax, chinaApplies, applyCredit } from './tax';
import {
  LEDGER_FIELDS,
  CHART_FIELDS,
  FLOAT_FIELDS,
  INT_FIELDS,
  FLAG_FIELDS,
  LI,
  FI,
  II,
  BI,
} from './layout';
import { cleanResidual, NUMERICAL_ZERO, SimulationError } from './errors';

export const YEAR_PHASES = [
  'start',
  'property strategies',
  'rent RMD',
  'consumption',
  'funding living needs',
  'returns',
  'rebalance',
  'compute income taxes',
  'pay income taxes',
  'end-of-horizon and ledger',
];
export interface DetailedYear {
  year: number;
  report: AnnualLedgerReport;
  medical_detail: {
    base_cny: number;
    shock_cny: number;
    late_life_care_cny: number;
  };
  phases: readonly string[];
  income: Record<PersonId, IncomeLedger>;
  accounts: AccountState[];
  properties: PropertyState[];
  sales: SaleRecord[];
  terminal?: TerminalMemo;
  tax_detail: Record<string, unknown>;
  capital_loss_carryforward: Record<PersonId, number>;
}
export type DetailedReplay = Omit<ReplayResult, 'years'> & {
  years: DetailedYear[];
};
function createBuffers() {
  return {
    floats: new Float64Array(FLOAT_FIELDS.length).fill(NaN),
    integers: new Int32Array(INT_FIELDS.length).fill(-1),
    flags: new Uint8Array(FLAG_FIELDS.length),
  };
}

function runPath(
  request: RunRequest,
  refs: PublicReferenceBundle,
  pathId: number,
  trace: boolean,
  controlledMarket?: import('./types').MarketPath,
) {
  const s = request.scenario as ScenarioConfig,
    T = request.manifest.horizon,
    tables = request.effective_tax_tables,
    market = controlledMarket ?? generateMarketPath(s, refs, pathId),
    draws = makeDraws(s, pathId, T);
  const ledger = new Float64Array(T * LEDGER_FIELDS.length).fill(NaN),
    charts = new Float32Array(T * CHART_FIELDS.length).fill(NaN),
    summary = createBuffers(),
    years: DetailedYear[] = [];
  const accounts = s.accounts.map(initialAccount),
    properties = s.properties.map(initialProperty);
  const capitalLoss = { A: 0, B: 0 };
  let priorReturn = NaN,
    firstDepletion = -1,
    activeYears = 0,
    quotaYears = 0,
    returnYears = 0,
    growthFactor = 1,
    incomeTaxCashReal = 0,
    incomeTaxCashUsdReal = 0,
    at85Cny = NaN,
    at85Usd = NaN,
    unpaidUsd = 0,
    unpaidCny = 0,
    terminal: TerminalMemo | undefined,
    stop: ReplayResult['stop'] | undefined;
  const surplusIndex = s.accounts.findIndex(
      (a) => a.name === s.withdrawals.surplus_account,
    ),
    byName = new Map(s.accounts.map((a, i) => [a.name, i]));
  const valueWealth = (fx: number) => {
    let usd = 0,
      cny = 0;
    accounts.forEach((a, i) => {
      if (s.accounts[i].type === 'cash_cny') cny += accountBalance(a);
      else usd += accountBalance(a);
    });
    const equity = properties
      .filter((p) => p.held)
      .reduce((n, p) => n + p.value - p.mortgage_balance, 0);
    return { usd, cny, equity, net: (usd + equity) * fx + cny };
  };
  const suspended = (id: PersonId) =>
    properties
      .filter((p) => p.held)
      .reduce((n, p) => n + p.owners[id].suspended_loss, 0);
  const updatePassive = (id: PersonId, value: number) => {
    const owned = properties.filter((p) => p.held && p.owners[id].share > 0);
    owned.forEach((p) => (p.owners[id].suspended_loss = 0));
    if (owned.length) owned[0].owners[id].suspended_loss = value;
  };
  function finish(
    t: number,
    wealth: ReturnType<typeof valueWealth>,
    reason: ReplayResult['stop']['reason'],
  ) {
    const boundary = t + 1,
      year = s.simulation.start_year + Math.max(0, t);
    const incomeDue = unpaidCny + unpaidUsd * market.fx[boundary],
      signed = cleanResidual(wealth.net - incomeDue);
    terminal = {
      year,
      assets_cny: wealth.net,
      income_due_cny: incomeDue,
      signed_net_cny: signed,
      net_to_heirs_cny: Math.max(0, signed),
    };
    stop = {
      reason,
      year,
      year_index: t,
      net_worth_cny: cleanResidual(wealth.net),
    };
    const nominalReal = wealth.net / market.home_index[boundary];
    const cn = market.home_index[boundary];
    const usd = market.usd_index[boundary],
      fxB = market.fx[boundary],
      toUsdReal = (cny: number) => cny / fxB / usd;
    const values = {
      terminal_net_worth_cny_real: nominalReal,
      terminal_net_worth_usd_real: toUsdReal(wealth.net),
      net_worth_at_A85_cny_real: at85Cny,
      net_worth_at_A85_usd_real: at85Usd,
      terminal_income_due_cny_real: terminal!.income_due_cny / cn,
      terminal_income_due_usd_real: toUsdReal(terminal!.income_due_cny),
      terminal_signed_net_cny_real: terminal!.signed_net_cny / cn,
      terminal_net_heirs_cny_real: terminal!.net_to_heirs_cny / cn,
      terminal_net_heirs_usd_real: toUsdReal(terminal!.net_to_heirs_cny),
      lifetime_income_tax_cash_cny_real: incomeTaxCashReal,
      lifetime_income_tax_cash_usd_real: incomeTaxCashUsdReal,
      portfolio_growth_factor: growthFactor,
      terminal_fx: fxB,
      terminal_home_index: cn,
      terminal_usd_index: usd,
    };
    for (const [key, value] of Object.entries(values))
      summary.floats[FI[key]] = value;
    const integers = {
      first_depletion_t: firstDepletion,
      terminal_t: t,
      active_years: activeYears,
      fx_quota_years: quotaYears,
      portfolio_return_years: returnYears,
    };
    for (const [key, value] of Object.entries(integers))
      summary.integers[II[key]] = value;
    summary.flags[BI.depleted] = Number(firstDepletion >= 0);
  }

  const initialWealth = valueWealth(market.fx[0]);
  if (cleanResidual(initialWealth.net) <= 0) {
    firstDepletion = 0;
    summary.floats[FI.initial_included_recurring_cny] =
      s.budget.annual * (s.people.domicile === 'US' ? market.fx[0] : 1);
    summary.floats[FI.initial_health_cny] =
      s.budget.included_health *
      (s.people.domicile === 'US' ? market.fx[0] : 1);
    finish(-1, initialWealth, 'net_assets_nonpositive');
  }

  for (let t = 0; t < T && !terminal; t++) {
    // 1. Everyone remains alive through the inclusive planning horizon.
    const openingWealth = trace ? valueWealth(market.fx[t]) : undefined;
    const members = (['A', 'B'] as const).filter(
      (id) => id === 'A' || s.people.B !== undefined,
    );
    const year = s.simulation.start_year + t,
      income = { A: emptyIncome(), B: emptyIncome() },
      sales: SaleRecord[] = [],
      taxDetail: Record<string, unknown> = {};
    activeYears++;
    let cashUsd = 0,
      withdrawUsd = 0,
      withdrawCny = 0,
      convertUsd = 0,
      forced = false,
      saleFailed = false,
      shortfall = 0;
    const billUs: Record<PersonId, number> = { A: 0, B: 0 },
      billCn: Record<PersonId, number> = { A: 0, B: 0 };
    const usdForCny = market.fx[t] * (1 - s.market.fx_spread),
      cnyForUsd = market.fx[t] * (1 + s.market.fx_spread);
    const depositUsd = (amount: number, index = surplusIndex) =>
      depositAccount(s.accounts[index], accounts[index], amount);
    const availableUsd = () =>
      accounts.reduce(
        (n, a, i) =>
          n +
          (access(s.accounts[i], a, s, year)
            ? accountBalance(a) /
              (s.accounts[i].type === 'cash_cny' ? cnyForUsd : 1)
            : 0),
        cashUsd,
      );
    let fund: (
      usd: number,
      cny: number,
      allowSale?: boolean,
    ) => { usd: number; cny: number; shortUsd: number; shortCny: number };
    function trySale(i: number, isForced: boolean): boolean {
      const p = s.properties[i],
        state = properties[i];
      if (!state.held) return false;
      const quote = closingQuote(p, state);
      if (quote.contribution > availableUsd() + NUMERICAL_ZERO) {
        saleFailed = true;
        return false;
      }
      if (quote.contribution > 0) {
        const paid = fund(quote.contribution, 0, false);
        if (paid.shortUsd > NUMERICAL_ZERO)
          throw new SimulationError({
            code: 'CLOSING_BALANCE',
            message: 'Feasible closing funding did not reconcile',
            path_id: pathId,
            year,
          });
      }
      const record = executeSale(p, state, market.fx[t]);
      sales.push(...record);
      for (const id of ['A', 'B'] as const) {
        income[id].passive_released += state.owners[id].suspended_loss;
        state.owners[id].suspended_loss = 0;
      }
      if (quote.cash > 0)
        depositUsd(quote.cash, byName.get(p.proceeds_account)!);
      forced ||= isForced;
      return true;
    }
    fund = (requestedUsd, requestedCny, allowSale = true) => {
      let needUsd = Math.max(0, requestedUsd),
        needCny = Math.max(0, requestedCny);
      const useUsd = (amount: number) => {
        let use = Math.min(needUsd, amount);
        needUsd -= use;
        amount -= use;
        const conversion = Math.min(amount, needCny / usdForCny);
        needCny -= conversion * usdForCny;
        convertUsd += conversion;
        return use + conversion;
      };
      const cashUsed = useUsd(cashUsd);
      cashUsd = cleanResidual(cashUsd - cashUsed);
      const drawAccounts = () => {
        for (let i = 0; i < accounts.length; i++) {
          if (needUsd <= NUMERICAL_ZERO && needCny <= NUMERICAL_ZERO) break;
          const a = accounts[i],
            config = s.accounts[i];
          if (!access(config, a, s, year)) continue;
          if (config.type === 'cash_cny') {
            const direct = Math.min(needCny, accountBalance(a));
            if (direct > 0) {
              withdrawCny += withdrawAccount(
                config,
                a,
                direct,
                s,
                year,
                income,
              );
              needCny -= direct;
            }
            const converted = Math.min(needUsd, accountBalance(a) / cnyForUsd);
            if (converted > 0) {
              withdrawCny += withdrawAccount(
                config,
                a,
                converted * cnyForUsd,
                s,
                year,
                income,
              );
              needUsd -= converted;
            }
          } else {
            const amount = withdrawAccount(
              config,
              a,
              needUsd + needCny / usdForCny,
              s,
              year,
              income,
            );
            withdrawUsd += amount;
            useUsd(amount);
          }
        }
      };
      drawAccounts();
      if (
        allowSale &&
        s.withdrawals.last_resort_property_sale &&
        (needUsd > NUMERICAL_ZERO || needCny > NUMERICAL_ZERO)
      )
        for (let i = 0; i < properties.length; i++) {
          if (trySale(i, true)) drawAccounts();
          if (needUsd <= NUMERICAL_ZERO && needCny <= NUMERICAL_ZERO) break;
        }
      needUsd = Math.max(0, cleanResidual(needUsd));
      needCny = Math.max(0, cleanResidual(needCny));
      return {
        usd: requestedUsd - needUsd,
        cny: requestedCny - needCny,
        shortUsd: needUsd,
        shortCny: needCny,
      };
    };
    // 2. Whole-property strategies use opening values and actual feasible closing cash.
    for (let i = 0; i < properties.length; i++)
      if (properties[i].held) {
        const p = s.properties[i],
          liquid = valueWealth(market.fx[t]);
        const annualCny =
          s.people.domicile === 'US'
            ? s.budget.annual * market.usd_index[t] * market.fx[t]
            : s.budget.annual * market.home_index[t];
        const trigger =
          (p.strategy === 'sell_year' && year >= p.sell_year) ||
          (p.strategy === 'sell_when_liquid_below' &&
            liquid.usd * market.fx[t] + liquid.cny <
              p.sell_liquid_years * annualCny);
        if (trigger) trySale(i, false);
      }
    // 3. Rent and RMD cash; no need is deducted yet.
    let rent = 0,
      rmd = 0;
    for (let i = 0; i < properties.length; i++)
      if (properties[i].held) {
        const cash = propertyCash(
          s.properties[i],
          properties[i],
          t,
          market.usd_index[t],
          tables.us.depreciation_years,
          income,
        );
        rent += cash.cash_flow;
      }
    for (let i = 0; i < accounts.length; i++)
      if (s.accounts[i].type === 'pre_tax') {
        const owner = accounts[i].shares.A > 0 ? 'A' : 'B',
          age = year - s.people[owner]!.birth_year,
          amount = rmdAmount(
            accounts[i].prior_year_end_balance,
            age,
            s.people[owner]!.birth_year,
            tables,
          );
        const actual = withdrawAccount(
          s.accounts[i],
          accounts[i],
          amount,
          s,
          year,
          income,
        );
        rmd += actual;
        withdrawUsd += actual;
      }
    cashUsd = rent + rmd;
    const propertyCashNeed = Math.max(0, -cashUsd);
    cashUsd = Math.max(0, cashUsd);
    // 4. Requested consumption and separately reported budget scope.
    const cost = consumption(s, t, market, draws, pathId);
    if (t === 0) {
      const usd = s.people.domicile === 'US';
      summary.floats[FI.initial_included_recurring_cny] =
        cost.included * (usd ? market.fx[0] : 1);
      summary.floats[FI.initial_health_cny] =
        cost.health * (usd ? market.fx[0] : 1);
    }
    // 5. Fund living needs; any tax shortfall below adds to the same funding check.
    const funded = fund(cost.usd_total + propertyCashNeed, cost.cny_total);
    shortfall += funded.shortUsd * market.fx[t] + funded.shortCny;
    shortfall = cleanResidual(shortfall);
    if (shortfall > 0 && firstDepletion < 0) firstDepletion = t;
    if (cashUsd > NUMERICAL_ZERO) {
      depositUsd(cashUsd);
      cashUsd = 0;
    }
    // 6. Grow only the remaining investments and retained properties.
    let invested = 0,
      growth = 0,
      reportInvested = 0,
      reportGrowth = 0;
    for (let i = 0; i < accounts.length; i++) {
      const cnyCash = s.accounts[i].type === 'cash_cny',
        cnyOpening = trace && cnyCash ? accountBalance(accounts[i]) : 0;
      const r = growAccount(s.accounts[i], accounts[i], s, t, market, income);
      invested += r.opening;
      growth += r.growth;
      if (trace) {
        reportInvested += cnyCash ? cnyOpening / market.fx[t] : r.opening;
        reportGrowth += cnyCash ? 0 : r.growth;
      }
    }
    priorReturn = invested > 0 ? growth / invested : NaN;
    if (Number.isFinite(priorReturn)) {
      growthFactor *= 1 + priorReturn;
      returnYears++;
    }
    for (let i = 0; i < properties.length; i++)
      if (properties[i].held)
        growProperty(
          s.properties[i],
          properties[i],
          t,
          market,
          pathId,
          s.simulation.start_year,
        );
    // 7. Taxable rebalancing is a real sale journal.
    for (let i = 0; i < accounts.length; i++)
      rebalance(s.accounts[i], accounts[i], income);
    classifyPropertySales(sales, income);
    // 8-9. Compute current-year taxes and pay them the same year. Paying can itself
    // create taxable withdrawals, so iterate to a fixpoint (bounded passes, $1 stop).
    {
      const paidUs: Record<PersonId, number> = { A: 0, B: 0 },
        paidCn: Record<PersonId, number> = { A: 0, B: 0 };
      const priorUs = unpaidUsd,
        priorCn = unpaidCny;
      unpaidUsd = 0;
      unpaidCny = 0;
      const payUsd = (amount: number) => {
        if (amount <= NUMERICAL_ZERO) return 0;
        const paid = fund(amount, 0);
        shortfall += paid.shortUsd * market.fx[t];
        const real = (paid.usd * market.fx[t]) / market.home_index[t];
        incomeTaxCashReal += real;
        incomeTaxCashUsdReal += paid.usd / market.usd_index[t];
        return paid.usd;
      };
      const payCny = (amount: number) => {
        if (amount <= NUMERICAL_ZERO) return 0;
        const paid = fund(0, amount);
        shortfall += paid.shortCny;
        incomeTaxCashReal += paid.cny / market.home_index[t];
        incomeTaxCashUsdReal += paid.cny / market.fx[t] / market.usd_index[t];
        return paid.cny;
      };
      unpaidUsd = Math.max(0, priorUs - payUsd(priorUs));
      unpaidCny = Math.max(0, priorCn - payCny(priorCn));
      for (let pass = 0; pass < 10; pass++) {
        let billed = 0;
        for (const id of members) {
          const us = calculateUS(
            s,
            id,
            year,
            market.usd_index[t],
            s.people.B !== undefined,
            income[id],
            capitalLoss[id],
            suspended(id),
            tables,
          );
          billUs[id] = us.federal;
          const deltaUs = Math.max(0, us.federal - paidUs[id]);
          billed += deltaUs;
          paidUs[id] += payUsd(deltaUs);
          if (chinaApplies(s, id, t)) {
            const raw = chinaTax(
              {
                dividends: income[id].dividends * market.fx[t],
                interest: income[id].interest_us * market.fx[t],
                gross_rent: income[id].rent_gross * market.fx[t],
                securities_gain: income[id].cap_gain * market.fx[t],
                property_gain_cny: income[id].property_gain_cny,
              },
              tables,
            );
            const eligiblePaid =
                paidUs[id] *
                (us.federal > 0 ? us.eligible_federal / us.federal : 0),
              due = applyCredit(
                raw.before_credit,
                eligiblePaid * market.fx[t],
              ).due;
            billCn[id] = due;
            taxDetail[`${id}_china`] = raw;
            const deltaCn = Math.max(0, due - paidCn[id]);
            billed += deltaCn / market.fx[t];
            paidCn[id] += payCny(deltaCn);
          }
        }
        if (billed < 1) break;
      }
      for (const id of members) {
        const us = calculateUS(
          s,
          id,
          year,
          market.usd_index[t],
          s.people.B !== undefined,
          income[id],
          capitalLoss[id],
          suspended(id),
          tables,
        );
        capitalLoss[id] = us.carry;
        updatePassive(id, us.suspended);
        taxDetail[id] = us.detail;
        billUs[id] = us.federal;
        if (chinaApplies(s, id, t)) {
          const raw = chinaTax(
            {
              dividends: income[id].dividends * market.fx[t],
              interest: income[id].interest_us * market.fx[t],
              gross_rent: income[id].rent_gross * market.fx[t],
              securities_gain: income[id].cap_gain * market.fx[t],
              property_gain_cny: income[id].property_gain_cny,
            },
            tables,
          );
          billCn[id] = applyCredit(
            raw.before_credit,
            paidUs[id] *
              (us.federal > 0 ? us.eligible_federal / us.federal : 0) *
              market.fx[t],
          ).due;
          taxDetail[`${id}_china`] = raw;
        }
      }
      for (const id of members) {
        unpaidUsd += Math.max(0, billUs[id] - paidUs[id]);
        unpaidCny += Math.max(0, billCn[id] - paidCn[id]);
      }
      shortfall = cleanResidual(shortfall);
    }
    // 10. End-year balances/indices; leftover unpaid tax is a terminal memo value.
    const wealth = valueWealth(market.fx[t + 1]),
      atMaxAge = t === T - 1,
      exhausted = cleanResidual(wealth.net) <= 0,
      last = atMaxAge || exhausted;
    // A fully funded final age-limit year remains a funding success, even if it spends the last dollar.
    if (exhausted && !atMaxAge && firstDepletion < 0) firstDepletion = t;
    const nominalReal = wealth.net / market.home_index[t + 1],
      liquidReal =
        (wealth.usd * market.fx[t + 1] + wealth.cny) / market.home_index[t + 1],
      usdReal =
        (wealth.usd + wealth.cny / market.fx[t + 1] + wealth.equity) /
        market.usd_index[t + 1];
    if (year - s.people.A.birth_year === 85) {
      at85Cny = nominalReal;
      at85Usd = usdReal;
    }
    const quota =
      convertUsd > s.market.fx_quota_usd_per_person * (s.people.B ? 2 : 1);
    if (quota) quotaYears++;
    if (forced) summary.flags[BI.forced_sale] = 1;
    if (saleFailed) summary.flags[BI.sale_failed] = 1;
    if (last)
      finish(t, wealth, atMaxAge ? 'max_age' : 'net_assets_nonpositive');
    const h2cny = s.people.domicile === 'US' ? market.fx[t] : 1;
    const row: Record<string, number> = {
      year,
      age_A: year - s.people.A.birth_year,
      age_B: s.people.B ? year - s.people.B.birth_year : -1,
      alive_A: 1,
      alive_B: s.people.B ? 1 : 0,
      fx: market.fx[t + 1],
      home_index: market.home_index[t + 1],
      usd_index: market.usd_index[t + 1],
      spend_plan_cny: cost.plan * h2cny,
      spend_cny: cost.spend * h2cny,
      medical_cny: cost.medical * h2cny,
      medical_base_cny: cost.medical_base * h2cny,
      medical_shock_cny: cost.medical_shock * h2cny,
      one_time_cny: cost.one_time_cny + cost.one_time_usd * market.fx[t],
      included_consumption_cny: cost.included * h2cny,
      additional_consumption_cny: cost.additional * h2cny,
      rent_cash_usd: rent,
      rmd_usd: rmd,
      portfolio_return: priorReturn,
      withdraw_usd: withdrawUsd,
      withdraw_cny: withdrawCny,
      convert_usd: convertUsd,
      tax_us_A: billUs.A,
      tax_us_B: s.people.B ? billUs.B : 0,
      tax_cn_A: billCn.A,
      tax_cn_B: s.people.B ? billCn.B : 0,
      liquid_usd: wealth.usd,
      cny_cash_cny: wealth.cny,
      property_equity_usd: wealth.equity,
      net_worth_cny: wealth.net,
      net_worth_cny_real: nominalReal,
      liquid_cny_real: liquidReal,
      net_worth_usd_real: usdReal,
      shortfall_cny: shortfall,
      forced_sale: Number(forced),
      sale_failed: Number(saleFailed),
      fx_quota_flag: Number(quota),
    };
    for (let f = 0; f < LEDGER_FIELDS.length; f++) {
      const value = row[LEDGER_FIELDS[f]];
      if (!Number.isFinite(value) && LEDGER_FIELDS[f] !== 'portfolio_return')
        throw new SimulationError({
          code: 'NONFINITE_MODEL',
          message: `Nonfinite ${LEDGER_FIELDS[f]}`,
          path_id: pathId,
          year,
        });
      ledger[t * LEDGER_FIELDS.length + f] = value;
    }
    for (let f = 0; f < CHART_FIELDS.length; f++)
      charts[t * CHART_FIELDS.length + f] = row[CHART_FIELDS[f]];
    accounts.forEach((a) => (a.prior_year_end_balance = accountBalance(a)));
    if (trace)
      years.push({
        year,
        report: {
          starting_liquid_usd: openingWealth!.usd,
          starting_net_worth_cny: openingWealth!.net,
          spend_excluding_medical_cny: cost.spend_excluding_medical * h2cny,
          medical_total_cny: cost.medical_total * h2cny,
          annual_investment_return:
            reportInvested > 0 ? reportGrowth / reportInvested : null,
        },
        medical_detail: {
          base_cny: cost.medical_base * h2cny,
          shock_cny: cost.medical_shock * h2cny,
          late_life_care_cny: cost.late_life_care * h2cny,
        },
        phases: YEAR_PHASES,
        income: structuredClone(income),
        accounts: structuredClone(accounts),
        properties: structuredClone(properties),
        sales: structuredClone(sales),
        terminal: terminal ? structuredClone(terminal) : undefined,
        tax_detail: structuredClone(taxDetail),
        capital_loss_carryforward: { ...capitalLoss },
      });
    if (last) break;
  }
  if (!terminal || !stop)
    throw new SimulationError({
      code: 'HORIZON',
      message:
        'The configured planning horizon did not produce an ending summary',
      path_id: pathId,
    });
  return {
    ledger,
    market,
    years,
    stop,
    charts,
    summary,
    market_samples: {
      fx: market.fx,
      home_cpi: market.home_cpi,
      usd_cpi: market.us_cpi,
    },
  };
}
export function simulatePath(
  request: RunRequest,
  refs: PublicReferenceBundle,
  pathId: number,
): CompactPathResult {
  const r = runPath(request, refs, pathId, false);
  return {
    path_id: pathId,
    charts: r.charts,
    summary: r.summary,
    market_samples: r.market_samples,
  };
}
export function replayPathLedger(
  request: RunRequest,
  refs: PublicReferenceBundle,
  pathId: number,
  controlledMarket?: import('./types').MarketPath,
): DetailedReplay {
  const r = runPath(request, refs, pathId, true, controlledMarket);
  return {
    path_id: pathId,
    ledger: r.ledger,
    market: r.market,
    years: r.years,
    stop: r.stop,
  };
}
