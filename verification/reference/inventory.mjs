// Development documentation inventory. This is not the future config parser/validator.
import { descriptionFor } from './field-help.mjs';
export const taxTables = {
  base_year: 2026,
  us: {
    rates: [0.1, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37],
    brackets: {
      single: [0, 12400, 50400, 105700, 201775, 256225, 640600],
      mfs: [0, 12400, 50400, 105700, 201775, 256225, 384350],
    },
    std_deduction: { single: 16100, mfs: 16100 },
    add_65: { married: 1650, single: 2050 },
    senior_deduction: {
      amount: 6000,
      last_year: 2028,
      phaseout_start_single: 75000,
      phaseout_rate: 0.06,
    },
    ltcg_rates: [0, 0.15, 0.2],
    ltcg_0_top: { single: 49450, mfs: 49450 },
    ltcg_15_top: { single: 545500, mfs: 306850 },
    unrecaptured_1250_max: 0.25,
    cap_loss_limit: { single: 3000, mfs: 1500 },
    niit_rate: 0.038,
    niit_threshold: { single: 200000, mfs: 125000 },
    ss_base: { single: [25000, 34000], mfs: [0, 0] },
    passive_allowance: 25000,
    passive_phaseout: [100000, 150000],
    early_penalty: 0.1,
    depreciation_years: 27.5,
    rmd_start_age: { before_1960: 73, from_1960: 75 },
    uniform_lifetime: Object.fromEntries(
      [
        27.4, 26.5, 25.5, 24.6, 23.7, 22.9, 22, 21.1, 20.2, 19.4, 18.5, 17.7,
        16.8, 16, 15.2, 14.4, 13.7, 12.9, 12.2, 11.5, 10.8, 10.1, 9.5, 8.9, 8.4,
        7.8, 7.3, 6.8, 6.4, 6, 5.6, 5.2, 4.9, 4.6, 4.3, 4.1, 3.9, 3.7, 3.5, 3.4,
        3.3, 3.1, 3, 2.9, 2.8, 2.7, 2.5, 2.3, 2,
      ].map((v, i) => [String(72 + i), v]),
    ),
    nra: {
      dividends: 0.1,
      interest: 0,
      cap_gains: 0,
      own_pension: 0,
      social_security: 0.255,
    },
    estate: {
      citizen_exclusion: 15000000,
      nra_credit: 13000,
      brackets: [
        [0, 0.18],
        [10000, 0.2],
        [20000, 0.22],
        [40000, 0.24],
        [60000, 0.26],
        [80000, 0.28],
        [100000, 0.3],
        [150000, 0.32],
        [250000, 0.34],
        [500000, 0.37],
        [750000, 0.39],
        [1000000, 0.4],
      ],
    },
  },
  cn: {
    flat_rate: 0.2,
    rent_deduction: 0.2,
    basic_deduction: 60000,
    comprehensive: [
      [0, 0.03],
      [36000, 0.1],
      [144000, 0.2],
      [300000, 0.25],
      [420000, 0.3],
      [660000, 0.35],
      [960000, 0.45],
    ],
    ftc_carryforward_years: 5,
  },
};

export const marketDefaults = {
  sample_start: 1928,
  sample_end: 2025,
  block_mean_years: 8,
  outlook_shift: 0,
  home_cpi_mean: 0.017,
  home_cpi_phi: 0.3,
  home_cpi_sigma: 0.018,
  home_cpi_start: 0.001,
  fx_spot: 6.692,
  fx_fair_value: 6.692,
  fx_adjust_speed: 0.15,
  fx_sigma: 0.042,
  fx_real_trend: 0,
  fx_mode: 'ppp',
  fx_drift: 0,
  fx_spread: 0.003,
  fx_quota_usd_per_person: 50000,
  medical_excess_inflation: 0.02,
  income_yield_us_stocks: 0.01336,
  income_yield_us_bonds: 0.051,
};

