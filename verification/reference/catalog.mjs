// Historical authoring snapshot for the original numeric oracles (65 cases). Never import the product model to obtain expected values.
// The authoritative frozen inventory is fixtures/oracles.json (80 cases: 55 numeric, 18 structural, 7 conditional);
// recalculate.mjs reads that file, not this module. This file is kept for provenance, not execution.
export const cases = [];
function add(id, step, section, inputs, expected, options = {}) {
  cases.push({
    id,
    step,
    spec_section: section,
    oracle_kind: 'numeric',
    implementation_status: 'NOT IMPLEMENTED',
    arithmetic_status: 'NOT CHECKED',
    legal_status: 'NOT VERIFIED',
    currency: 'USD',
    tolerance: 0.01,
    inputs,
    expected,
    provenance:
      'Spec and independent M00 worksheet/reference arithmetic, 2026-10-18; not a legal certification.',
    source_gate_ids: [],
    manual_instructions: [
      `Run ${id} at ${step}; compare raw inputs, each intermediate and final outputs with this literal oracle; save the trace.`,
    ],
    ...options,
  });
}
const us = (status, age, year = 2027, values = {}) => ({
  filing_status: status,
  age,
  year,
  price_index: 1,
  ordinary: 0,
  qd: 0,
  ss: 0,
  securities_lt: 0,
  property_lt: 0,
  gross_u1250: 0,
  prior_capital_loss: 0,
  nii: 0,
  ...values,
});
const usSources = ['L-US-TABLES', 'L-SS-PASSIVE', 'L-CAPITAL'];
const usOpts = { source_gate_ids: usSources };
add(
  'US-1',
  'M06.1',
  '11.1',
  us('mfs', 70, 2027, { ordinary: 80000, qd: 10000, ss: 30000, nii: 10000 }),
  {
    taxable_ss: 25500,
    deduction: 17750,
    ti: 97750,
    income_tax: 15517,
    niit: 0,
  },
  usOpts,
);
add(
  'US-2',
  'M06.1',
  '11.1',
  us('single', 70, 2027, {
    ordinary: 50000,
    ss: 40000,
    securities_lt: 20000,
    nii: 20000,
  }),
  {
    taxable_ss: 34000,
    senior_deduction: 4260,
    deduction: 22410,
    ti: 81590,
    income_tax: 11261.8,
    niit: 0,
  },
  { source_gate_ids: [...usSources, 'L-SENIOR'] },
);
add(
  'US-3',
  'M06.1',
  '11.1',
  us('mfs', 60, 2027, {
    ordinary: 5000,
    qd: 30000,
    securities_lt: 150000,
    nii: 185000,
  }),
  { ti: 168900, income_tax: 17917.5, niit: 2280 },
  usOpts,
);
add(
  'US-4',
  'M06.1',
  '11.1',
  us('mfs', 66, 2027, {
    ordinary: 60000,
    property_lt: 100000,
    gross_u1250: 50000,
    nii: 150000,
  }),
  { ti: 192250, income_tax: 30007, niit: 3230 },
  usOpts,
);
add(
  'US-5',
  'M06.1',
  '11.1',
  us('mfs', 60, 2027, { ordinary: 150000, gross_u1250: 40000, nii: 40000 }),
  { ti: 173900, income_tax: 34334, regular_tax: 34334, niit: 1520 },
  usOpts,
);
add(
  'US-6',
  'M06.1',
  '11.1',
  us('mfs', 60, 2027, { ordinary: 250000, gross_u1250: 50000, nii: 50000 }),
  { ti: 283900, income_tax: 63804, regular_tax: 68134.25, niit: 1900 },
  usOpts,
);
add(
  'NRA-1',
  'M06.2',
  '11.1',
  {
    filing_status: 'mfs',
    rental_net: 20000,
    dividends: 10000,
    ss: 20000,
    price_index: 1,
  },
  { rental_tax: 2152, dividend_tax: 1000, ss_tax: 5100, total: 8252 },
  { source_gate_ids: ['L-US-TABLES', 'L-NRA-TREATY', 'L-SSA-ABROAD'] },
);
add(
  'CN-1',
  'M06.3',
  '11.1',
  {
    dividends: 50000,
    gross_rent: 200000,
    trad: 300000,
    pension_treatment: 'comprehensive',
    eligible_final_paid_us_tax_cny: 20000,
  },
  {
    dividend_tax: 10000,
    rent_tax: 32000,
    pension_tax: 31080,
    before_credit: 73080,
    credit: 20000,
    due: 53080,
  },
  {
    currency: 'CNY',
    source_gate_ids: ['L-CN-PENSION', 'L-CN-FTC', 'L-CN-DEPOSIT'],
  },
);
add(
  'EST-1',
  'M06.2',
  '11.1',
  { bases: [1000000, 60000] },
  { tentative_taxes: [345800, 13000] },
  { source_gate_ids: ['L-ESTATE'] },
);
add(
  'EST-2',
  'M06.2',
  '11.1',
  { us_situs: 2000000, citizen_spouse: false, nra_credit: 13000 },
  { estate_tax: 732800 },
  { source_gate_ids: ['L-ESTATE'] },
);
add(
  'EST-3',
  'M06.2',
  '11.1',
  { citizen: true, gross: 16000000, exclusion: 15000000, index: 1 },
  { estate_tax: 400000 },
  { source_gate_ids: ['L-ESTATE'] },
);
add(
  'RMD-1',
  'M05.4',
  '11.1',
  { prior_year_end_balance: 1000000, age: 75, divisor: 24.6, need: 10000 },
  { rmd: 40650.40650406504, surplus: 30650.40650406504 },
  { source_gate_ids: ['L-RMD'] },
);
add(
  'MORT-1',
  'M05.2',
  '11.1',
  {
    start_age: 65,
    parameters: [
      [88, 9.5],
      [91, 8.5],
    ],
    integration_end: 120,
    intervals: 24000,
  },
  {
    life_expectancy: [20.045775003615287, 22.5208088993396],
    rounded_spec: [20.05, 22.52],
  },
  {
    currency: 'years',
    tolerance: 0.05,
    legal_status: 'NOT APPLICABLE: illustrative mortality model',
  },
);
add(
  'US-7',
  'M06.1',
  '11.1 / R1',
  us('mfs', 60, 2027, {
    ordinary: 100000,
    securities_lt: -50000,
    gross_u1250: 50000,
  }),
  {
    net_total: 0,
    lt_gain: 0,
    u1250_gain: 0,
    loss_deduction: 0,
    carry: 0,
    ti: 83900,
    income_tax: 13170,
    niit: 0,
  },
  usOpts,
);
add(
  'US-8',
  'M06.1',
  '11.1 / R1',
  us('mfs', 60, 2027, {
    ordinary: 100000,
    securities_lt: -50000,
    gross_u1250: 20000,
  }),
  {
    net_total: -30000,
    loss_deduction: 1500,
    carry: 28500,
    ti: 82400,
    income_tax: 12840,
    niit: 0,
  },
  usOpts,
);
add(
  'FIRPTA-1',
  'M07.2',
  '11.1 / R2',
  {
    price: 1000000,
    mortgage: 700000,
    costs: 60000,
    foreign_share: 1,
    withholding_rate: 0.15,
    final_liability: 20000,
  },
  {
    cash_at_closing: 90000,
    prepayment: 150000,
    refund: 130000,
    permanent_tax: 20000,
  },
  { source_gate_ids: ['L-FIRPTA'] },
);
add(
  'DEATH-1',
  'M07.3',
  '11.1 / R3',
  { suspended_loss: 30000, relevant_positive_basis_increase: 20000 },
  { permitted_final_return_deduction: 10000 },
  { source_gate_ids: ['L-PASSIVE-DEATH'] },
);
add(
  'DEATH-2',
  'M07.3',
  '11.1 / R3',
  { suspended_loss: 30000, relevant_positive_basis_increase: 50000 },
  { permitted_final_return_deduction: 0 },
  { source_gate_ids: ['L-PASSIVE-DEATH'] },
);
add(
  'TERMINAL-1',
  'M07.3',
  '11.1 / R3',
  {
    assets: 500000,
    final_income_liability: 30000,
    net_remitted: 0,
    estate_due: 0,
    conditional_credit: 0,
  },
  { net_to_heirs: 470000, unpaid: 30000, actual_paid: 0, estate_shortfall: 0 },
  { source_gate_ids: ['L-ESTATE'] },
);
add(
  'CN-2',
  'M06.3',
  '11.1 / R4',
  {
    dividends: 50000,
    dividend_us_final_paid_tax: 5000,
    ss_us_final_paid_tax: 5100,
    ss_china_exempt: true,
    fx: 1,
  },
  {
    before_credit: 10000,
    eligible_pool: 5000,
    credit: 5000,
    due: 5000,
    excluded_ss_tax: 5100,
  },
  { currency: 'CNY', source_gate_ids: ['L-CN-SSA', 'L-CN-FTC'] },
);

