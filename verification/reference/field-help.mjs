// Plain-English explanations shared by the generated configuration inventory and browser editors.
const descriptions = {
  schema_version:
    'The version of the configuration file format. Keep this at 1 so the app can read the file. This is not a financial assumption.',
  'simulation.start_year':
    'The first calendar year of retirement. Ages are calculated as this year minus each person’s birth year. Starting balances and today’s spending amounts apply at the beginning of this year.',
  'simulation.n_paths':
    'How many possible retirement futures to simulate. More paths give steadier estimates of probabilities and percentiles, but take more time and memory. Each path uses the same financial rules with different market and medical outcomes.',
  'simulation.seed':
    'The number that controls the random draws. Reusing the same seed, configuration and reference data reproduces the same paths. Use an integer from 0 through 4,294,967,295; the adjacent button chooses one randomly.',
  'simulation.max_age':
    'The simulation includes the year when the younger person reaches this age. Both people are assumed to remain alive throughout. A path ends earlier if its net assets, including property equity after mortgages, reach zero or become negative.',
  'market.sample_start':
    'The earliest historical year that can be sampled for US investment returns, US inflation and US home prices. All series use the same selected years to preserve their historical relationships. Choose a window containing at least 10 complete years.',
  'market.sample_end':
    'The latest historical year that can be sampled. Together with Sample start, this sets the pool of past outcomes; it does not set the final retirement year or predict future returns.',
  'market.block_mean_years':
    'The average length of consecutive historical years kept together before the simulation jumps to another historical starting point. Longer blocks preserve more of the sequences seen during booms and crises. This is an average, rather than a fixed block length.',
  'market.home_cpi_mean':
    'The long-run annual home-economy inflation assumption. Home-domicile spending follows the resulting home price index. Enter a decimal: 0.04 means 4% a year. Ignored when the domicile is the US, whose inflation replays history.',
  'market.home_cpi_phi':
    'How much last year’s home-economy inflation carries into the next year, relative to the long-run mean. Zero removes that persistence; a positive value makes high or low inflation more likely to continue. This is a persistence factor, not an inflation rate.',
  'market.home_cpi_sigma':
    'The size of the random annual changes in home-economy inflation. Zero removes these random changes; 0.018 means a standard deviation of 1.8 percentage points. The long-run mean and persistence still apply.',
  'market.home_cpi_start':
    'The home-economy inflation rate immediately before the first simulated year. It feeds the first year’s inflation calculation through the persistence setting. Enter a decimal: 0.04 means 4%.',
  'market.fx_spot':
    'The starting exchange rate in CNY per US dollar. For example, 6.69 means one dollar buys 6.69 yuan before conversion costs. A lower number makes CNY spending more expensive in dollars. Refresh market data updates this to the latest available observation.',
  'market.fx_fair_value':
    'The starting reference exchange rate used by purchasing-power parity (PPP) mode. This reference moves with the difference between China and US inflation, plus the real trend setting. It is a modeling assumption and may differ from the current spot rate. Drift mode does not use it to move the exchange rate.',
  'market.fx_adjust_speed':
    'In PPP mode, how quickly the exchange rate moves toward the inflation-adjusted reference rate. Zero removes this pull; higher values make the adjustment faster. Drift mode ignores this setting.',
  'market.fx_sigma':
    'The size of random annual exchange-rate moves, measured on a logarithmic scale. Zero removes exchange-rate noise. A value of 0.042 is approximately 4.2% annual volatility for small moves; it is not a guaranteed annual change.',
  'market.fx_real_trend':
    'An annual trend in the PPP reference rate beyond the China–US inflation difference. A positive value raises CNY per dollar, making the yuan weaker; a negative value makes it stronger. This is a logarithmic change: 0.01 is about 1% a year. Drift mode ignores it.',
  'market.fx_mode':
    'PPP moves the exchange rate toward a reference that follows the China–US inflation difference. Drift instead applies the chosen annual drift. Both modes add the exchange-rate noise specified by FX sigma.',
  'market.fx_drift':
    'The annual change in CNY per dollar used only in Drift mode, before random noise. Positive values weaken the yuan; negative values strengthen it. This is a logarithmic change: 0.01 means about a 1.005% increase a year. PPP mode ignores this setting.',
  'market.fx_spread':
    'The cost of exchanging USD and CNY in either direction. Enter a decimal: 0.003 means 0.3%. Higher costs require more dollars to fund the same CNY spending and reduce dollars received when exchanging CNY.',
  'market.fx_quota_usd_per_person':
    'The annual USD-to-CNY conversion amount per person used to flag a possible quota issue. For two people the model compares against twice this amount. It marks the ledger when exceeded; it does not block a conversion or model bank approval. This amount is not increased with inflation.',
  'market.medical_excess_inflation':
    'Extra annual medical price inflation added to China inflation. For example, China inflation of 4% plus 0.02 here gives 6% medical price growth that year. It affects the base medical budget, medical shocks and late-life care; age-related growth is a separate setting.',
  'market.income_yield_us_stocks':
    'The annual share of a brokerage stock holding treated as reinvested dividends for tax calculations. The rest of the sampled total return is price movement; this yield does not add to the total return. Refresh uses the latest complete NYU year’s dividends divided by the beginning-of-year S&P 500 level. Enter a decimal: 0.013 means 1.3%.',
  'market.income_yield_us_bonds':
    'The annual share of a brokerage bond holding treated as reinvested coupon income for tax calculations. This income is already part of the sampled total return and is not added again. Refresh uses the latest FRED 10-year Treasury par yield as an income proxy, which may differ from your holdings’ actual coupons. Enter a decimal: 0.051 means 5.1%.',
  'medical.age_growth':
    'Annual growth in the base medical budget due to aging, on top of medical price inflation. Enter a decimal: 0.04 means another 4% per elapsed year. This affects the recurring medical base; shocks have their own age-based probability and care has its own growth setting.',
  'medical.shock_enabled':
    'Allow random large medical expenses for each person in addition to the recurring medical base. Turning this off removes those shocks while keeping the base medical budget and enabled late-life care.',
  'medical.shock_prob_at_60':
    'Each person’s annual chance of a medical shock at age 60. Enter a decimal: 0.02 means a 2% chance per year per person. The doubling-years setting adjusts this chance for younger and older ages, with a maximum of 100%.',
  'medical.shock_prob_doubling_years':
    'How many additional years of age double a person’s annual medical-shock probability. For example, 8 makes the chance at age 68 twice the chance at age 60. The probability is lower at younger ages and capped at 100%.',
  'medical.shock_median':
    'The medical shock size in today’s household currency, before medical price inflation. Every shock costs this inflation-adjusted amount.',
  'medical.late_life_care.enabled':
    'Include the configured monthly care expense once the earliest-born person reaches the care start age. Care is always an additional medical expense and continues through the last simulated year. It is separate from the included medical base and random shocks.',
  'medical.late_life_care.start_age':
    'The age at which the household’s monthly care expense begins, including that year, measured on the earliest-born person. Care continues to the simulation’s final year; there is no separate end age.',
  'medical.late_life_care.monthly':
    'The household’s monthly care cost in today’s CNY. The simulation charges 12 months each active year and adjusts the amount for medical price inflation and care real growth. It is always additional to the base annual budget.',
  'medical.late_life_care.real_growth':
    'Annual growth in the care amount beyond medical price inflation. Enter a decimal: 0.01 means another 1% per year. Growth is measured from the simulation start, including years before care begins, so the eventual care amount remains expressed in today’s prices at entry.',
  'budget.annual':
    'The household’s total base annual budget in today’s CNY, including the medical amount entered below. Ordinary spending is this amount minus Included health CNY. Medical is counted once. Optional medical shocks, care, one-time expenses and income taxes can require additional money.',
  'budget.included_health':
    'The combined annual base medical budget for both people in today’s CNY. It is already included in Annual CNY, so it is not added to that budget again. This part grows with medical price inflation and aging; the rest of the budget grows with China inflation.',
  'one_time[].name':
    'A label for this one-time expense, such as relocation or a car purchase. The label helps you identify it and does not change the calculation.',
  'one_time[].year':
    'The calendar year when this expense is paid, once. The expense is paid only if the simulation path reaches that year.',
  'one_time[].amount':
    'The one-time expense in today’s prices, using the currency selected here. It grows with China inflation for CNY expenses or US inflation for USD expenses until the payment year.',
  'one_time[].currency':
    'The currency of the entered amount. CNY expenses follow China inflation; USD expenses follow US inflation and use that year’s exchange rate when reported in CNY. New costs default to the domicile currency.',
  'accounts[].name':
    'The fixed identifier for this account: brokerage for Non-retirement liquid assets, after_tax for After-tax retirement savings, or pre_tax for Pre-tax retirement savings. Withdrawal order and property-sale destinations use this identifier. Surplus cash always goes to Non-retirement liquid assets.',
  'accounts[].type':
    'The fixed account type, matching its identifier. Brokerage is a USD account with taxes on investment income and realized gains. Pre-tax is a pre-tax retirement account with withdrawal taxes and access rules. After-tax withdrawals are US tax free, but the chosen China pension treatment still applies. Both retirement accounts have age-based access.',
  'accounts[].balance':
    'The account’s starting market value in USD. This is the full balance before future withdrawal taxes. It is divided among the selected asset allocations. A brokerage account’s tax cost basis always equals this balance. With two people the balance is owned evenly; with one person that person owns it fully.',
  'accounts[].rule_of_55':
    'Declare that this pre-tax retirement account qualifies for the model’s Rule of 55 exception. It permits access from age 55 without the early-withdrawal penalty. Ordinary withdrawal income tax still applies. This is not a general exception for every IRA or former employer account.',
  'accounts[].allow_early_trad':
    'Allow withdrawals from this pre-tax retirement account before the model’s normal access age of 60. Such withdrawals can incur ordinary income tax and the early-withdrawal penalty unless the configured Rule of 55 exception applies. This does not unlock early after-tax withdrawals.',
  'withdrawals.last_resort_property_sale':
    'Allow the model to attempt a property sale when account withdrawals cannot meet a cash need, including properties otherwise marked Hold. Turning this off keeps property from being sold solely to cover a shortage. A sale may fail if closing costs, the mortgage and withholding require unaffordable extra cash.',
  'properties[].id':
    'A unique, persistent identifier for this US property. All owners use citizen tax treatment; there is no foreign-owner withholding.',
  'properties[].share_A':
    'Person A’s ownership share of the property; the rest belongs to B. Enter 0.5 for equal ownership. This splits rent, basis and gains between the two taxpayers.',
  'properties[].value':
    'The property’s starting market value in USD before subtracting the mortgage. Property equity is market value minus the outstanding loan. Held property follows sampled US home returns with no premium or individual price noise.',
  'properties[].cost_basis':
    'The property’s total original USD tax basis before subtracting depreciation already taken. It is split by ownership share. Together with depreciation and sale costs, it determines the US taxable gain or loss on sale.',
  'properties[].land_share':
    'The fraction of the property’s tax basis assigned to land, which is not depreciated. Enter 0.20 for 20% land and 80% building. Only the building portion is eligible for the model’s annual rental depreciation.',
  'properties[].depreciation_taken':
    'Total USD depreciation already claimed before the simulation starts. It reduces the adjusted US tax basis and remaining building depreciation. On sale it can put part of a gain into the special depreciation-related tax category.',
  'properties[].mortgage_balance':
    'The starting outstanding mortgage principal in USD. It reduces property equity. The mortgage payment reduces available rental cash, and any remaining balance must be repaid at sale.',
  'properties[].mortgage_rate':
    'The fixed annual mortgage interest rate. Enter a decimal: 0.04 means 4%. It is used with the loan balance and years left to calculate annual payments, interest and principal repayment.',
  'properties[].mortgage_years_left':
    'The remaining mortgage term in years. Together with the starting balance and interest rate, it sets the annual amortizing payment. A positive mortgage balance requires a positive remaining term.',
  'properties[].rent_monthly':
    'Monthly gross rent in today’s USD before expenses; full occupancy is assumed. The model annualizes it, applies US inflation and rent real growth, then subtracts operating costs and mortgage payments.',
  'properties[].maintenance_annual':
    'Annual maintenance cost in today’s USD, covering management and upkeep in one figure. It grows with US inflation and is deducted from rental cash flow and the rental-income calculation.',
  'properties[].property_tax_annual':
    'The starting annual property-tax bill in USD. Future bills follow modeled property-price changes. This is an operating expense separate from tax on rental income or a sale.',
  'properties[].insurance_annual':
    'Annual property insurance in today’s USD. It grows with US inflation and is deducted as a rental operating expense. This is property insurance, separate from the household medical budget.',
  'properties[].hoa_monthly':
    'Monthly homeowners-association fees in today’s USD. The model charges 12 months each year, increases them with US inflation and deducts them from rental cash flow.',
  'properties[].rent_real_growth':
    'Annual rent growth beyond US inflation. Enter 0 for rent that only follows inflation, or 0.01 for another 1% per year. Negative values model rent lagging behind inflation.',
  'properties[].selling_cost':
    'Sale costs as a fraction of the property’s gross sale price. Enter 0.06 for 6%. These costs reduce closing cash and the net price used to calculate the sale gain; mortgage repayment is separate.',
  'properties[].strategy':
    'Hold keeps the property unless last-resort sales are enabled and cash is needed. Sell year attempts a sale in the specified calendar year. Sell when liquid below attempts one when liquid assets fall below the configured number of annual spending years. A path that ends earlier cannot make a later sale.',
  'properties[].sell_year':
    'The first calendar year to attempt selling this property when its strategy is Sell year. If a sale cannot close, the model can try again in later years while the property is held. Other strategies ignore this setting, and a path that has ended cannot make a sale.',
  'properties[].sell_liquid_years':
    'For Sell when liquid below, the liquid-asset threshold expressed as years of the China-inflation-adjusted base annual budget. A value of 3 triggers below three times that year’s base budget. Extra medical growth, care and one-time expenses do not raise this threshold.',
  'properties[].proceeds_account':
    'The account that receives cash from a successful property sale after closing costs and mortgage payoff. Defaults to Non-retirement liquid assets. Later tax settlement may require further withdrawals.',
};