export const fields = [];
function field(path, type, unit, section, options = {}) {
  const first = path.split('.')[0];
  const sectionName =
    {
      simulation: 'Simulation',
      market: 'Market / CPI / FX',
      people: 'People',
      social_security: 'Social Security',
      medical: 'Budget',
      budget: 'Budget',
      spending: 'Recurring spending',
      one_time: 'One-time costs',
      spending_rule: 'Spending flexibility',
      accounts: 'Accounts',
      withdrawals: 'Withdrawals',
      properties: 'Properties',
      tax: 'Tax switches',
      tax_tables: 'Tax overrides',
    }[first] || 'Schema';
  fields.push({
    path,
    type,
    unit,
    spec_section: section,
    builder_section: sectionName,
    builder_control: type.startsWith('enum')
      ? 'select'
      : type === 'boolean'
        ? 'checkbox'
        : type.includes('[]')
          ? 'editable list'
          : type === 'string'
            ? 'text'
            : 'numeric',
    internal_path: path,
    serialize_path: path,
    omission: 'required; blank stays omitted and blocks Run',
    default: null,
    default_kind: 'none',
    constraints:
      'Strict known key; finite numbers; integers must be safe integers; see spec §9.2.',
    gates: [],
    ...options,
  });
}
function optional(path, type, unit, section, defaultValue, options = {}) {
  field(path, type, unit, section, {
    omission: 'optional; omission uses declared default',
    default: defaultValue,
    default_kind: 'documented',
    ...options,
  });
}
field('schema_version', 'integer', 'version', '9.2', {
  constraints: 'Exactly 1; missing requires legacy migration preview.',
});
field('simulation.start_year', 'integer', 'calendar year', '3.2');
optional('simulation.n_paths', 'integer', 'paths', '9.2', 5000, {
  constraints: '1...100000 inclusive; exact; memory preflight may reject.',
});
optional('simulation.seed', 'integer', 'uint32', '9.2', 42, {
  constraints: '0...4294967295 inclusive.',
});
optional('simulation.max_age', 'integer', 'age', '9.2', 110, {
  constraints:
    'At least the younger start age (or the single start age); everyone stays alive through that max_age year; memory preflight bounds horizon.',
});

const rate = 'annual decimal rate';
for (const [key, value] of Object.entries(marketDefaults)) {
  const type =
    key === 'fx_mode'
      ? 'enum ppp|drift'
      : ['sample_start', 'sample_end'].includes(key)
        ? 'integer'
        : 'number';
  const unit = key.startsWith('sample_')
    ? 'calendar year'
    : key === 'block_mean_years'
      ? 'years'
      : key === 'fx_mode'
        ? 'mode'
        : key.includes('quota')
          ? 'USD/person/year'
          : ['fx_spot', 'fx_fair_value'].includes(key)
            ? 'CNY/USD'
            : key === 'fx_adjust_speed'
              ? 'dimensionless'
              : rate;
  optional(
    `market.${key}`,
    type,
    unit,
    key.startsWith('cn_') ? '4.4' : key.startsWith('fx_') ? '4.5' : '4.3–4.6',
    value,
  );
}
const constraints = {
  sample_start: 'Within active history; window >=10 years.',
  sample_end: 'Within active history; >=sample_start+9.',
  block_mean_years: '>=1.',
  outlook_shift: '-0.1...0.1; added to sampled US stock/bond returns.',
  fx_spot: '>0.',
  fx_fair_value: '>0.',
  fx_adjust_speed: '0...1.',
  fx_drift: '-0.2...0.2; annual LOG change, not simple percentage.',
  fx_spread: '0 <= spread <1; conversion denominators strictly positive.',
  home_cpi_sigma: '0...0.5; generated CPI must exceed -1.',
  fx_sigma: '0...0.5.',
  home_cpi_phi: '-0.5...0.5 under the v1 spec rate range.',
  fx_quota_usd_per_person: 'Nonnegative nominal USD; not indexed.',
};
for (const f of fields)
  if (f.path.startsWith('market.') && constraints[f.path.slice(7)])
    f.constraints = constraints[f.path.slice(7)];