add(
  'US-CARRY',
  'M06.1',
  '6.2',
  us('mfs', 60, 2028, {
    ordinary: 100000,
    securities_lt: 10000,
    prior_capital_loss: 28500,
  }),
  {
    net_total: -18500,
    loss_deduction: 1500,
    carry: 17000,
    ti: 82400,
    income_tax: 12840,
    niit: 0,
  },
  usOpts,
);
add(
  'US-EARLY',
  'M06.1',
  '5.6 / 6.2',
  { early_trad: 10000, age: 40, exception: false, penalty_rate: 0.1 },
  { penalty: 1000 },
  { source_gate_ids: ['L-RMD'] },
);
for (const [id, description, inputs] of [
  [
    'CAPITAL-PARTIAL',
    'Partial securities/carryover offset against gross unrecaptured gain',
    {
      ordinary: 100000,
      securities_lt: -20000,
      gross_u1250: 50000,
      prior_capital_loss: 10000,
    },
  ],
  [
    'PROPERTY-1231',
    'Net business-property gain with nonrecaptured prior Section1231 losses',
    { gain: 50000, prior_losses: [{ income_year: 2025, amount: 20000 }] },
  ],
])
  add(id, 'M06.1', '6.1–6.2', { ...inputs, description }, null, {
    oracle_kind: 'conditional',
    arithmetic_status: 'OPEN: worksheet ordering',
    source_gate_ids: ['L-CAPITAL'],
    manual_instructions: [
      'Open Schedule D/unrecaptured-gain worksheet and Form4797; cite exact lines and supported conditions; freeze numeric buckets only after source review. Do not accept a gross-gain shortcut.',
    ],
  });

