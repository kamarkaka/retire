# Request for Review: Retirement Monte Carlo Simulator Design

- **Date:** 2026-10-18
- **Specification:** [2026-10-18-retirement-sim-design.md](2026-10-18-retirement-sim-design.md)
- **Status:** Open; requested before implementation.
- **Scope:** Tax calculations, cash-flow timing, terminal settlement, admissible market paths, household assumptions, and benefit eligibility.

## Review objective

Please review the findings below and revise the specification where appropriate. For each finding, record whether it is accepted, disputed, or requires clarification; explain the resulting design decision; and identify the evidence and regression cases needed to close it.

The overall architecture is reasonable. The modular engine, year-by-year ledger, joint sampling of US market series, reproducible random streams, and common random numbers for scenario comparisons provide a useful foundation. The issues below need resolution before the simulator's success probabilities can support this household's retirement decision.

The numerical counterexamples use the specification's own formulas and tax tables. They demonstrate internal calculation or cash-flow problems. They do not independently establish that the stated tax tables, treaty interpretations, or eligibility assumptions are legally correct.

## Findings at a glance

| ID | Finding | Review priority |
|---|---|---|
| R1 | Capital-loss netting omits unrecaptured Section 1250 gains | High |
| R2 | FIRPTA withholding is omitted from sale-date liquidity | High |
| R3 | Death-year ordering and terminal settlement can omit liabilities | High |
| R4 | China's foreign tax credit pools US taxes without checking eligibility | High |
| R5 | Citizenship flags do not establish tax residency, estate domicile, or asset situs | High |
| R6 | Accepted market projections can produce returns below minus 100% | High |
| R7 | Medical growth and spending inputs need reconciliation with the all-inclusive budget | High for this household |
| R8 | Social Security survivor benefits lack claim-age and reduction rules | Medium; high when benefits materially affect solvency |

## R1. Net capital losses against the relevant gains before assigning tax-rate buckets

**Location:** Section 6.2, capital-loss calculation and capital-gains formula; starting at line 533.

**Finding:** The current netting expression is `cap_gain + ltcg_property + carryforward`. It excludes `u1250`, which is subsequently added to AGI. A securities loss can consequently create an ordinary-income deduction and a carryforward while an offsetting unrecaptured Section 1250 gain remains taxable.

**Numerical counterexample:** Assume Person A is 60, files MFS, has $100,000 of ordinary income, realizes a $50,000 long-term securities loss, and realizes a $50,000 property gain entirely classified as unrecaptured Section 1250 gain. Assume no other income, prior carryforwards, or Section 1231 lookback complication.

| Calculation | Correct capital netting | Written sequence |
|---|---:|---:|
| Net capital gain | $0 | Loss handled separately from $50,000 `u1250` |
| Ordinary capital-loss deduction | $0 | $1,500 |
| Taxable income, using the spec's $16,100 deduction | $83,900 | $132,400 |
| Regular federal income tax, using the spec's brackets | $13,170 | $24,374 |
| Capital-loss carryforward | $0 | $48,500 |

The regular income-tax difference is **$11,204**, before evaluating any associated NIIT distortion.

**Requested correction:** Define the required capital-gain/loss netting and ordering, including the interaction with unrecaptured Section 1250 gains and applicable Section 1231 rules. Derive the remaining preferential-rate buckets, ordinary loss deduction, carryforward, and NIIT inputs from that result.

**Acceptance case:** Add the example above, plus partial offsets, gains exceeding losses, losses exceeding gains, and prior carryforwards. Reconcile the expected results to the applicable Schedule D worksheets. Positive-gain-only cases do not exercise this failure.

## R2. Model FIRPTA withholding when sale proceeds become available

**Location:** Section 6.3, FIRPTA exclusion at line 579; property-sale proceeds in Section 5.8.

**Finding:** The specification says next-year tax payment timing already covers FIRPTA withholding. Withholding at closing removes cash immediately. A later return, credit, or refund cannot fund expenses in the sale year.

**Liquidity example:** Assume an NRA seller and a transaction to which 15% withholding on the gross sale price applies.