for (const f of fields)
  if (['market.home_cpi_sigma', 'market.fx_sigma'].includes(f.path))
    f.unit = f.path.includes('fx') ? 'annual log-FX SD' : 'annual CPI SD';
for (const f of fields)
  if (f.path === 'market.income_yield_us_stocks')
    f.constraints =
      '0...1; NYU 2025 dividends / beginning-year S&P level = 0.01336; splits total return, does not add return.';
for (const f of fields)
  if (f.path === 'market.income_yield_us_bonds')
    f.constraints =
      '0...1; FRED DGS10 2026-10-15 = 0.051; par Treasury income proxy, not portfolio coupon or extra return.';
for (const f of fields)
  if (f.path === 'market.home_cpi_phi') f.unit = 'persistence factor';
for (const f of fields)
  if (['market.fx_drift', 'market.fx_real_trend'].includes(f.path))
    f.unit = 'annual log change';

field('people.domicile', 'enum US|China', 'classification', '6.4', {
  gates: ['H-STATUS', 'L-CN-SIX-YEAR'],
  constraints:
    'One domicile country for the whole household; drives China-tax routing for every member.',
});
for (const person of ['A', 'B']) {
  const p = `people.${person}`;
  field(`${p}.birth_year`, 'integer', 'calendar year', '5.1', {
    gates: ['H-AGES'],
    constraints: 'Start age 18...100; actual 1986 annualized placeholder.',
  });
  optional(`${p}.sex`, 'enum M|F', 'descriptive', '5.1', null, {
    omission:
      'retired from the UI; accepted when present but no effect on calculations',
    default_kind: 'none',
    constraints:
      'M=male, F=female; lifespan uses the same fixed horizon for the household.',
  });
  optional(`${p}.us_citizen`, 'boolean', 'classification', '1.2', false, {
    gates: ['H-STATUS', 'L-RESIDENCY'],
    omission: 'unchecked means non-citizen; explicit answer not required',
    constraints: 'Citizens are US tax residents; non-citizens use NRA branch.',
  });
  field(
    `${p}.us_income_tax_status`,
    'enum resident|nonresident|unresolved',
    'classification',
    '9.2',
    {
      gates: ['H-STATUS', 'L-RESIDENCY'],
      omission:
        'derived from us_citizen when omitted; explicit contradictions still block Run',
      constraints:
        'Citizen/resident or noncitizen/nonresident supported; resident alien cannot use NRA.',
    },
  );
  optional(`${p}.pension.annual`, 'number', 'USD/year today', '5.4', 0, {
    gates: ['H-PENSION'],
    constraints:
      'Annual pension or annuity payout in today’s USD; 0 means none.',
  });
  optional(`${p}.pension.start_age`, 'integer', 'age', '5.4', 65, {
    gates: ['H-PENSION'],
    constraints: 'First payout year is the year this age is reached; 0...120.',
  });
  optional(`${p}.pension.cola`, 'boolean', 'classification', '5.4', true, {
    gates: ['H-PENSION'],
    constraints: 'On follows US CPI; off pays the same nominal dollars yearly.',
  });
}