add(
  'CN-PARTIAL',
  'M06.3',
  '6.4',
  {
    china_precredit: 10000,
    eligible_final_source_liability: 10000,
    source_paid: 4000,
    source_unpaid: 6000,
    projected_credit: 10000,
    fx: 1,
  },
  {
    eligible_paid: 4000,
    used_credit: 4000,
    china_due: 6000,
    ftc_adjustment: 6000,
  },
  {
    currency: 'CNY',
    source_gate_ids: ['L-CN-FTC'],
    legal_status:
      'OPEN: numeric under all-paid-components-eligible assumption; primary-source payment-allocation rules pending',
  },
);
add(
  'CN-WITHHOLDING',
  'M06.3',
  '6.4',
  {
    china_precredit: 30000,
    gross_withholding: 150000,
    final_eligible_source_liability: 20000,
    refund: 130000,
    fx: 1,
  },
  { eligible_retained_pool: 20000, credit: 20000, china_due: 10000 },
  { currency: 'CNY', source_gate_ids: ['L-CN-FTC', 'L-FIRPTA'] },
);
add(
  'CN-EXPIRY',
  'M06.3',
  '6.4',
  {
    income_year: 2026,
    excess_eligible_paid_credit: 12000,
    proposed_last_usable_income_year: 2031,
    country: 'US',
  },
  null,
  {
    oracle_kind: 'conditional',
    arithmetic_status: 'OPEN: inclusive expiry/application rules',
    source_gate_ids: ['L-CN-FTC'],
    manual_instructions: [
      'Confirm five FOLLOWING income years, vintage conversion, oldest-first use and post-refund correction from primary source. Then pin 2031/2032 boundaries and no carry of ineligible tax.',
    ],
  },
);
add(
  'CN-REFUND',
  'M06.3',
  '6.4',
  {
    income_year: 2026,
    payment_year: 2027,
    credit_used: 5000,
    later_refund: 2000,
    refund_year: 2028,
    fx: [6.69, 6.7, 6.5],
  },
  null,
  {
    oracle_kind: 'conditional',
    arithmetic_status: 'OPEN: refund-year conversion/amendment rule',
    source_gate_ids: ['L-CN-FTC'],
    manual_instructions: [
      'Confirm component allocation and refund/amendment FX convention; show income/payment/vintage years and reduce eligible paid tax without a duplicate credit/refund.',
    ],
  },
);
add(
  'CN-RESIDENCE',
  'M06.3',
  '6.4',
  {
    cn_domiciled: false,
    reset: true,
    alternative_reset: false,
    start_year: 2026,
  },
  {
    reset_china_foreign_income_tax_active: false,
    no_reset_first_active_t: 6,
    no_reset_first_active_year: 2032,
  },
  {
    oracle_kind: 'structural',
    currency: 'CNY',
    source_gate_ids: ['L-CN-SIX-YEAR'],
  },
);

add(
  'RNG-VECTORS',
  'M04.1',
  '3.2',
  {
    raw_state: [1, 2, 3, 4],
    tuple_text: '["retire-rng-v1",42,0,"bootstrap",""]',
    normal_uniforms: [0.5, 0.5],
  },
  {
    raw_outputs: [
      11520, 0, 5927040, 70819200, 2031721883, 1637235492, 1287239034,
      3734860849,
    ],
    sha256: 'ab710528cf1bc287af2b294db0827f5bf5ec8348ee9de1d5ba81169939757f3b',
    little_endian_state: [671445419, 2277645263, 1294543791, 1535083184],
    seeded_outputs: [2406593643, 4039661935, 1310122810, 591680076, 881506770],
    uniform_min: 1.1641532182693481e-10,
    uniform_max: 0.9999999998835847,
    normal_pair: [-1.1774100225154747, 0],
  },
  {
    currency: 'dimensionless',
    tolerance: 1e-12,
    legal_status: 'NOT APPLICABLE: algorithm',
    integer_fields: ['raw_outputs', 'little_endian_state', 'seeded_outputs'],
    provenance:
      'Independent unsigned xoshiro128** reference and standard SHA-256; exact seed text; not a call into future rng.ts.',
  },
);
add(
  'RNG-PREFIX',
  'M04.4',
  '3.2',
  {
    seed: 42,
    path_ids: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    path_counts: [10, 100],
    horizons: [52, 71],
    property_ids: ['rental_1', 'rental_2'],
  },
  {
    unchanged_prefixes: true,
    property_reorder_unchanged: true,
    spending_switches_unchanged: true,
    seed43_changes_stochastic_draws: true,
  },
  {
    oracle_kind: 'structural',
    legal_status: 'NOT APPLICABLE: algorithm',
    manual_instructions: [
      'Compare exact latent bytes before/after path-count, horizon, spending/medical switch, property label/order/addition changes; fixed keyed IDs must retain existing prefixes.',
    ],
  },
);
add(
  'MARKET-JOINT',
  'M04.2',
  '4.3',
  {
    source_rows: [
      [2000, 0, 0.01, 0.005, 0.02, 0.03],
      [2001, 0.01, 0.011, 0.0051, 0.0201, 0.0301],
      [2002, 0.02, 0.012, 0.0052, 0.0202, 0.0302],
      [2003, 0.03, 0.013, 0.0053, 0.0203, 0.0303],
      [2004, 0.04, 0.014, 0.0054, 0.0204, 0.0304],
      [2005, 0.05, 0.015, 0.0055, 0.0205, 0.0305],
      [2006, 0.06, 0.016, 0.0056, 0.0206, 0.0306],
      [2007, 0.07, 0.017, 0.0057, 0.0207, 0.0307],
      [2008, 0.08, 0.018, 0.0058, 0.0208, 0.0308],
      [2009, 0.09, 0.019, 0.0059, 0.0209, 0.0309],
    ],
    columns: ['year', 'us_stocks', 'us_bonds', 'usd_cash', 'us_cpi', 'us_home'],
    block_mean_years: 2,
    bootstrap_uniforms: [0.95, 0.9, 0.1, 0.1, 0.25, 0.8, 0.99],
  },
  {
    row_indices: [9, 0, 2, 3],
    all_columns_same_row: true,
    consumed_uniform_count: 7,
  },
  {
    currency: 'dimensionless',
    tolerance: 0,
    legal_status: 'NOT APPLICABLE: synthetic tape',
  },
);
add(
  'MARKET-PROJECTION',
  'M04.2',
  '4.3.1',
  {
    unit_source: [-0.2, 0, 0.2],
    target_mean: 0.07,
    target_vol: 0.15,
    correlated_series: [1, 2, 3],
  },
  {
    source_mean: 0,
    source_population_sd: 0.1632993161855452,
    transformed: [-0.11371173070873836, 0.07, 0.25371173070873836],
    mean: 0.07,
    sd: 0.15,
    correlation: 1,
  },
  {
    currency: 'dimensionless',
    tolerance: 1e-9,
    legal_status:
      'NOT APPLICABLE: synthetic three-row helper; not a runnable sample window',
  },
);
add(
  'MARKET-DOMAIN',
  'M04.2',
  '4.3.1',
  {
    reference_projection: { mean: 0.03, vol: 0.4 },
    isolated_returns: [-1, -1],
    isolated_yields: [0, 0.013],
    constant_source: [0.02, 0.02, 0.02],
    requested_vol: 0.1,
  },
  {
    full_reference_rejected_after_M03: true,
    total_loss_zero_yield_allowed: true,
    total_loss_positive_yield_rejected: true,
    zero_sd_positive_vol_rejected: true,
    no_clipping: true,
  },
  {
    oracle_kind: 'structural',
    source_gate_ids: ['DATA-HISTORY'],
    manual_instructions: [
      'After M03 pins actual full-window rows, cite the transformed minimum/year; verify invalidity before sampling. Isolated helper cases check total-loss vs price/log domains; do not treat provisional SD as verified data.',
    ],
  },
);
add(
  'MARKET-TIMING',
  'M04.3',
  '4.5–4.7',
  {
    start_year: 2026,
    cn_cpi: 0.04,
    us_cpi: 0.03,
    fx_spot: 6.69,
    fx_multiplier: 0.99,
    stress_year: 2029,
    stress_pct: -0.15,
    deposit_real_rate: 0.005,
    deposit_floor: 0.002,
    medical_excess: 0.02,
  },
  {
    cn_index_0: 1,
    us_index_0: 1,
    cn_index_1: 1.04,
    us_index_1: 1.03,
    fx_10: 6.0503160818089015,
    stress_index: 3,
    stress_ratio: 0.85,
    deposit_rate: 0.045,
    medical_price_factor: 1.06,
  },
  {
    currency: 'mixed',
    tolerance: 1e-12,
    legal_status: 'NOT APPLICABLE: deterministic recurrence',
  },
);
add(
  'MARKET-AR',
  'M04.3',
  '4.4',
  { mean: 0.04, start: 0.02, phi: 0.5, sigma: 0, years: 3 },
  { cn_rates: [0.03, 0.035, 0.0375] },
  {
    currency: 'dimensionless',
    tolerance: 1e-12,
    legal_status: 'NOT APPLICABLE: recurrence',
  },
);
add(
  'MARKET-INVALID',
  'M04.3',
  '4.4–4.6',
  {
    mean: 0.04,
    phi: 0,
    sigma: 0.02,
    z: -60,
    path_id: 7,
    t: 2,
    start_year: 2026,
  },
  {
    cn_cpi: -1.16,
    gross_factor: -0.16,
    error_path_id: 7,
    error_year: 2028,
    whole_job_failed: true,
    partial_probabilities: false,
  },
  {
    currency: 'dimensionless',
    tolerance: 1e-12,
    legal_status: 'NOT APPLICABLE: domain policy',
  },
);
add(
  'MARKET-CALIBRATION',
  'M04.4',
  '11.2',
  { n_paths: 20000, horizon: 40, seed: 42, reference_status: 'not imported' },
  null,
  {
    oracle_kind: 'conditional',
    arithmetic_status: 'OPEN: source calibration must be reproduced at M03',
    source_gate_ids: ['DATA-HISTORY'],
    manual_instructions: [
      'Reproduce exact population moments/correlations from raw public data. Record measured stochastic means/CPI correlation/FX SD/bond drawdowns under fixed versions. Do not inherit provisional benchmark PASS.',
    ],
  },
);

