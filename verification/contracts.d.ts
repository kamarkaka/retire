/** Current model contracts with v1 result-layout compatibility. No browser/server dependency. */
import type { MarketDataSnapshot } from '../src/reference/market-data.ts';
export type PersonId = "A" | "B";
export type Currency = "USD" | "CNY";
export type AssetClass = "us_stocks" | "us_bonds" | "usd_cash";
export type USSeries = AssetClass | "us_cpi" | "us_home";
export type TaxStatus = "resident" | "nonresident" | "unresolved";
export type FilingStatus = "single" | "mfs";
export type Country = "US" | "CN";
export type DeepPartial<T> = T extends readonly (infer U)[]
  ? DeepPartial<U>[]
  : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

export interface SimulationConfig {
  start_year: number;
  n_paths: number;
  seed: number;
  max_age: number;
}
export interface MarketConfig {
  sample_start: number;
  sample_end: number;
  block_mean_years: number;
  home_cpi_mean: number;
  home_cpi_phi: number;
  home_cpi_sigma: number;
  home_cpi_start: number;
  fx_spot: number;
  fx_fair_value: number;
  fx_adjust_speed: number;
  fx_sigma: number;
  fx_real_trend: number;
  fx_mode: "ppp" | "drift";
  fx_drift: number;
  fx_spread: number;
  fx_quota_usd_per_person: number;
  medical_excess_inflation: number;
  income_yield_us_stocks: number;
  income_yield_us_bonds: number;
}
export interface PersonConfig {
  birth_year: number;
  sex?: "M" | "F"; // Descriptive only; everyone uses the fixed planning horizon.
  us_citizen: boolean;
  us_income_tax_status: TaxStatus;
}
export interface HouseholdPeople {
  domicile: "US" | "China"; // One domicile country for the whole household.
  A: PersonConfig;
  B?: PersonConfig; // Absent = one-person household.
}
export interface SavingsAccountConfig extends CommonAccountConfig {
  type: "cash_usd";
  interest_rate?: number; // Annual decimal rate; omitted = observed 3-month T-bill return each year.
}
export interface OneTimeConfig {
  name: string;
  year: number;
  amount: number;
  currency: Currency;
}
export interface CommonAccountConfig {
  name: string;
  owner: PersonId | "joint";
  share_A: number;
  balance: number;
}
export interface BrokerageAccountConfig extends CommonAccountConfig {
  type: "brokerage";
  allocation: Partial<Record<AssetClass, number>>;
}
export interface RetirementAccountConfig extends CommonAccountConfig {
  type: "pre_tax" | "after_tax";
  owner: PersonId;
  allocation: Partial<Record<AssetClass, number>>;
  rule_of_55?: boolean; // trad only; omitted = false; roth rejects this key.
  allow_early_trad?: boolean; // trad only; omitted = false; roth rejects this key.
}
export interface CnyAccountConfig extends CommonAccountConfig {
  type: "cash_cny";
}
export type AccountConfig = BrokerageAccountConfig | RetirementAccountConfig | CnyAccountConfig | SavingsAccountConfig;
export interface PropertyConfig {
  id: string; // US real property only; all owners use citizen treatment (no FIRPTA).
  share_A: number;
  value: number;
  cost_basis: number;
  land_share: number;
  depreciation_taken: number;
  mortgage_balance: number;
  mortgage_rate: number;
  mortgage_years_left: number;
  rent_monthly: number;
  maintenance_annual: number;
  property_tax_annual: number;
  insurance_annual: number;
  hoa_monthly: number;
  rent_real_growth: number;
  selling_cost: number;
  state_tax_rate: number;
  strategy: "hold" | "sell_year" | "sell_when_liquid_below";
  sell_year: number;
  sell_liquid_years: number;
  proceeds_account: string;
}
export interface TaxTables {
  base_year: number;
  us: {
    rates: number[];
    brackets: Record<FilingStatus, number[]>;
    std_deduction: Record<FilingStatus, number>;
    add_65: { married: number; single: number };
    senior_deduction: {
      amount: number; last_year: number; phaseout_start_single: number; phaseout_rate: number;
    };
    ltcg_rates: [number, number, number];
    ltcg_0_top: Record<FilingStatus, number>;
    ltcg_15_top: Record<FilingStatus, number>;
    unrecaptured_1250_max: number;
    cap_loss_limit: Record<FilingStatus, number>;
    niit_rate: number;
    niit_threshold: Record<FilingStatus, number>;
    ss_base: Record<FilingStatus, [number, number]>;
    passive_allowance: number;
    passive_phaseout: [number, number];
    early_penalty: number;
    depreciation_years: number;
    rmd_start_age: { before_1960: number; from_1960: number };
    uniform_lifetime: Record<string, number>; // strict integer age keys 72...120; 120 covers 120+.
    nra: {
      dividends: number; interest: number; cap_gains: number;
      own_pension: number; social_security: number;
    };
    estate: { citizen_exclusion: number; nra_credit: number; brackets: [number, number][] };
  };
  cn: {
    flat_rate: number; rent_deduction: number; basic_deduction: number;
    comprehensive: [number, number][]; ftc_carryforward_years: number;
  };
}
export interface ScenarioConfig {
  schema_version: 1;
  simulation: SimulationConfig;
  market: MarketConfig;
  people: HouseholdPeople;
  medical: {
    age_growth: number; shock_enabled: boolean;
    shock_prob_at_60: number; shock_prob_doubling_years: number;
    shock_median: number;
    late_life_care: {
      enabled: boolean; start_age: number;
      monthly: number; real_growth: number;
    };
  };
  budget: { annual: number; included_health: number };
  one_time: OneTimeConfig[];
  accounts: AccountConfig[];
  withdrawals: {
    last_resort_property_sale: boolean; surplus_account: string;
  };
  properties: PropertyConfig[];
}
export type DraftScenario = DeepPartial<ScenarioConfig>;
declare const runnableBrand: unique symbol;
export type RunnableScenario = Readonly<ScenarioConfig> & { readonly [runnableBrand]: true };
export interface FieldIssue {
  code: "syntax" | "unknown_key" | "unsupported_version" | "missing" | "range"
    | "reference" | "unsupported_status" | "source_gate" | "domain";
  path: string;
  message: string;
  line?: number;
  column?: number;
}
export type Result<T> = { ok: true; value: T } | { ok: false; issues: FieldIssue[] };
export interface SourceGate {
  id: string;
  status: "unverified" | "verified";
  edition: string | null;
  checked_at: string | null;
  supported_conditions: string[];
  evidence: string[];
}
export interface HistoricalRow {
  year: number;
  us_stocks: number; us_bonds: number; usd_cash: number; us_cpi: number; us_home: number;
}
export interface PublicReferenceBundle {
  history: readonly HistoricalRow[];
  tax_tables: Readonly<TaxTables>;
  sources: readonly SourceGate[];
  market_data?: Readonly<MarketDataSnapshot>;
  versions: { history: string; calibration: string; tax_tables: string; legal_sources: string; market_data?: string };
  hashes: { history: string; calibration: string; tax_tables: string; legal_sources: string; market_data?: string };
}
export interface ScientificManifest {
  manifest_version: "retire-manifest-v1";
  canonical_version: "retire-canonical-v1";
  schema_version: 1;
  model_version: string;
  rng_version: "retire-rng-v1";
  draw_version: "retire-draws-v3";
  longevity_policy: "both-alive-to-younger-max-age";
  cny_cash_policy: "no-interest";
  stopping_policy: "younger-max-age-or-nonpositive-net-worth";
  result_layout_version: "retire-results-v1";
  ledger_report_version: "retire-ledger-report-v1";
  build_version: string;
  scenario_sha256: string;
  effective_tax_tables_sha256: string;
  reference_versions: PublicReferenceBundle["versions"];
  reference_hashes: PublicReferenceBundle["hashes"];
  seed: number;
  n_paths: number;
  start_year: number;
  start_age_A: number;
  start_age_B: number; // -1 for a one-person household.
  horizon: number;
  property_stream_ids: string[]; // sorted unique IDs for compatibility; original config order preserved.
  verified_source_ids: readonly string[];
}
export interface ExecutionMetadata {
  run_id: string;
  browser: string;
  os: string;
  hardware_concurrency: number;
  worker_count: number;
  chunk_size: number;
  started_at: string;
  finished_at?: string;
  elapsed_ms?: number;
  memory_estimate_bytes: number;
  memory_estimate_scope: string;
}
export interface RunRequest {
  scenario: RunnableScenario;
  effective_tax_tables: Readonly<TaxTables>;
  manifest: Readonly<ScientificManifest>;
}
export interface MarketPath {
  us_stocks: Float64Array; us_bonds: Float64Array; usd_cash: Float64Array;
  us_cpi: Float64Array; us_home: Float64Array; home_cpi: Float64Array;
  fx: Float64Array; usd_index: Float64Array; home_index: Float64Array; home_medical_index: Float64Array; usd_medical_index: Float64Array;
}
export interface PathDraws {
  medical_occurrence: Record<PersonId, Float64Array>;
}
export type IncomeField = "interest_us" | "dividends" | "qualified_dividends"
  | "nra_dividends" | "nra_exempt_interest" | "cap_gain"
  | "trad_own" | "trad_inherited" | "roth" | "early_trad" | "ss" | "rental_net"
  | "rent_gross" | "ordinary_property_gain" | "gross_u1250" | "ltcg_property"
  | "property_gain_cny" | "passive_released" | "state_tax";