for (const [k, v] of Object.entries({
  age_growth: 0.04,
  shock_enabled: true,
  shock_prob_at_60: 0.02,
  shock_prob_doubling_years: 8,
  shock_median: 50000,
})) {
  optional(
    `medical.${k}`,
    typeof v === 'boolean'
      ? 'boolean'
      : typeof v === 'string'
        ? 'enum included|additional'
        : 'number',
    k === 'shock_median'
      ? 'household CNY/USD today'
      : k === 'shock_prob_doubling_years'
        ? 'years'
        : k === 'age_growth'
          ? rate
          : 'dimensionless',
    '5.3',
    v,
    {
      gates: ['H-MEDICAL'],
      constraints:
        k === 'shock_prob_at_60'
          ? '0...1.'
          : k === 'shock_prob_doubling_years'
            ? '>0.'
            : 'Nonnegative money; valid growth factors.',
    },
  );
}
for (const [k, v] of Object.entries({
  enabled: false,
  start_age: 85,
  monthly: 0,
  real_growth: 0,
})) {
  const type =
    typeof v === 'boolean'
      ? 'boolean'
      : k === 'start_age'
        ? 'integer'
        : 'number';
  const unit =
    k === 'start_age'
      ? 'age'
      : k === 'monthly'
        ? 'household CNY/USD/month today'
        : k === 'real_growth'
          ? 'annual decimal rate'
          : 'setting';
  optional(`medical.late_life_care.${k}`, type, unit, '5.3', v, {
    gates: ['H-MEDICAL'],
    constraints:
      'Always additional medical expense; starts at selected age and continues through the planning horizon; monthly>=0; real growth in[-.5,.5]; follows medical price index.',
  });
}
optional('budget.annual', 'number', 'household CNY/USD/year today', '5.2', 0, {
  gates: ['H-BUDGET'],
  constraints:
    '>=0; total base annual household-currency budget. Ordinary spending is annual minus included_health, indexed by the domicile price index.',
});
optional(
  'budget.included_health',
  'number',
  'household CNY/USD/year today',
  '5.2',
  0,
  {
    gates: ['H-MEDICAL'],
    constraints:
      '>=0; single annual base medical budget for the household; included in annual once, before optional shocks/care.',
  },
);
optional('budget.flex_enabled', 'boolean', 'classification', '5.2', false, {
  gates: ['H-BUDGET'],
  constraints: 'On lets the non-medical budget flex with portfolio years.',
});
optional('budget.flex_cut', 'number', 'fraction', '5.2', 0.15, {
  gates: ['H-BUDGET'],
  constraints: '0...1; max non-medical spend cut after a down year.',
});
optional('budget.flex_raise', 'number', 'fraction', '5.2', 0.15, {
  gates: ['H-BUDGET'],
  constraints: '0...1; max non-medical spend raise after an up year.',
});

field('one_time[].name', 'string', 'label', '5.2');
field('one_time[].year', 'integer', 'calendar year', '5.2');
field('one_time[].amount', 'number', 'currency today', '5.2');
field('one_time[].currency', 'enum CNY|USD', 'currency', '5.2');
field('accounts[].name', 'string', 'account reference', '5.5', {
  constraints:
    'Fixed identifier: brokerage, after_tax or pre_tax; all three accounts required in that order.',
});
field('accounts[].type', 'enum brokerage|pre_tax|after_tax', 'wrapper', '5.5', {
  gates: ['H-HOLDINGS', 'H-RETIREMENT'],
  constraints:
    'Fixed per position: brokerage, then after_tax, then pre_tax; matches name.',
});
field('accounts[].balance', 'number', 'USD, current nominal', '5.5', {
  gates: ['H-HOLDINGS'],
});
for (const k of ['us_stocks', 'us_bonds', 'usd_cash']) {
  optional(`accounts[].allocation.${k}`, 'number', 'fraction', '5.5', 0, {
    omission:
      'optional asset key=0; allocation required for all three accounts',
    constraints: '>=0; subset of three keys; sum=1 +/-1e-6.',
  });
}
optional('accounts[].rule_of_55', 'boolean', 'access exception', '5.6', false, {
  omission: 'optional pre-tax only; forbidden for other types',
  gates: ['H-RETIREMENT', 'L-RMD'],
  constraints:
    'Declared qualifying condition; verify exception and penalty treatment.',
});
optional(
  'accounts[].allow_early_trad',
  'boolean',
  'access policy',
  '5.6',
  false,
  {
    omission: 'optional pre-tax only; forbidden for other types',
    gates: ['H-RETIREMENT'],
    constraints:
      'Declared early access; verify exception and penalty treatment.',
  },
);
optional(
  'withdrawals.last_resort_property_sale',
  'boolean',
  'sale policy',
  '5.7',
  true,
  {
    gates: ['H-PROPERTY'],
    constraints:
      'Omission uses the declared default; unchecking disables last-resort sales.',
  },
);