add(
  'BUDGET-1',
  'M05.1',
  '5.2',
  {
    ordinary_cny: 212000,
    cpi_health_cny: 38000,
    medical_base_cny: 0,
    annual_cny: 250000,
    included_health_cny: 38000,
    duplicate_medical_base_cny: 38000,
  },
  {
    included_recurring: 250000,
    health: 38000,
    duplicate_total: 288000,
    duplicate_run_allowed: false,
  },
  { currency: 'CNY', source_gate_ids: [] },
);
add(
  'SPENDING-TIMING',
  'M05.1',
  '5.2',
  {
    start_year: 2026,
    start_age_A: 40,
    cn_cpi: 0.04,
    care_monthly: 8000,
    care_start_age: 60,
    first_death_t: 0,
    base_monthly: 1000,
    survivor_factor: 0.6,
  },
  {
    care_before_t20: 0,
    care_t20_cny: 210347.82173120713,
    survivor_item_t0: 12000,
    survivor_item_t1: 7488,
  },
  {
    currency: 'CNY',
    provenance:
      'Care=96000*(1.04^20); survivor=12000*1.04*.6; independent powers, not household medical forecast.',
  },
);
add(
  'FLEX-1',
  'M05.1',
  '5.2',
  {
    prior_returns: [-0.2, 0.05, 0.05, 0.05],
    loss_returns: [-0.1, -0.1, -0.1, -0.1, -0.1],
    cut: 0.1,
    recover: 0.05,
    floor: 0.75,
    cap: 1,
  },
  {
    multipliers: [1, 0.9, 0.945, 0.99225, 1],
    loss_multipliers: [1, 0.9, 0.81, 0.75, 0.75, 0.75],
    disabled_multiplier: 1,
  },
  {
    currency: 'dimensionless',
    tolerance: 1e-12,
    legal_status: 'NOT APPLICABLE: spending rule',
  },
);
add(
  'MEDICAL-GROWTH',
  'M05.2',
  '5.3',
  {
    base: 38000,
    ordinary: 212000,
    cn_cpi: 0.04,
    medical_excess: 0.02,
    age_growth: 0.04,
    increments: 50,
  },
  {
    nominal_factor: 1.1024,
    real_factor: 1.06,
    year1_medical_nominal: 41891.2,
    year1_medical_real: 40280,
    year1_included_total: 262371.2,
    year1_ceiling: 260000,
    year1_excess: 2371.2,
    after50_medical_real: 699965.8624496766,
  },
  {
    currency: 'CNY',
    field_tolerances: { nominal_factor: 1e-12, real_factor: 1e-12 },
    legal_status:
      'NOT APPLICABLE: illustrative configurable growth, not calibrated premiums',
  },
);
add(
  'MEDICAL-SCOPE',
  'M05.2',
  '5.3',
  {
    age: 60,
    occurrence_uniform: 0.01,
    prob_at60: 0.02,
    size_normal: 0,
    median: 50000,
    medical_index: 1,
    included_recurring: 250000,
    ceiling: 250000,
  },
  {
    shock: 50000,
    additional_scope: {
      included: 250000,
      additional: 50000,
      total: 300000,
      excess: 0,
    },
    included_scope: {
      included: 300000,
      additional: 0,
      total: 300000,
      excess: 50000,
    },
  },
  { currency: 'CNY', legal_status: 'NOT APPLICABLE: scope arithmetic' },
);
add(
  'SS-GATES',
  'M05.3',
  '5.4',
  {
    A_start_age: 45,
    B_death_t: 0,
    own_monthly: 2200,
    own_claim_age: 67,
    survivor_monthly: 1800,
    survivor_claim_age: 62,
    eligible: true,
    payable_abroad: true,
    us_cpi: 0,
    cut: 0.2,
    cut_start_age: 62,
    deceased_future_own_monthly: 9000,
  },
  {
    before_cut_schedule: { age45: 0, age60: 0, age62: 21600, age67: 26400 },
    with_cut: { age45: 0, age60: 0, age62: 17280, age67: 21120 },
    disabled_all: 0,
    ordinary_claim_age45_allowed: false,
  },
  {
    source_gate_ids: ['L-SURVIVOR', 'L-SSA-ABROAD'],
    provenance:
      'Unit COLA index1; later indexed case multiplies 21600/26400 by us_index[17]/[22]. Manual supplied entitlement; no deceased-benefit substitution.',
  },
);