export type IncomeLedger = Record<IncomeField, number>;
export interface CapitalNet {
  lt_gain: number; u1250_gain: number; ordinary_loss_deduction: number; loss_carryforward: number;
}
export interface SourceTaxComponent {
  id: string;
  taxpayer: PersonId;
  income_year: number;
  source_country: Country;
  category: string;
  currency: Currency;
  final_liability: number;
  credit_eligibility: "eligible" | "ineligible" | "unresolved";
  eligibility_basis: string;
  source_gate_ids: string[];
}
export interface TaxPayment {
  id: string;
  settlement_id: string;
  component_id: string;
  cash_year: number;
  currency: Currency;
  amount: number; // nonnegative, direction separated.
  kind: "withholding" | "payment" | "refund";
  eligible_retained_amount: number;
  allocation_basis: string;
}
export interface FtcVintage {
  id: string;
  taxpayer: PersonId;
  country: Country;
  income_year: number;
  payment_year: number;
  original_currency: Currency;
  original_eligible_paid: number;
  conversion_fx: number;
  eligible_cny: number;
  remaining_cny: number;
  last_usable_income_year: number;
  component_ids: string[];
  eligibility_basis: string;
}
export interface TaxSettlement {
  id: string;
  taxpayer: PersonId;
  jurisdiction: "us_federal" | "us_state" | "china" | "us_estate";
  income_year: number;
  due_year: number;
  currency: Currency;
  final_liability: number;
  projected_liability: number;
  net_cash_remitted: number;
  unpaid: number;
  confirmed_refund_receivable: number;
  conditional_credit: number;
  ftc_projected: number;
  ftc_used: number;
  ftc_adjustment: number;
  source_components: SourceTaxComponent[];
  payments: TaxPayment[];
  final_return_credit_snapshot: FtcVintage[];
}
export interface TerminalSettlement {
  year: number;
  assets_cny: number;
  income_due_cny: number;
  estate_due_cny: number;
  confirmed_refunds_cny: number;
  excluded_conditional_credits_cny: number;
  signed_net_cny: number;
  net_to_heirs_cny: number;
  estate_shortfall_cny: number;
  items: TaxSettlement[];
  beneficiary_trad_tax_included: false;
}
export interface AccountState {
  name: string;
  original_owner: PersonId | "joint";
  shares: Record<PersonId, number>;
  values: Partial<Record<AssetClass | "deposit", number>>;
  bases: Partial<Record<AssetClass, number>>;
  prior_year_end_balance: number;
}
export interface PropertyOwnerState {
  share: number; basis_usd: number;
  depreciation_taken: number; suspended_loss: number;
}
export interface PropertyState {
  id: string; held: boolean; value: number; mortgage_balance: number;
  mortgage_payment: number; property_tax_annual: number;
  owners: Record<PersonId, PropertyOwnerState>;
}
export interface HouseholdState {
  accounts: AccountState[];
  properties: PropertyState[];
  capital_loss_carryforward: Record<PersonId, number>;
  ftc_vintages: FtcVintage[];
  settlements: TaxSettlement[];
  first_depletion_t: number | null;
}
export interface PathSummaryBuffers {
  floats: Float64Array; // path-major; exact field order in result-layout.json.
  integers: Int32Array; // -1 sentinel for absent depletion; row counts, years, flags separately.
  flags: Uint8Array;
}
export interface MarketBandSamples {
  fx: Float64Array; // path-major [path,t], length paths*(T+1).
  home_cpi: Float64Array; // path-major [path,t], length paths*T.
  usd_cpi: Float64Array; // path-major [path,t], length paths*T.
}
export interface CompactPathResult {
  path_id: number;
  charts: Float32Array; // [year, chart field]; inactive = NaN.
  summary: PathSummaryBuffers;
  market_samples: MarketBandSamples; // temporary, full market horizon; release after band aggregation.
}
export interface AnnualLedgerReport {
  starting_liquid_usd: number;
  starting_net_worth_cny: number;
  spend_excluding_medical_cny: number;
  medical_total_cny: number;
  annual_investment_return: number | null; // No remaining invested capital.
}
export interface ReplayResult {
  path_id: number;
  ledger: Float64Array;
  market: MarketPath;
  years: { year: number; report: AnnualLedgerReport; settlements: TaxSettlement[]; terminal?: TerminalSettlement }[];
  stop: { reason: "max_age" | "net_assets_nonpositive"; year: number; year_index: number; net_worth_cny: number };
}
export interface ModelError {
  code: string; message: string; field_path?: string;
  path_id?: number; year?: number; series?: string; factor?: number;
}
export type WorkerRequest =
  | { type: "initialize"; run_id: string; request: RunRequest; references: PublicReferenceBundle }
  | { type: "simulate_chunk"; run_id: string; start_path: number; end_path_exclusive: number }
  | { type: "summarize"; run_id: string; request: RunRequest; charts: Float32Array; summaries: PathSummaryBuffers;
      market_samples: MarketBandSamples }
  | { type: "replay"; run_id: string; path_id: number; request: RunRequest; references: PublicReferenceBundle };