for (const person of ['A', 'B']) {
  const prefix = `people.${person}.`;
  const help = {
    birth_year: `Person ${person}’s birth year. Age is calculated by calendar year rather than exact birthday. It determines retirement-account access, medical-shock probability, benefit timing and which person sets the Max age endpoint.`,
    sex: `Person ${person}’s descriptive sex. Everyone remains alive to the same planning endpoint, so this choice does not change lifespan, medical probabilities or financial calculations.`,
    us_citizen: `Whether person ${person} is a US citizen. Citizenship is checked against the chosen US income-tax status. A citizen must use Resident treatment; a noncitizen must explicitly resolve their tax-residency status.`,
    us_income_tax_status: `The US income-tax treatment for person ${person}. Resident applies the model’s US resident income and investment tax rules; Nonresident uses its supported nonresident categories. Unresolved blocks a run. Citizenship alone does not establish a noncitizen’s income-tax residency.`,
  };
  for (const [key, text] of Object.entries(help))
    descriptions[prefix + key] = text;
}
descriptions['people.domicile'] =
  'The household’s domicile for income-tax purposes: US or China. One country covers one or two people. China domicile brings modeled foreign investment and pension income into China tax from the first year. US domicile follows the configured six-year reset assumption for when China tax begins.';

const assets = {
  us_stocks: 'US stocks',
  us_bonds: 'US bonds',
  usd_cash: 'USD cash',
  deposit: 'the CNY deposit',
};
for (const [asset, label] of Object.entries(assets)) {
  if (asset !== 'deposit')
    descriptions[`accounts[].allocation.${asset}`] =
      `The fraction of this brokerage or retirement account invested in ${label}. Enter 0.60 for 60%, not 60. The three allocation fractions must add to 1. This sets starting balances, new deposits and annual rebalancing targets. Income treatment is fixed by asset: stocks pay qualified dividends, bonds pay coupon interest with zero-gain sales, and cash earns money-market interest.`;
}
export function descriptionFor(path) {
  const description = descriptions[path];
  if (!description)
    throw new Error(`Missing plain-English configuration explanation: ${path}`);
  return description;
}