add(
  'ACCOUNT-BASIS',
  'M05.4',
  '5.5',
  {
    opening_value: 100000,
    opening_basis: 60000,
    withdrawal: 50000,
    separate_return_case: { total_return: 0.1, yield: 0.013 },
  },
  {
    withdrawal_gain: 20000,
    remaining_value: 50000,
    remaining_basis: 30000,
    return_case_value: 110000,
    return_case_basis: 61300,
  },
);
add(
  'ACCOUNT-REBALANCE',
  'M05.4',
  '5.5',
  {
    stock_value: 60000,
    stock_basis: 30000,
    bond_value: 50000,
    bond_basis: 30000,
    target_stock: 0.5,
    yields: 0,
  },
  {
    stock_sale: 5000,
    gain: 2500,
    ending_stock: 55000,
    ending_bond: 55000,
    stock_basis: 27500,
    bond_basis: 35000,
    retirement_taxable_gain: 0,
  },
);
add(
  'ACCOUNT-ACCESS',
  'M05.4',
  '5.6',
  {
    ages: [40, 55, 60],
    trad_balance: 120000,
    roth_balance: 120000,
    early_flag: true,
    qualifying_rule55: true,
  },
  {
    trad40_without_early: false,
    trad40_with_early: true,
    roth40_with_early: false,
    trad55_rule55: true,
    trad60: true,
    roth60: true,
  },
  {
    oracle_kind: 'structural',
    source_gate_ids: ['L-RMD'],
    manual_instructions: [
      'Inspect access walk and distribution penalty base; Rule55 qualifying facts and penalty exception require primary-source acceptance. Do not assume all withdrawals before60 incur a penalty despite a qualifying exception.',
    ],
  },
);
add(
  'CONVERSION-1',
  'M05.4',
  '5.7',
  { fx: 6.69, spread: 0.003, cny_need: 6690, usd_need: 1000 },
  { usd_to_fund_cny: 1003.0090270812436, cny_to_fund_usd: 6710.07 },
);
add(
  'SOURCE-1',
  'M06.2',
  '1.2 / 5.5 / 9.2',
  {
    us_citizen: false,
    us_income_tax_status: 'resident',
    estate_domicile: 'unresolved',
    household_legal_checkbox: true,
    applicable_registry_verified: false,
    cash_value: 100000,
    cash_return: 0.03,
    bank_nra_rate: 0,
    fund_nra_rate: 0.1,
  },
  {
    unsupported_resident_branch_run_allowed: false,
    checkbox_bypass_allowed: false,
    bank_profile_tax: 0,
    fund_profile_tax: 300,
    wrapper_controls_retirement_situs: true,
  },
  {
    oracle_kind: 'structural',
    source_gate_ids: ['L-RESIDENCY', 'L-ESTATE', 'L-NRA-TREATY'],
  },
);
add(
  'PROPERTY-BOOKS',
  'M07.1',
  '5.8',
  {
    value: 900000,
    cost_basis: 600000,
    land_share: 0.2,
    rent_monthly: 3800,
    vacancy: 0.05,
    management_fee: 0.08,
    maintenance_pct: 0.01,
    property_tax: 9000,
    insurance: 1500,
    hoa_monthly: 0,
    mortgage: 0,
    index: 1,
  },
  {
    gross_rent: 43320,
    management_fee: 3465.6,
    maintenance: 9000,
    cash_flow: 20354.4,
    annual_depreciation: 17454.545454545456,
    schedule_e_net: 2899.854545454542,
  },
);
add(
  'PROPERTY-MORTGAGE',
  'M07.1',
  '5.8',
  { opening_balance: 100000, rate: 0.05, years_left: 10 },
  {
    annual_payment: 12950.457496545662,
    first_interest: 5000,
    first_principal: 7950.457496545662,
    ending_balance: 92049.54250345434,
  },
);
add(
  'FIRPTA-SHARE',
  'M07.2',
  '5.8',
  {
    price: 1000000,
    costs: 60000,
    mortgage: 700000,
    foreign_share: 0.5,
    withholding_rate: 0.15,
  },
  { withholding: 75000, cash_at_closing: 165000 },
  { source_gate_ids: ['L-FIRPTA'] },
);
add(
  'SALE-FAIL',
  'M07.2',
  '5.8',
  {
    price: 1000000,
    costs: 60000,
    mortgage: 900000,
    foreign_share: 1,
    withholding_rate: 0.15,
    accessible_closing_funds: 0,
  },
  {
    quoted_closing_cash: -110000,
    required_contribution: 110000,
    executed: false,
    realized_gain: 0,
    prepayment: 0,
    property_still_held: true,
  },
  { source_gate_ids: ['L-FIRPTA'] },
);
add(
  'HOLD-1',
  'M07.2',
  '5.8',
  {
    strategy: 'hold',
    last_resort_property_sale: false,
    cash_shortfall_cny: 10000,
    property_equity_usd: 1269000,
  },
  {
    strategy_sale: false,
    forced_sale: false,
    property_liquid_funding: 0,
    shortfall_cny: 10000,
  },
  {
    oracle_kind: 'structural',
    currency: 'mixed',
    manual_instructions: [
      'Force funding need and retain valuable property; inspect that neither strategy nor last-resort code sells it. Compare with explicitly enabled last-resort-sale variant.',
    ],
  },
);
add(
  'DEATH-SNAPSHOT',
  'M07.3',
  '5.9',
  {
    A_death_t: 0,
    B_death_t: 0,
    citizen_A: true,
    citizen_B: false,
    B_us_situs: 500000,
    B_nra_credit: 13000,
    pre_transfer_shares: [0.5, 0.5],
    passive_loss: 30000,
    basis_increase: 20000,
  },
  {
    simultaneous: true,
    B_surviving_citizen_spouse: false,
    B_estate_tax: 142800,
    permitted_passive_deduction: 10000,
    tax_inputs_before_transfer: true,
    carry_to_survivor: false,
  },
  { source_gate_ids: ['L-ESTATE', 'L-PASSIVE-DEATH', 'L-CN-FTC'] },
);
add(
  'TERMINAL-REFUND',
  'M07.3',
  '6.7',
  {
    assets: 90000,
    final_liability: 20000,
    net_remitted: 150000,
    estate_due: 0,
    conditional_credit: 0,
  },
  {
    due: 0,
    confirmed_refund: 130000,
    net_to_heirs: 220000,
    actual_refund_cash_at_terminal: 0,
  },
  { source_gate_ids: ['L-FIRPTA', 'L-ESTATE'] },
);
add(
  'TERMINAL-DEFICIT',
  'M07.3',
  '6.7',
  {
    assets: 20000,
    final_liability: 30000,
    net_remitted: 0,
    estate_due: 0,
    conditional_credit: 5000,
  },
  {
    signed_net: -10000,
    net_to_heirs: 0,
    estate_shortfall: 10000,
    excluded_conditional_credit: 5000,
    actual_paid: 0,
  },
  { source_gate_ids: ['L-ESTATE', 'L-CN-FTC'] },
);

