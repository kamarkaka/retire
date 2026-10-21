import type {
  AccountConfig,
  AccountState,
  ScenarioConfig,
  PersonId,
  IncomeLedger,
  MarketPath,
  AssetClass,
  TaxTables,
} from './types';
import { cleanResidual } from './errors';
export const ASSETS: AssetClass[] = ['us_stocks', 'us_bonds', 'usd_cash'];
export const INCOME_FIELDS =
  `interest_us dividends qualified_dividends nra_dividends nra_exempt_interest cap_gain trad_own trad_inherited roth early_trad rental_net rent_gross ordinary_property_gain ltcg_property property_gain_cny passive_released`.split(
    ' ',
  ) as (keyof IncomeLedger)[];
export function emptyIncome(): IncomeLedger {
  return Object.fromEntries(INCOME_FIELDS.map((k) => [k, 0])) as IncomeLedger;
}
export function initialAccount(config: AccountConfig): AccountState {
  const shares =
    config.owner === 'joint'
      ? { A: config.share_A, B: 1 - config.share_A }
      : { A: config.owner === 'A' ? 1 : 0, B: config.owner === 'B' ? 1 : 0 };
  return {
    name: config.name,
    original_owner: config.owner,
    shares,
    values:
      config.type === 'cash_cny' || config.type === 'cash_usd'
        ? { deposit: config.balance }
        : Object.fromEntries(
            ASSETS.map((k) => [
              k,
              config.balance * (config.allocation[k] ?? 0),
            ]),
          ),
    bases:
      config.type === 'brokerage'
        ? Object.fromEntries(
            ASSETS.map((k) => [
              k,
              config.balance * (config.allocation[k] ?? 0),
            ]),
          )
        : {},
    prior_year_end_balance: config.balance,
  };
}
export function accountBalance(a: AccountState) {
  return Object.values(a.values).reduce((n, v) => n + (v ?? 0), 0);
}
export function attribute(
  income: Record<PersonId, IncomeLedger>,
  shares: Record<PersonId, number>,
  key: keyof IncomeLedger,
  amount: number,
) {
  for (const id of ['A', 'B'] as const) income[id][key] += amount * shares[id];
}
export function access(
  config: AccountConfig,
  state: AccountState,
  s: ScenarioConfig,
  year: number,
) {
  if (
    config.type === 'brokerage' ||
    config.type === 'cash_cny' ||
    config.type === 'cash_usd'
  )
    return true;
  const owner = state.shares.A > 0 ? 'A' : 'B',
    age = year - s.people[owner]!.birth_year;
  return (
    age >= 60 ||
    (config.type === 'pre_tax' &&
      ((config.rule_of_55 && age >= 55) || config.allow_early_trad))
  );
}
export function sellAsset(
  state: AccountState,
  key: AssetClass,
  amount: number,
  taxable: boolean,
) {
  const value = state.values[key] ?? 0,
    sold = Math.min(Math.max(0, amount), value);
  if (value === 0) return 0;
  const basis = ((state.bases[key] ?? 0) * sold) / value;
  state.values[key] = cleanResidual(value - sold);
  if (taxable)
    state.bases[key] = cleanResidual((state.bases[key] ?? 0) - basis);
  return taxable && key !== 'us_bonds' ? sold - basis : 0; // Bonds are held to maturity: coupon only, zero-gain sales.
}
export function withdrawAccount(
  config: AccountConfig,
  state: AccountState,
  requested: number,
  s: ScenarioConfig,
  year: number,
  income: Record<PersonId, IncomeLedger>,
) {
  const balance = accountBalance(state),
    amount = Math.min(Math.max(requested, 0), balance);
  if (!amount || !balance) return 0;
  if (config.type === 'cash_cny' || config.type === 'cash_usd') {
    state.values.deposit = cleanResidual(balance - amount);
    return amount;
  }
  let gain = 0;
  for (const key of ASSETS)
    gain += sellAsset(
      state,
      key,
      (amount * (state.values[key] ?? 0)) / balance,
      config.type === 'brokerage',
    );
  if (config.type === 'brokerage')
    attribute(income, state.shares, 'cap_gain', gain);
  else {
    attribute(
      income,
      state.shares,
      config.type === 'after_tax' ? 'roth' : 'trad_own',
      amount,
    );
    const owner = state.shares.A > 0 ? 'A' : 'B',
      age = year - s.people[owner]!.birth_year;
    if (
      config.type === 'pre_tax' &&
      age < 60 &&
      !(config.rule_of_55 && age >= 55)
    )
      attribute(income, state.shares, 'early_trad', amount);
  }
  return amount;
}
export function depositAccount(
  config: AccountConfig,
  state: AccountState,
  amount: number,
) {
  if (config.type === 'cash_cny' || config.type === 'cash_usd') {
    state.values.deposit = (state.values.deposit ?? 0) + amount;
    return;
  }
  for (const key of ASSETS) {
    const part = amount * (config.allocation[key] ?? 0);
    state.values[key] = (state.values[key] ?? 0) + part;
    if (config.type === 'brokerage')
      state.bases[key] = (state.bases[key] ?? 0) + part;
  }
}
export function growAccount(
  config: AccountConfig,
  state: AccountState,
  s: ScenarioConfig,
  t: number,
  market: MarketPath,
  income: Record<PersonId, IncomeLedger>,
) {
  // CNY cash interest is intentionally omitted; it may be restored in a future model.
  if (config.type === 'cash_cny') return { opening: 0, growth: 0 };
  if (config.type === 'cash_usd') {
    const balance = state.values.deposit ?? 0,
      rate = config.interest_rate ?? market.usd_cash[t],
      interest = balance * rate;
    state.values.deposit = balance + interest;
    attribute(income, state.shares, 'interest_us', interest);
    attribute(income, state.shares, 'nra_exempt_interest', interest);
    return { opening: balance, growth: interest };
  }
  let opening = 0,
    growth = 0;
  for (const key of ASSETS) {
    const value = state.values[key] ?? 0,
      returnValue = market[key][t];
    opening += value;
    growth += value * returnValue;
    state.values[key] = value * (1 + returnValue);
    if (config.type !== 'brokerage' || value === 0) continue;
    const yieldRate =
        key === 'usd_cash'
          ? returnValue
          : key === 'us_stocks'
            ? s.market.income_yield_us_stocks
            : s.market.income_yield_us_bonds,
      earnings = value * yieldRate;
    state.bases[key] = (state.bases[key] ?? 0) + earnings;
    if (key === 'us_stocks') {
      attribute(income, state.shares, 'qualified_dividends', earnings);
      attribute(income, state.shares, 'dividends', earnings);
      attribute(income, state.shares, 'nra_dividends', earnings);
    } else {
      attribute(income, state.shares, 'interest_us', earnings);
      attribute(income, state.shares, 'nra_exempt_interest', earnings);
    }
  }
  return { opening, growth };
}
export function rebalance(
  config: AccountConfig,
  state: AccountState,
  income: Record<PersonId, IncomeLedger>,
) {
  if (config.type === 'cash_cny' || config.type === 'cash_usd') return 0;
  const total = accountBalance(state);
  let cash = 0,
    gain = 0;
  for (const key of ASSETS) {
    const sell = Math.max(
      0,
      (state.values[key] ?? 0) - total * (config.allocation[key] ?? 0),
    );
    gain += sellAsset(state, key, sell, config.type === 'brokerage');
    cash += sell;
  }
  for (const key of ASSETS) {
    const buy = Math.max(
      0,
      total * (config.allocation[key] ?? 0) - (state.values[key] ?? 0),
    );
    state.values[key] = (state.values[key] ?? 0) + buy;
    if (config.type === 'brokerage')
      state.bases[key] = (state.bases[key] ?? 0) + buy;
    cash -= buy;
  }
  if (config.type === 'brokerage')
    attribute(income, state.shares, 'cap_gain', gain);
  return gain;
}
export function conversion(
  cnyNeed: number,
  usdNeed: number,
  fx: number,
  spread: number,
) {
  return {
    usd_to_fund_cny: cnyNeed / (fx * (1 - spread)),
    cny_to_fund_usd: usdNeed * fx * (1 + spread),
  };
}
export function rmdAmount(
  balance: number,
  age: number,
  birthYear: number,
  tables: TaxTables,
) {
  const start =
    birthYear < 1960
      ? tables.us.rmd_start_age.before_1960
      : tables.us.rmd_start_age.from_1960;
  return age < start
    ? 0
    : balance /
        tables.us.uniform_lifetime[String(Math.min(120, Math.max(72, age)))];
}