| Item | USD |
|---|---:|
| Gross sale price | $1,000,000 |
| Mortgage payoff | -$700,000 |
| Selling costs | -$60,000 |
| Proceeds before withholding | **$240,000** |
| FIRPTA withholding | -$150,000 |
| Cash available at closing | **$90,000** |

Depositing $240,000 makes an extra $150,000 available to the withdrawal engine. This can change whether a forced sale actually resolves a shortfall.

**Requested correction:** Represent sale-date withholding, final tax liability, the corresponding tax prepayment, and refund/payment timing separately. Credit withholding against final tax to prevent double charging. Document the assumptions for exemptions, reduced withholding, ownership shares, and withholding certificates; 15% is the example's assumption, not a universal rate.

**Acceptance case:** Test the example above, a sale with reduced or zero withholding, and a refund in a later year. Verify that current-year spending can use only cash actually available and that lifetime tax reflects final liability rather than gross withholding.

## R3. Settle death-year taxes and outstanding liabilities before reporting net assets to heirs

**Location:** Sections 5.9 and 5.10, particularly lines 480, 493, 503, and 505; Section 6.7, terminal metrics at line 627.

**Finding:** Current-year taxes are computed before death processing and scheduled for payment next year. Once both spouses have died, the engine stops. The terminal formula subtracts estate tax only. Final-year income taxes and unpaid liabilities can therefore disappear from both `net_to_heirs` and lifetime-tax reporting.

Death processing also releases suspended passive losses after the final income-tax calculation, although the specification says they affect that year's final return. The treatment needs an explicit interaction with the basis step-up: a full release at death should not be assumed without checking the applicable passive-loss rules.

**Requested correction:** Specify a death-year ordering that determines the final return's inputs before finalizing its tax. Add a terminal settlement that accounts for outstanding US federal, state, China, and estate taxes, withholding/prepayments, and receivables or refunds. Define consistently whether lifetime tax is measured as liability or cash paid. Validate which suspended passive losses are deductible after accounting for the basis increase at death.

**Acceptance cases:**

- Both spouses die in a year with a taxable property sale or retirement-account distribution: the final tax liability reduces net assets to heirs.
- The last death occurs with an unpaid prior-year tax bill: the bill remains a liability.
- The first death occurs with suspended passive losses and a property step-up: the final return uses the permitted deduction and the survivor's basis is correct.
- A prepayment exceeds final liability: recognize the refund consistently without treating the full prepayment as permanent tax.

## R4. Restrict China's foreign tax credit to eligible foreign income taxes

**Location:** Section 6.4, Social Security exemption at line 596 and FTC formula at line 598.

**Finding:** The proposed credit pools all of the person's US federal and state tax, then caps the total at China tax on US-source items. It does not first establish which US taxes qualify for credit. The specification itself treats US Social Security as exempt in China; tax paid on that exempt income should not automatically reduce China tax on dividends.

**Illustration, in USD-equivalent amounts:**

- US tax attributable to dividends: $5,000.
- US tax attributable to Social Security treated as China-exempt: $5,100.
- China tax on the dividends before credit: $10,000.

If only the dividend tax is eligible in this example, the credit is $5,000 and China tax due is **$5,000**. The written aggregate formula gives a $10,000 credit and **$0** due.

**Requested correction:** Define eligible income taxes, allocation to the relevant foreign income, the country limit, and the timing rules. Verify the treatment of taxes on China-exempt income, state income taxes, additional taxes, and penalties. Preserve eligibility and vintage information in carryforwards so an ineligible amount cannot become creditable in a later year.

**Acceptance case:** Test taxable dividends alongside China-exempt Social Security, eligible credits exceeding the limit, credit expiry, and payments or refunds affecting the allowable credit. Support the expected results with the applicable China rules and treaty provisions.

## R5. Separate citizenship, US income-tax residency, estate domicile, and asset classification

**Location:** Section 1.2, household facts and flags; Section 6.3 at line 563; Section 6.7 at line 623.

**Finding:** `us_citizen = false` selects Form 1040-NR and the NRA estate treatment. Noncitizens can be US income-tax residents, including green-card holders. US income-tax residency and US estate-tax domicile are also separate determinations.