const pvInputs = {
  start_year: 2026,
  birth_year_A: 1986,
  birth_year_B: 1986,
  death_age_A: 89,
  death_age_B: 89,
  max_age: 110,
  annual_cny: 250000,
  ordinary_cny: 212000,
  health_cny: 38000,
  medical_bases: 0,
  shock: false,
  ss: false,
  property: false,
  flex: false,
  return: 0.03,
  cn_cpi: 0.04,
  us_cpi: 0.03,
  fx_spot: 6.69,
  fx_spread: 0,
  all_applicable_tax_rates: 0,
  accessible_account_type: 'taxable',
  allocated_asset: 'usd_cash',
  n_paths: 1,
  seed: 42,
};
add(
  'CONTROL-PV',
  'M08.1',
  '9.3',
  { ...pvInputs, fx_multiplier: 1, config_file: 'control-pv.toml' },
  {
    payment_count: 50,
    first_payment: 37369.20777279521,
    required_balance: 2390572.9770677146,
    displayed_pv: '2,390,572.98',
    final_balance: 0,
    exact_pv_decimal:
      '2390572.9770677145932828554267970000473442304988766842740735298308',
    first_age: 40,
    last_age: 89,
    allocated_rows: 71,
  },
  {
    field_tolerances: {
      first_payment: 1e-8,
      required_balance: 1e-8,
      final_balance: 1e-6,
    },
    legal_status:
      'NOT APPLICABLE: tax-free arithmetic control; not household funding advice',
    provenance:
      '50 beginning-of-year payments, exact rational sum; M00-2 workbook and independent reference. Final balance residual <=1e-6 is numerical zero.',
  },
);
add(
  'CONTROL-FX',
  'M08.2',
  '9.3',
  { ...pvInputs, fx_multiplier: 0.99, config_file: 'control-fx.toml' },
  {
    payment_count: 50,
    first_payment: 37369.20777279521,
    required_balance: 3152520.3411145047,
    displayed_pv: '3,152,520.34',
    final_balance: 0,
    exact_pv_decimal:
      '3152520.3411145046905392977802592090780936043212755608347596589861',
    first_age: 40,
    last_age: 89,
    allocated_rows: 71,
  },
  {
    field_tolerances: {
      first_payment: 1e-8,
      required_balance: 1e-8,
      final_balance: 1e-6,
    },
    legal_status:
      'NOT APPLICABLE: tax-free arithmetic control; not household funding advice',
    provenance:
      'Exact rational q=10400/10197; FX input is log(.99), not -.01. Earlier spec float sum differs <2e-9 USD.',
  },
);
add(
  'CONTROL-DEPLETION',
  'M08.2',
  '5.11',
  {
    start_year: 2026,
    A_start_age: 60,
    A_death_age: 75,
    B_start_age: 60,
    B_death_age: 60,
    fx: 7,
    cpi: 0,
    return: 0,
    tax: 0,
    spending_monthly_cny: 7000,
    survivor_factor: 1,
    initial_accessible_roth_usd: 120000,
    empty_taxable_surplus: true,
    ss: false,
    medical: false,
    property: false,
    flex: false,
  },
  {
    annual_usd_need: 12000,
    t9_end_balance: 0,
    t9_depleted: false,
    first_shortfall_t: 10,
    first_shortfall_year: 2036,
    first_shortfall_cny: 84000,
  },
  {
    currency: 'mixed',
    legal_status: 'NOT APPLICABLE: zero-tax timing control',
  },
);
add(
  'CONTROL-HOLD',
  'M08.2',
  '9.3',
  {
    cash_usd: 0,
    property_value: 2000000,
    property_loan: 731000,
    annual_cny_need: 250000,
    fx: 6.69,
    strategy: 'hold',
    last_resort_property_sale: false,
    zero_net_rent_assumption: true,
  },
  {
    equity_usd: 1269000,
    available_property_cash: 0,
    forced_sale: false,
    first_shortfall_t: 0,
    shortfall_cny: 250000,
  },
  {
    oracle_kind: 'structural',
    currency: 'mixed',
    legal_status:
      'NOT APPLICABLE: labeled zero-rent sensitivity, not actual property cash flow',
  },
);
const finalInputs = {
  start_year: 2026,
  A_age: 60,
  B_age: 60,
  fx: 1,
  cpi: 0,
  return: 0,
  yields: 0,
  A_trad: 650000,
  empty_taxable_surplus: true,
  spending_year0_usd: 150000,
  spending_other_years: 0,
  us_ordinary_flat_rate: 0.2,
  standard_deduction: 0,
  other_taxes: 0,
  china_A_exempt: true,
  ss: false,
  medical: false,
  property: false,
  flex: false,
};
add(
  'ENGINE-FINAL-TAX',
  'M08.3',
  '5.10 / 6.7',
  { ...finalInputs, both_die_end_t: 0, config_file: 'engine-final-tax.toml' },
  {
    year0_trad_withdrawal: 150000,
    year0_assets: 500000,
    year0_income_tax: 30000,
    actual_paid: 0,
    terminal_unpaid: 30000,
    net_to_heirs: 470000,
  },
  {
    legal_status:
      'NOT APPLICABLE: explicit flat-tax synthetic table; actual US tax module must run, no tax stub',
  },
);
add(
  'ENGINE-PRIOR-TAX',
  'M08.3',
  '5.10 / 6.7',
  { ...finalInputs, both_die_end_t: 1, config_file: 'engine-prior-tax.toml' },
  {
    year0_income_tax: 30000,
    year1_trad_withdrawal: 30000,
    year1_actual_paid: 30000,
    year1_assets: 470000,
    year1_income_tax: 6000,
    terminal_unpaid: 6000,
    net_to_heirs: 464000,
  },
  {
    legal_status:
      'NOT APPLICABLE: explicit flat-tax synthetic table; taxes from the real module, not a stub',
  },
);
add(
  'ENGINE-FIRPTA',
  'M08.3',
  '5.8 / 6.7',
  {
    start_year: 2026,
    A_age: 60,
    B_age: 60,
    fx: 1,
    purchase_fx: 1,
    cpi: 0,
    return: 0,
    yields: 0,
    ss: false,
    medical: false,
    flex: false,
    B_owned_property: {
      price: 1000000,
      cost_basis: 840000,
      depreciation: 0,
      mortgage: 700000,
      selling_cost: 0.06,
      firpta_rate: 0.15,
      sell_start_t: 0,
    },
    us_property_gain_rate: 0.2,
    china_property_gain_rate: 0.2,
    eligible_credit: 20000,
    bank_profile_situs: 'non_us',
    B_retirement: 0,
    estate_tax: 0,
    both_die_end_t: 0,
    config_file: 'engine-firpta.toml',
  },
  {
    gain: 100000,
    closing_cash: 90000,
    withheld: 150000,
    final_federal_tax: 20000,
    final_china_due: 0,
    confirmed_refund: 130000,
    terminal_assets: 90000,
    net_to_heirs: 220000,
  },
  {
    source_gate_ids: ['L-FIRPTA', 'L-CN-FTC'],
    legal_status:
      'OPEN: eligible source-tax assumption; flat-tax synthetic table uses real tax module, not a stub',
  },
);

