import type { ScenarioConfig, PublicReferenceBundle } from './types';
export function scenarioSummary(
  s: ScenarioConfig,
  refs: PublicReferenceBundle,
) {
  const financialUsd = s.accounts.reduce((n, a) => n + a.balance, 0),
    propertyEquity = s.properties.reduce(
      (n, p) => n + p.value - p.mortgage_balance,
      0,
    );
  const rows = refs.history.filter(
    (r) => r.year >= s.market.sample_start && r.year <= s.market.sample_end,
  );
  const usMean =
    rows.reduce((n, r) => n + r.us_cpi, 0) / Math.max(1, rows.length);
  const base = s.people.domicile === 'US' ? usMean : s.market.home_cpi_mean;
  return {
    financial_usd: financialUsd,
    property_equity_usd: propertyEquity,
    budget: s.budget.annual,
    health: s.budget.included_health,
    currency: (s.people.domicile === 'US' ? 'USD' : 'CNY') as 'USD' | 'CNY',
    start_ages: {
      A: s.simulation.start_year - s.people.A.birth_year,
      B: s.people.B ? s.simulation.start_year - s.people.B.birth_year : -1,
    },
    medical_factor:
      (1 + base + s.market.medical_excess_inflation) *
      (1 + s.medical.age_growth),
    real_medical_factor:
      ((1 + base + s.market.medical_excess_inflation) *
        (1 + s.medical.age_growth)) /
      (1 + base),
  };
}