The earlier household description includes one US citizen and one green-card holder. The specification now assumes Person B is an NRA. Whether B will retain the green card or cease US tax residency remains an unresolved household assumption.

The estate calculation additionally treats all USD accounts as US-situs. Currency and account location do not establish estate situs. Direct Treasury securities, bank deposits, US-registered funds, and other investment wrappers can have different treatment; the legal instrument also matters to NRA income taxation.

**Requested correction:** Add explicit, validated assumptions for US income-tax status and estate domicile. Classify relevant holdings by legal instrument, issuer/fund domicile, and tax wrapper so that situs and income treatment have a defined basis. If the supported household is deliberately fixed to an NRA branch, document how that status is established and reject incompatible configurations.

**Acceptance case:** Demonstrate separate resident-alien and NRA income-tax branches, separate estate-domicile treatment, and different instrument wrappers held in USD. Obtain confirmation of Person B's intended status before labeling the scenario as this household's plan.

## R6. Validate the transformed market series, including positive gross factors

**Location:** Section 4.3.1, rescaling formula at line 226; Section 9, accepted mean/volatility ranges at line 1045.

**Finding:** The permitted input ranges do not guarantee valid transformed returns. The linear formula can produce a return below -100%, allowing a negative asset balance. Similar domain problems affect price indices and any inflation input subsequently used in `log(1 + inflation)`.

**Example using the reference values printed in Section 4.2:** Historical worst stock return -43.8%, mean 11.85%, population SD approximately 19.4%; user projections of 3% mean and 40% volatility are accepted by the validation rules.

```text
transformed return = 0.03 + (-0.438 - 0.1185) * (0.40 / 0.194)
                   = -1.11742268
                   = -111.74%
gross wealth factor = 1 + transformed return = -0.11742268
```

**Requested correction:** Validate every transformed observation over the selected window, and the combined property-growth formula, against the model's required domains. Specify how stochastic China inflation remains admissible. Consider transforming log gross returns if appropriate, then explain and verify the resulting meaning of the mean and volatility inputs. Silent clipping changes moments and correlations and requires explicit treatment.

**Acceptance case:** Reject or explicitly handle the example above. Test zero volatility, extreme accepted projections, inflation and home-price inputs, and the final gross factors used by the engine. If the transformation changes, recheck calibration and dependence properties rather than assuming the existing assertions still hold.

## R7. Reconcile medical expenses and their growth with the RMB250,000 budget

**Location:** Section 4.6, medical price index at line 285; Section 5.3, medical base-cost formula at line 364; example spending and medical inputs in Section 8.

**Finding:** The household's RMB250,000 annual budget already includes housing, social insurance, health insurance, and out-of-pocket medical expenses. Approximately RMB38,000 is the combined social-insurance/medical component. Adding that component again as separate medical spending would double count it.

The medical formula also combines price inflation with an additional age-related increase. With China CPI at 4%, medical excess inflation at 2%, and age growth at 4%:

```text
Medical price growth             = 4% + 2% = 6%
Combined nominal annual growth   = 1.06 * 1.04 - 1 = 10.24%
Growth relative to general CPI   = (1.06 * 1.04) / 1.04 - 1 = 6%
```

If a RMB38,000 starting component follows that entire curve for 50 years, it reaches `38,000 * 1.06^50`, approximately **RMB700,000 in today's purchasing power at age 90**. This illustration assumes the component continues throughout the period; the actual premium and expense breakdown may require different curves. The defaults are described as illustrative and have not been calibrated to this household.

**Requested correction:** Reconcile the first-year recurring budget explicitly, for example RMB212,000 of other expenses plus the included RMB38,000 component. Split contributions, insurance premiums, and medical spending where their growth differs. Show the combined nominal and real medical-growth assumptions. Calibrate the age curve, or use documented bounded/piecewise assumptions. Specify whether major medical shocks and late-life care are additional reserves or are already funded within the stated budget.

**Acceptance case:** The configured first-year recurring total equals RMB250,000. A breakdown report demonstrates no duplication. Report medical expenses at representative ages in today's CNY, and test the treatment of separately selected medical shocks and care scenarios.