add(
  'SUMMARY-1',
  'M09.2',
  '7.2',
  {
    n_paths: 5,
    active_values: [1, 2, 3, 4, null],
    alive: [1, 1, 1, 1, 0],
    depleted: [0, 0, 0, 1, 0],
    inactive_has_no_depletion: true,
  },
  {
    p10: 1.3,
    median: 2.5,
    p90: 3.7,
    alive_probability: 0.8,
    alive_not_depleted_probability: 0.6,
    conditional_healthy_given_alive: 0.75,
    lifetime_success: 0.8,
    empty_quantile: null,
  },
  {
    currency: 'dimensionless',
    tolerance: 1e-12,
    legal_status: 'NOT APPLICABLE: cohorts and Type7',
  },
);
add(
  'RANKING-1',
  'M09.2',
  '8.3',
  {
    paths: [
      { id: 0, depletion_t: 5, terminal: 1000 },
      { id: 1, depletion_t: null, terminal: 200 },
      { id: 2, depletion_t: 3, terminal: 9999 },
      { id: 3, depletion_t: null, terminal: 100 },
    ],
  },
  { ascending_ids: [2, 0, 3, 1], worst: 2, p10: 2, median: 0 },
  { currency: 'IDs', tolerance: 0, legal_status: 'NOT APPLICABLE: ranking' },
);
add(
  'SEQUENCE-1',
  'M11.2',
  '11.3',
  {
    initial: 100000,
    annual_beginning_withdrawal: 10000,
    returns: [-0.2, 0.25],
    reversed: [0.25, -0.2],
  },
  {
    ending_original: 77500,
    ending_reversed: 82000,
    no_withdrawal_both: 100000,
  },
  {
    legal_status:
      'NOT APPLICABLE: synthetic portfolio sequence; no historical claim',
  },
);
for (const [id, years] of [
  ['CRISIS-DOTCOM', [2000, 2001, 2002]],
  ['CRISIS-2008', [2008]],
]) {
  add(
    id,
    'M11.2',
    '9.3 / 11.3',
    {
      years,
      allocation: { us_stocks: 0.4, us_bonds: 0.6, usd_cash: 0 },
      reference_rows: 'pending M03 raw-source import',
      amplified: false,
    },
    null,
    {
      oracle_kind: 'conditional',
      arithmetic_status: 'OPEN: annual historical rows not imported',
      source_gate_ids: ['DATA-HISTORY'],
      manual_instructions: [
        'Open and cite the raw annual stock/bond/cash returns. Compute 40/60 calendar portfolio returns and compounded result independently; then compare full engine with eligible losses/settlements. Do not replace annual portfolio return with equity peak-to-trough decline.',
      ],
    },
  );
}

