export const LEDGER_FIELDS =
  `year age_A age_B alive_A alive_B fx home_index usd_index spend_plan_cny spend_cny medical_cny medical_base_cny medical_shock_cny one_time_cny included_consumption_cny additional_consumption_cny rent_cash_usd rmd_usd portfolio_return withdraw_usd withdraw_cny convert_usd tax_us_A tax_us_B tax_cn_A tax_cn_B liquid_usd cny_cash_cny property_equity_usd net_worth_cny net_worth_cny_real liquid_cny_real net_worth_usd_real shortfall_cny forced_sale sale_failed fx_quota_flag`.split(
    ' ',
  );
export const CHART_FIELDS =
  `alive_A alive_B net_worth_cny_real liquid_cny_real net_worth_usd_real net_worth_cny shortfall_cny`.split(
    ' ',
  );
export const FLOAT_FIELDS =
  `terminal_net_worth_cny_real terminal_net_worth_usd_real net_worth_at_A85_cny_real net_worth_at_A85_usd_real terminal_income_due_cny_real terminal_income_due_usd_real terminal_signed_net_cny_real terminal_net_heirs_cny_real terminal_net_heirs_usd_real lifetime_income_tax_cash_cny_real lifetime_income_tax_cash_usd_real initial_included_recurring_cny initial_health_cny portfolio_growth_factor terminal_fx terminal_home_index terminal_usd_index`.split(
    ' ',
  );
export const INT_FIELDS =
  `first_depletion_t terminal_t active_years fx_quota_years portfolio_return_years`.split(
    ' ',
  );
export const FLAG_FIELDS = `depleted forced_sale sale_failed`.split(' ');
export const LI = Object.fromEntries(LEDGER_FIELDS.map((k, i) => [k, i])),
  FI = Object.fromEntries(FLOAT_FIELDS.map((k, i) => [k, i])),
  II = Object.fromEntries(INT_FIELDS.map((k, i) => [k, i])),
  BI = Object.fromEntries(FLAG_FIELDS.map((k, i) => [k, i]));
export const LEDGER_REPORT_VERSION = 'retire-ledger-report-v1';
export const LEDGER_REPORT_FIELDS = [
  'starting_liquid_usd',
  'starting_net_worth_cny',
  'spend_excluding_medical_cny',
  'medical_total_cny',
  'annual_investment_return',
] as const;