optional(
  'properties[].label',
  'string',
  'label/reference/provenance',
  '5.8',
  null,
  {
    gates: ['H-PROPERTY'],
    omission: 'optional; omit to leave the property unnamed',
    default_kind: 'none',
    constraints: 'Free text for display only; never affects the simulation.',
  },
);

const propertyDefault = {
  share_A: 0.5,
  land_share: 0.2,
  rent_real_growth: 0,
  selling_cost: 0.06,
  sell_year: 0,
  proceeds_account: 'brokerage',
};
for (const k of [
  'id',
  'share_A',
  'value',
  'cost_basis',
  'land_share',
  'depreciation_taken',
  'mortgage_balance',
  'mortgage_rate',
  'mortgage_years_left',
  'rent_monthly',
  'maintenance_annual',
  'property_tax_annual',
  'insurance_annual',
  'hoa_monthly',
  'rent_real_growth',
  'selling_cost',
  'strategy',
  'sell_year',
  'proceeds_account',
]) {
  const type = ['id', 'proceeds_account'].includes(k)
    ? 'string'
    : k === 'strategy'
      ? 'enum hold|sell_year'
      : ['mortgage_years_left', 'sell_year'].includes(k)
        ? 'integer'
        : 'number';
  const unit =
    k === 'mortgage_years_left'
      ? 'years'
      : k === 'sell_year'
        ? 'calendar year'
        : [
              'value',
              'cost_basis',
              'depreciation_taken',
              'mortgage_balance',
            ].includes(k)
          ? 'USD current nominal'
          : ['rent_monthly', 'hoa_monthly'].includes(k)
            ? 'USD/month today'
            : [
                  'maintenance_annual',
                  'property_tax_annual',
                  'insurance_annual',
                ].includes(k)
              ? 'USD/year today'
              : type === 'string'
                ? 'label/reference/provenance'
                : k === 'share_A' || k === 'land_share' || k === 'selling_cost'
                  ? 'fraction'
                  : rate;
  const opts = {
    gates: ['H-PROPERTY'],
    constraints:
      k === 'id'
        ? 'Unique persisted nonempty ID; US real property only, citizen treatment for all owners.'
        : k === 'proceeds_account'
          ? 'Existing fixed account name.'
          : 'See spec §§5.8/9.2; money>=0, valid factors, fractions in[0,1].',
  };
  if (k === 'strategy') opts.unit = 'sale strategy';
  if (k === 'share_A')
    opts.omission =
      'derived from household size when omitted (1 solo, 0.5 joint); hidden from the Builder';
  if (Object.hasOwn(propertyDefault, k))
    optional(`properties[].${k}`, type, unit, '5.8', propertyDefault[k], opts);
  else field(`properties[].${k}`, type, unit, '5.8', opts);
}
for (const f of fields)
  if (f.path.startsWith('market.')) {
    const group = f.path.startsWith('market.fx_')
      ? 'FX'
      : f.path.startsWith('market.home_cpi_') ||
          f.path === 'market.medical_excess_inflation'
        ? 'Inflation'
        : 'Markets';
    f.builder_section = 'Markets, inflation & FX / ' + group;
  }
for (const f of fields) f.description = descriptionFor(f.path);

export const containers = {
  people:
    'Required A object, optional B object, and required household domicile.',
  market:
    'Optional documented algorithm defaults; US series use historical rows directly.',
  one_time: 'Optional empty list.',
  properties: 'Optional empty list.',
  accounts:
    'Fixed three in withdraw order: brokerage, after_tax, pre_tax; property proceeds reference validation still applies.',
};