for (const [id, step, inputs, expected, instructions] of [
  [
    'CONFIG-ROUNDTRIP',
    'M02.3',
    { source_choices: ['upload', 'builder'], fixture: 'spec-example.toml' },
    {
      same_normalized_hash: true,
      notes_ids_overrides_preserved: true,
      no_config_requests: true,
    },
    'Download, inspect, reload/re-upload; compare normalized objects and hashes; inspect Network and storage.',
  ],
  [
    'CONFIG-INVALID',
    'M02.1',
    {
      bad_keys: [
        'unknown',
        'schema_version=999',
        'seed=-1',
        'n_paths=100001',
        'nan',
      ],
      file_limit_bytes: 2097152,
    },
    {
      run_allowed: false,
      current_draft_preserved_on_bad_import: true,
      field_paths_visible: true,
    },
    'Try each invalid input separately; record precise field or syntax/size error and unchanged current draft.',
  ],
  [
    'DRAFT-GATES',
    'M02.2',
    { kind: 'household', B_status: 'unresolved', required_blank: true },
    { editable: true, downloadable: true, runnable: false },
    'Build/export/re-import an incomplete household; confirm blank stays omitted and never becomes zero.',
  ],
  [
    'WORKER-TRANSFER',
    'M01.3',
    { float64_values: [1, 2, 3] },
    { returned_values: [1, 2, 3], sender_byte_length_after_transfer: 0 },
    'Transfer the buffer in dev/production on both browsers; inspect detached sender and returned data.',
  ],
  [
    'RUN-REPRO',
    'M09.3',
    {
      seed: 42,
      path_counts: [20000, 21000],
      worker_counts: [1, 4],
      chunk_sizes: [1, 128, 257],
    },
    {
      same_path_prefix: true,
      same_discrete_decisions: true,
      same_browser_money_exact: true,
      cross_browser_money_tolerance: 0.01,
    },
    'Compare complete path hashes and summaries by path ID; vary scheduling, then edit draft and replay saved request.',
  ],
  [
    'RUN-CANCEL',
    'M09.4',
    { cancel_then_new_run: true, late_old_message: true },
    {
      canceled_result_not_promoted: true,
      new_run_unchanged: true,
      no_partial_kpis: true,
    },
    'Cancel a production job, immediately run another; inject late old messages in harness and check manifest/run ID.',
  ],
  [
    'RUN-FAIL',
    'M09.4',
    { invalid_path_id: 7, invalid_year: 2028 },
    { whole_job_failed: true, partial_success_probability: null },
    'Force invalid factor in one path, check whole-run failure and labeled prior completed run.',
  ],
  [
    'RUN-IMMUTABLE',
    'M10.3',
    { completed_config_budget: 250000, later_draft_budget: 300000 },
    { replay_uses_completed_budget: 250000, baseline_unmodified: true },
    'Complete/pin run, edit draft; replay/export both snapshots and compare manifest hashes.',
  ],
  [
    'PERFORMANCE',
    'M11.3',
    {
      n_paths: 20000,
      horizon: 52,
      chart_fields: 8,
      hardware: 'Apple M4 Pro',
      browsers: ['Chrome', 'Safari'],
    },
    {
      chart_bytes: 33280000,
      retained_financial_array_bytes_max_exclusive: 50000000,
    },
    'Record exact production versions, elapsed time, peak memory, responsiveness/cancel behavior. M00 arithmetic is not a browser benchmark.',
  ],
  [
    'PRIVACY-OFFLINE',
    'M11.4',
    {
      production_static: true,
      warmed_worker_assets: true,
      network_disabled_during_run: true,
    },
    {
      config_post_count: 0,
      external_reference_requests_during_compute: 0,
      scenario_file_dependency: false,
    },
    'Build without fixture/config files, warm app/workers, turn network off, run/upload/download/reload; inspect Network and storage.',
  ],
  [
    'HOUSEHOLD-GATE',
    'M11.5',
    {
      financial_gross_usd: 5300000,
      property_value_usd: 2000000,
      property_loans_usd: 731000,
      B_green_card: true,
    },
    {
      runnable_while_applicable_facts_open: false,
      financial_gross_usd: 5300000,
      property_equity_usd: 1269000,
    },
    'Resolve listed facts and sources or report OPEN; do not present example/NRA/control outputs as actual household forecast.',
  ],
])
  add(id, step, '3 / 8 / 9 / 11', inputs, expected, {
    oracle_kind: 'structural',
    legal_status:
      'NOT APPLICABLE: workflow (household/source gates remain open)',
    manual_instructions: [instructions],
  });