## R8. Add survivor-benefit claiming and age rules

**Location:** Section 5.4, survivor-benefit rule at lines 380–382.

**Finding:** The current rule starts `max(own, deceased's)` in the year following death whenever a static eligibility flag is true. It does not specify survivor claim age, early-claim reductions, or how the deceased's benefit record and the survivor's own benefit interact. A young survivor could receive a benefit immediately despite being below the applicable age.

**Requested correction:** Add an explicit survivor claim age and applicable eligibility/age gates, reduction rules, benefit amount, and coordination with own benefits. Verify payability abroad independently. If detailed SSA rules are outside the supported scope, use a clearly specified conservative benefit schedule with an age gate. Document any supported disability or child-care exceptions.

**Acceptance case:** A survivor aged 45 does not automatically receive ordinary age-based survivor benefits the following year. Test before, at, and after eligibility/claim ages, early-claim reductions, transitions between own and survivor benefits, and overseas payability. Verify the household-specific assumptions with SSA sources.

## Requested household acceptance scenario

Add a separate conservative household scenario to make the earlier retirement analysis reproducible. The current example uses different ages, balances, spending, China inflation, and historical market returns; its probabilities are not directly comparable to that analysis.

| Input | Required starting assumption |
|---|---|
| Household | Two spouses, both age 40 at retirement; no children |
| US status | One US citizen, one green-card holder; explicitly resolve Person B's modeled tax residency |
| Horizon | A deterministic 50-year spending case, with the year/age convention stated |
| Recurring spending | RMB250,000 per year in today's money, including the RMB38,000 social-insurance/medical component |
| China inflation | 4% per year in the deterministic case |
| Initial exchange rate | **6.69 CNY per USD**, the user's selected modeling anchor |
| Nominal investment return | **3% annual compound portfolio return before personal taxes** in the deterministic case |
| Financial assets | **$5.3 million before withdrawal taxes:** $1.7M cash equivalents, $2.0M other investments, $1.6M retirement accounts |
| Real estate | $2.0M value, $731,000 loans; retain the property in this case |
| Other cash flows | Document rental cash flow and debt service; use zero net rental cash flow only as an explicit placeholder |
| Benefits and medical shocks | A conservative baseline excluding unconfirmed Social Security income, with clearly identified additional scenarios |

A constant 3% return compounds at 3%. In stochastic runs, a 3% arithmetic mean with volatility does not establish a 3% compound return. Define which measure the projection targets and how the portfolio is calibrated.

Document missing cost bases, ownership shares, account wrappers, traditional/Roth split, and tax assumptions. These inputs materially affect spendable assets. Start with a deterministic annual ledger, then compare documented dot-com, 2008, FX, and medical stress cases. Show portfolio-level crisis returns and distinguish historical replay from deliberately amplified stress assumptions.

## Requested reviewer response

| ID | Decision: accept / dispute / clarify | Spec change or rationale | Supporting source and acceptance cases |
|---|---|---|---|
| R1 | | | |
| R2 | | | |
| R3 | | | |
| R4 | | | |
| R5 | | | |
| R6 | | | |
| R7 | | | |
| R8 | | | |

## Completion criteria and verification scope

- Resolve each finding through a specification change, a documented supported-scope limitation, or evidence explaining why the finding does not apply.
- Reconcile cash, tax liabilities, prepayments, refunds, and terminal net assets across the year loop and deaths.
- Ensure accepted scenarios cannot silently create negative asset gross factors or invalid inflation/price indices.
- Reconcile the household's all-inclusive spending and establish its tax-status assumptions.
- Provide authoritative references for the tax and Social Security rules used by the accepted design.
- Supply the source datasets and reproducible calibration procedure for the quoted historical statistics. Measure the promised runtime and memory targets once the implementation exists.

This review examined the written specification and recalculated the examples above. No simulator implementation or source dataset was present in the project at review time, so engine behavior, historical calibration, and performance have not yet been independently tested. The specification itself marks its tax-table values as not live-verified; retain that distinction until the source checks are complete.