export const ledgerFields =
  `year age_A age_B alive_A alive_B fx home_index usd_index spend_plan_cny flex_mult spend_cny medical_cny medical_base_cny medical_shock_cny one_time_cny included_consumption_cny additional_consumption_cny budget_excess_cny ss_usd rent_cash_usd rmd_usd portfolio_return withdraw_usd withdraw_cny convert_usd tax_us_A tax_us_B tax_cn_A tax_cn_B state_tax estate_tax tax_paid_usd tax_paid_cny tax_refund_usd tax_refund_cny tax_unpaid_usd tax_unpaid_cny tax_receivable_usd tax_receivable_cny ftc_projected_cny ftc_used_cny ftc_adjustment_cny liquid_usd cny_cash_cny property_equity_usd net_worth_cny net_worth_cny_real liquid_cny_real net_worth_usd_real shortfall_cny forced_sale sale_failed fx_quota_flag`.split(
    ' ',
  );
export const chartFields =
  `alive_A alive_B net_worth_cny_real liquid_cny_real net_worth_usd_real net_worth_cny flex_mult shortfall_cny`.split(
    ' ',
  );
export const summaryFloatFields =
  `terminal_net_worth_cny_real terminal_net_worth_usd_real net_worth_at_A85_cny_real net_worth_at_A85_usd_real terminal_assets_cny_real terminal_assets_usd_real terminal_income_due_cny_real terminal_income_due_usd_real terminal_estate_due_cny_real terminal_confirmed_refunds_cny_real terminal_confirmed_refunds_usd_real terminal_conditional_credits_cny_real terminal_conditional_credits_usd_real terminal_signed_net_cny_real terminal_net_heirs_cny_real terminal_net_heirs_usd_real terminal_estate_shortfall_cny_real lifetime_income_tax_cash_cny_real lifetime_income_tax_cash_usd_real lifetime_estate_tax_cash_cny_real initial_included_recurring_cny initial_health_cny cumulative_budget_excess_cny_real flex_mult_sum portfolio_growth_factor terminal_fx terminal_home_index terminal_usd_index`.split(
    ' ',
  );
export const summaryIntFields =
  `first_depletion_t terminal_t active_years fx_quota_years flex_below_plan_years portfolio_return_years death_year_A death_year_B`.split(
    ' ',
  );
export const summaryFlagFields =
  `depleted forced_sale sale_failed ever_flex_floor ever_budget_excess estate_shortfall terminal_conditional_credit`.split(
    ' ',
  );
export const layout = {
  version: 'retire-results-v1',
  ledger_fields: ledgerFields,
  chart_fields: chartFields,
  summary_float64_fields: summaryFloatFields,
  summary_int32_fields: summaryIntFields,
  summary_uint8_fields: summaryFlagFields,
  temporary_market_band_fields: {
    fx: 'Float64 [path,t], T+1 observations',
    home_cpi: 'Float64 [path,t], T observations',
    usd_cpi: 'Float64 [path,t], T observations',
  },
  temporary_market_samples_bytes_20000_52: 20000 * (3 * 52 + 1) * 8,
  indexing: 'path-major, then year, then field; half-open chunk ranges',
  sentinels: {
    inactive_chart_or_ledger: 'NaN',
    absent_depletion_t: -1,
    absent_monetary_cohort: 'NaN',
    empty_aggregate_cohort: null,
  },
  retained_bytes_per_path_52:
    52 * chartFields.length * 4 +
    summaryFloatFields.length * 8 +
    summaryIntFields.length * 4 +
    summaryFlagFields.length,
  retained_bytes_20000_paths_52:
    20000 *
    (52 * chartFields.length * 4 +
      summaryFloatFields.length * 8 +
      summaryIntFields.length * 4 +
      summaryFlagFields.length),
  execution_array_budget_bytes: 512 * 1024 * 1024,
};

// Replay reporting adds opening balances, medical totals and all-financial-account return; core buffers retain their original layout.
layout.ledger_report_version = 'retire-ledger-report-v1';
layout.replay_report_fields = [
  'starting_liquid_usd',
  'starting_net_worth_cny',
  'spend_excluding_medical_cny',
  'medical_total_cny',
  'annual_investment_return',
];
layout.csv_fields = [
  ...layout.ledger_fields.slice(0, 3),
  ...layout.replay_report_fields,
  ...layout.ledger_fields.slice(3),
];
