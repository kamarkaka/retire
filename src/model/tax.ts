import type {
  TaxTables,
  FilingStatus,
  CapitalNet,
  IncomeLedger,
  ScenarioConfig,
  PersonId,
} from './types';

export function progressive(
  income: number,
  starts: readonly number[],
  rates: readonly number[],
): number {
  let tax = 0;
  for (let i = 0; i < starts.length; i++)
    tax +=
      Math.max(0, Math.min(income, starts[i + 1] ?? Infinity) - starts[i]) *
      rates[i];
  return tax;
}
export function capitalNet(
  securities: number,
  propertyLT: number,
  priorLoss: number,
  limit: number,
): CapitalNet {
  const net = securities + propertyLT - priorLoss;
  if (net <= 0) {
    const deduction = Math.min(-net, limit);
    return {
      lt_gain: 0,
      ordinary_loss_deduction: deduction,
      loss_carryforward: -net - deduction,
    };
  }
  return { lt_gain: net, ordinary_loss_deduction: 0, loss_carryforward: 0 };
}
export interface ResidentTaxInput {
  filing_status: FilingStatus;
  price_index: number;
  ordinary: number;
  qd: number;
  securities_lt: number;
  property_lt: number;
  prior_capital_loss: number;
  nii: number;
  early_trad?: number;
}
export function gainsTax(
  TI: number,
  QD: number,
  LT: number,
  status: FilingStatus,
  index: number,
  tables: TaxTables,
) {
  const us = tables.us,
    brackets = us.brackets[status].map((v) => v * index),
    regular = (n: number) => progressive(n, brackets, us.rates);
  const base = TI - Math.min(TI, QD + LT);
  const starts = [
    0,
    us.ltcg_0_top[status] * index,
    us.ltcg_15_top[status] * index,
  ];
  let preferred = 0;
  for (let i = 0; i < 3; i++)
    preferred +=
      Math.max(
        0,
        Math.min(TI, starts[i + 1] ?? Infinity) - Math.max(base, starts[i]),
      ) * us.ltcg_rates[i];
  return {
    income_tax: Math.min(regular(TI), regular(base) + preferred),
    regular_tax: regular(TI),
    A_amt: base,
    preferential_tax: preferred,
  };
}
export function residentTax(input: ResidentTaxInput, tables: TaxTables) {
  const us = tables.us,
    status = input.filing_status,
    index = input.price_index;
  const capital = capitalNet(
    input.securities_lt,
    input.property_lt,
    input.prior_capital_loss,
    us.cap_loss_limit[status],
  );
  const agi =
    input.ordinary -
    capital.ordinary_loss_deduction +
    input.qd +
    capital.lt_gain;
  const deduction = us.std_deduction[status] * index,
    TI = Math.max(0, agi - deduction);
  const niit =
      us.niit_rate *
      Math.min(
        Math.max(0, input.nii),
        Math.max(0, agi - us.niit_threshold[status]),
      ),
    penalty = (input.early_trad ?? 0) * us.early_penalty;
  return {
    ...capital,
    net_total:
      input.securities_lt + input.property_lt - input.prior_capital_loss,
    loss_deduction: capital.ordinary_loss_deduction,
    carry: capital.loss_carryforward,
    agi,
    deduction,
    ti: TI,
    ...gainsTax(TI, input.qd, capital.lt_gain, status, index, tables),
    niit,
    penalty,
  };
}
export function rentalTreatment(
  net: number,
  suspended: number,
  magI: number,
  status: FilingStatus,
  tables: TaxTables,
) {
  if (net >= 0) {
    const used = Math.min(net, suspended);
    return { allowed: net - used, suspended: suspended - used };
  }
  const allowance =
    status === 'mfs'
      ? 0
      : Math.max(
          0,
          tables.us.passive_allowance -
            0.5 * Math.max(0, magI - tables.us.passive_phaseout[0]),
        );
  const allowed = Math.min(-net, allowance);
  return { allowed: -allowed, suspended: suspended + (-net - allowed) };
}
export function nonresidentTax(
  i: {
    rental_net: number;
    ordinary_property_gain?: number;
    property_lt?: number;
    prior_capital_loss?: number;
    dividends: number;
    own_pension?: number;
    inherited_pension?: number;
    cap_gains?: number;
    early_trad?: number;
    filing_status?: FilingStatus;
    price_index?: number;
  },
  tables: TaxTables,
  inheritedRate = 0.3,
) {
  const status = i.filing_status ?? 'mfs',
    cap = capitalNet(
      0,
      i.property_lt ?? 0,
      i.prior_capital_loss ?? 0,
      tables.us.cap_loss_limit[status],
    );
  const TI = Math.max(
    0,
    i.rental_net +
      (i.ordinary_property_gain ?? 0) -
      cap.ordinary_loss_deduction +
      cap.lt_gain,
  );
  const rental = gainsTax(
      TI,
      0,
      cap.lt_gain,
      status,
      i.price_index ?? 1,
      tables,
    ).income_tax,
    dividends = i.dividends * tables.us.nra.dividends;
  const pension =
      (i.own_pension ?? 0) * tables.us.nra.own_pension +
      (i.inherited_pension ?? 0) * inheritedRate,
    security = (i.cap_gains ?? 0) * tables.us.nra.cap_gains,
    penalty = (i.early_trad ?? 0) * tables.us.early_penalty;
  return {
    rental_tax: rental,
    dividend_tax: dividends,
    pension_tax: pension,
    security_tax: security,
    income_tax: rental + dividends + pension + security,
    total: rental + dividends + pension + security + penalty,
    penalty,
    ...cap,
    carry: cap.loss_carryforward,
  };
}
export function chinaTax(
  i: {
    dividends: number;
    interest?: number;
    gross_rent: number;
    securities_gain?: number;
    property_gain_cny?: number;
  },
  tables: TaxTables,
) {
  const cn = tables.cn,
    dividend = i.dividends * cn.flat_rate,
    interest = (i.interest ?? 0) * cn.flat_rate,
    rent = i.gross_rent * (1 - cn.rent_deduction) * cn.flat_rate;
  const pension = 0; // China does not tax retirement distributions in this model.
  const securities = Math.max(0, i.securities_gain ?? 0) * cn.flat_rate,
    property = Math.max(0, i.property_gain_cny ?? 0) * cn.flat_rate;
  return {
    dividend_tax: dividend,
    interest_tax: interest,
    rent_tax: rent,
    pension_tax: pension,
    securities_tax: securities,
    property_tax: property,
    before_credit: dividend + interest + rent + pension + securities + property,
  };
}
export function chinaApplies(s: ScenarioConfig, id: PersonId, t: number) {
  return s.people.domicile === 'China';
}
export function applyCredit(preCredit: number, eligiblePaid: number) {
  const credit = Math.min(preCredit, Math.max(0, eligiblePaid));
  return { credit, due: preCredit - credit };
}
export function calculateUS(
  s: ScenarioConfig,
  id: PersonId,
  year: number,
  index: number,
  spouseAlive: boolean,
  income: IncomeLedger,
  priorLoss: number,
  suspended: number,
  tables: TaxTables,
) {
  const p = s.people[id]!,
    status = spouseAlive ? 'mfs' : 'single';
  const capital = capitalNet(
    p.us_income_tax_status === 'resident' ? income.cap_gain : 0,
    income.ltcg_property,
    priorLoss,
    tables.us.cap_loss_limit[status],
  );
  const roughAGI =
    income.interest_us +
    income.trad_own +
    income.trad_inherited +
    income.pension +
    income.qualified_dividends +
    capital.lt_gain;
  const rental = rentalTreatment(
    income.rental_net,
    suspended,
    roughAGI,
    status,
    tables,
  );
  const ordinary =
    income.interest_us +
    income.trad_own +
    income.trad_inherited +
    income.pension +
    rental.allowed +
    income.ordinary_property_gain -
    income.passive_released;
  const nii = Math.max(
    0,
    income.interest_us +
      income.dividends +
      capital.lt_gain +
      income.ordinary_property_gain +
      rental.allowed -
      income.passive_released -
      capital.ordinary_loss_deduction,
  );
  if (p.us_income_tax_status === 'resident') {
    const i: ResidentTaxInput = {
      filing_status: status,
      price_index: index,
      ordinary,
      qd: income.qualified_dividends,
      securities_lt: income.cap_gain,
      property_lt: income.ltcg_property,
      prior_capital_loss: priorLoss,
      nii,
      early_trad: income.early_trad,
    };
    const result = residentTax(i, tables);
    const pensionExcluded =
      income.trad_own + income.trad_inherited + income.pension;
    const eligible = Math.min(
      result.income_tax,
      residentTax(
        { ...i, ordinary: ordinary - pensionExcluded, early_trad: 0 },
        tables,
      ).income_tax,
    );
    return {
      federal: result.income_tax + result.niit + result.penalty,
      eligible_federal: eligible,
      carry: result.carry,
      suspended: rental.suspended,
      detail: result,
    };
  }
  const result = nonresidentTax(
    {
      filing_status: status,
      price_index: index,
      rental_net: rental.allowed - income.passive_released,
      ordinary_property_gain: income.ordinary_property_gain,
      property_lt: income.ltcg_property,
      prior_capital_loss: priorLoss,
      dividends: income.nra_dividends,
      own_pension: income.trad_own + income.pension,
      inherited_pension: income.trad_inherited,
      cap_gains: Math.max(0, income.cap_gain),
      early_trad: income.early_trad,
    },
    tables,
  );
  const eligible = Math.max(0, result.income_tax - result.pension_tax);
  return {
    federal: result.total,
    eligible_federal: eligible,
    carry: result.carry,
    suspended: rental.suspended,
    detail: result,
  };
}
