import type {
  ScenarioConfig,
  MarketPath,
  PathDraws,
  ModelError,
} from './types';
import { requireFactor } from './errors';
export function medicalBaseCost(
  base: number,
  elapsedYears: number,
  medicalIndex: number,
  config: ScenarioConfig['medical'],
  context: Partial<ModelError> = {},
) {
  const recurring =
    base * (1 + config.age_growth) ** elapsedYears * medicalIndex;
  requireFactor(recurring, false, { ...context, series: 'medical base' });
  return recurring;
}
export function medicalCost(
  base: number,
  age: number,
  startAge: number,
  medicalIndex: number,
  config: ScenarioConfig['medical'],
  u: number,
  context: Partial<ModelError> = {},
) {
  const recurring = medicalBaseCost(
    base,
    age - startAge,
    medicalIndex,
    config,
    context,
  );
  const probability = Math.min(
    1,
    config.shock_prob_at_60 *
      2 ** ((age - 60) / config.shock_prob_doubling_years),
  );
  const shock =
    config.shock_enabled && u < probability
      ? config.shock_median * medicalIndex
      : 0;
  requireFactor(shock, false, { ...context, series: 'medical shock' });
  return { recurring, shock };
}
export function lateLifeCareCost(
  config: ScenarioConfig['medical']['late_life_care'],
  age: number,
  medicalIndex: number,
  t: number,
  context: Partial<ModelError> = {},
) {
  if (!config.enabled || age < config.start_age) return 0;
  const amount =
    config.monthly * 12 * medicalIndex * (1 + config.real_growth) ** t;
  requireFactor(amount, false, { ...context, series: 'late-life care' });
  return amount;
}
// Budget and medical amounts are in household currency (USD for US domicile, CNY for China),
// inflated by the matching price index. Funding needs split out by currency below.
export function consumption(
  s: ScenarioConfig,
  t: number,
  market: MarketPath,
  draws: PathDraws,
  pathId?: number,
) {
  const year = s.simulation.start_year + t,
    fx = market.fx[t],
    usd = s.people.domicile === 'US';
  const index = usd ? market.usd_index[t] : market.home_index[t],
    medIndex = usd ? market.usd_medical_index[t] : market.home_medical_index[t];
  const spend = Math.max(0, s.budget.annual - s.budget.included_health) * index;
  const medicalBase = medicalBaseCost(
    s.budget.included_health,
    t,
    medIndex,
    s.medical,
    { path_id: pathId, year },
  );
  let oneTimeUsd = 0,
    oneTimeCny = 0,
    shock = 0,
    included = spend + medicalBase,
    additional = 0,
    health = medicalBase;
  // One-time costs and shocks are always additional to the recurring budget.
  for (const item of s.one_time)
    if (item.year === year) {
      if (item.currency === 'USD') {
        const amount = item.amount * market.usd_index[t];
        oneTimeUsd += amount;
        additional += usd ? amount : amount * fx;
      } else {
        const amount = item.amount * market.home_index[t];
        oneTimeCny += amount;
        additional += usd ? amount / fx : amount;
      }
    }
  const oneTime = usd
    ? oneTimeUsd + oneTimeCny / fx
    : oneTimeCny + oneTimeUsd * fx;
  for (const id of (['A', 'B'] as const).filter(
    (id) => id === 'A' || s.people.B !== undefined,
  )) {
    const p = s.people[id]!,
      cost = medicalCost(
        0,
        year - p.birth_year,
        s.simulation.start_year - p.birth_year,
        medIndex,
        s.medical,
        draws.medical_occurrence[id][t],
        { path_id: pathId, year },
      );
    shock += cost.shock;
    additional += cost.shock;
  }
  const care = s.medical.late_life_care,
    // Care starts when the earliest-born person reaches the start age.
    careBirth = Math.min(
      s.people.A.birth_year,
      s.people.B?.birth_year ?? Infinity,
    ),
    careAmount = lateLifeCareCost(care, year - careBirth, medIndex, t, {
      path_id: pathId,
      year,
    });
  additional += careAmount;
  const medical = medicalBase + shock + careAmount,
    total = spend + oneTime + medical;
  const usdTotal = oneTimeUsd + (usd ? spend + medical : 0),
    cnyTotal = oneTimeCny + (usd ? 0 : spend + medical);
  return {
    plan: spend,
    spend,
    one_time: oneTime,
    one_time_usd: oneTimeUsd,
    one_time_cny: oneTimeCny,
    late_life_care: careAmount,
    medical_base: medicalBase,
    medical_shock: shock,
    medical,
    spend_excluding_medical: spend + oneTime,
    medical_total: medical,
    included,
    additional,
    health,
    excess: 0,
    total,
    usd_total: usdTotal,
    cny_total: cnyTotal,
  };
}