export type WorkerResponse =
  | { type: "initialized"; run_id: string }
  | { type: "chunk"; run_id: string; start_path: number; end_path_exclusive: number;
      charts: Float32Array; summaries: PathSummaryBuffers; market_samples: MarketBandSamples }
  | { type: "progress"; run_id: string; completed_paths: number }
  | { type: "summary"; run_id: string; result: AggregateSummary }
  | { type: "replay"; run_id: string; result: ReplayResult }
  | { type: "failed"; run_id: string; error: ModelError };
export interface AggregateSummary {
  n_paths: number;
  success_probability: number;
  forced_sale_probability: number;
  estate_shortfall_probability: number;
  ceiling_excess_probability: number;
  yearly_alive: Float64Array;
  yearly_alive_not_depleted: Float64Array;
  net_worth_bands: Float32Array;
  liquid_bands: Float32Array;
  market_bands: Record<"fx" | "home_cpi" | "usd_cpi", Float64Array>;
  monetary_quantiles: Record<string, { p10: number | null; p50: number | null; p90: number | null }>;
  depletion_age_quantiles: { p10: number | null; p50: number | null };
  depletion_histogram: { age: number; count: number }[];
  representative_paths: { worst: number; p10: number; median: number };
}
export type RunState = "draft_invalid" | "ready" | "preparing" | "running" | "summarizing"
  | "completed" | "canceled" | "failed";

