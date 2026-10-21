import type {
  PropertyConfig,
  PropertyState,
  PersonId,
  IncomeLedger,
  MarketPath,
} from './types';
import { requireFactor, cleanResidual, SimulationError } from './errors';
export function mortgagePayment(balance: number, rate: number, years: number) {
  return balance === 0
    ? 0
    : rate === 0
      ? balance / years
      : (balance * rate) / (1 - (1 + rate) ** -years);
}
export function initialProperty(p: PropertyConfig): PropertyState {
  const owner = (share: number) => ({
    share,
    basis_usd: p.cost_basis * share,
    depreciation_taken: p.depreciation_taken * share,
    suspended_loss: 0,
  });
  return {
    id: p.id,
    held: true,
    value: p.value,
    mortgage_balance: p.mortgage_balance,
    mortgage_payment: mortgagePayment(
      p.mortgage_balance,
      p.mortgage_rate,
      p.mortgage_years_left,
    ),
    property_tax_annual: p.property_tax_annual,
    owners: { A: owner(p.share_A), B: owner(1 - p.share_A) },
  };
}
export function propertyCash(
  p: PropertyConfig,
  state: PropertyState,
  t: number,
  usIndex: number,
  depreciationYears: number,
  income: Record<PersonId, IncomeLedger>,
) {
  const gross = 12 * p.rent_monthly * usIndex * (1 + p.rent_real_growth) ** t,
    maintenance = p.maintenance_annual * usIndex;
  const expenses =
    maintenance +
    state.property_tax_annual +
    p.insurance_annual * usIndex +
    12 * p.hoa_monthly * usIndex;
  const interest = p.mortgage_rate * state.mortgage_balance,
    payment = Math.min(
      state.mortgage_payment,
      state.mortgage_balance + interest,
    ),
    principal = Math.max(0, payment - interest);
  state.mortgage_balance = cleanResidual(state.mortgage_balance - principal);
  let depreciation = 0,
    scheduleE = 0;
  const ownerNet = { A: 0, B: 0 };
  for (const id of ['A', 'B'] as const) {
    const owner = state.owners[id],
      building = owner.basis_usd * (1 - p.land_share),
      dep = Math.min(
        building / depreciationYears,
        Math.max(0, building - owner.depreciation_taken),
      );
    owner.depreciation_taken += dep;
    depreciation += dep;
    const net = (gross - expenses - interest) * owner.share - dep;
    income[id].rental_net += net;
    income[id].rent_gross += gross * owner.share;
    ownerNet[id] = net;
    scheduleE += net;
  }
  return {
    gross_rent: gross,
    maintenance,
    cash_flow: gross - expenses - payment,
    annual_depreciation: depreciation,
    schedule_e_net: scheduleE,
    owner_net: ownerNet,
    interest,
    principal,
    payment,
  };
}
export interface SaleRecord {
  person: PersonId;
  gain: number;
  depreciation: number;
  net_price: number;
  gain_cny: number;
  property_id: string;
}
export function closingQuote(p: PropertyConfig, state: PropertyState) {
  const costs = state.value * p.selling_cost,
    cash = state.value - costs - state.mortgage_balance;
  return { costs, cash, contribution: Math.max(0, -cash) };
}
export function executeSale(
  p: PropertyConfig,
  state: PropertyState,
  fx: number,
): SaleRecord[] {
  const quote = closingQuote(p, state),
    netPrice = state.value - quote.costs;
  const records = (['A', 'B'] as const)
    .filter((id) => state.owners[id].share > 0)
    .map((id) => {
      const o = state.owners[id],
        gain = netPrice * o.share - (o.basis_usd - o.depreciation_taken);
      return {
        person: id,
        gain,
        depreciation: o.depreciation_taken,
        net_price: netPrice * o.share,
        gain_cny: gain * fx,
        property_id: p.id,
      };
    });
  state.held = false;
  state.mortgage_balance = 0;
  return records;
}
export function classifyPropertySales(
  records: SaleRecord[],
  income: Record<PersonId, IncomeLedger>,
) {
  for (const id of ['A', 'B'] as const) {
    const own = records.filter((r) => r.person === id);
    if (!own.length) continue;
    const net = own.reduce((n, r) => n + r.gain, 0);
    if (net <= 0) income[id].ordinary_property_gain += net;
    else income[id].ltcg_property += net;
    income[id].property_gain_cny += own.reduce((n, r) => n + r.gain_cny, 0);
  }
}
export function growProperty(
  p: PropertyConfig,
  state: PropertyState,
  t: number,
  market: MarketPath,
  pathId: number,
  startYear: number,
) {
  const factor = 1 + market.us_home[t];
  requireFactor(factor, true, {
    series: `property ${p.id}`,
    path_id: pathId,
    year: startYear + t,
  });
  state.value *= factor;
  state.property_tax_annual *= factor;
  requireFactor(state.value, false, {
    series: `property ${p.id} value`,
    path_id: pathId,
    year: startYear + t,
  });
  return factor - 1;
}
