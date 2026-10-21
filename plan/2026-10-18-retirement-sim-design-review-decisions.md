# Independent Review Decisions: Retirement Simulator Design

- **Date:** 2026-10-18
- **Reviewer:** Codex, second design-review pass.
- **Specification:** [Retirement simulator design](2026-10-18-retirement-sim-design.md)
- **Change request:** [First review request](2026-10-18-retirement-sim-design-review-request.md)
- **Status:** Decisions proposed for the user's review.

## Assessment and method

I would take all eight core corrections. R1–R4 address errors in tax calculation or cash-flow accounting. R5–R8 also warrant changes, but I would narrow their implementation scope as explained below. None of the eight core findings has sufficient contrary evidence to justify rejecting it outright.

This pass re-read the original formulas, year loop, configuration limits, output definitions, and documented simplifications. I independently recalculated the numerical examples, examined counterarguments, and identified the smallest change that would resolve each issue. The decision to accept a finding is separate from approval of an implementation.

**Evidence limitation:** Arithmetic and specification inconsistencies were checked directly. External search identified reference documents, but the page-reading tool explicitly blocked public webpage access for security reasons. I have therefore marked legal details requiring primary-source confirmation. No simulator implementation was available to test.

## Decision summary

| ID | Decision | Specific reason | Change I would approve |
|---|---|---|---|
| R1 | **TAKE** | A $50,000 capital loss and offsetting $50,000 capital gain cannot leave both taxable gain and a $48,500 loss carryforward under the stated example. | Correct netting and derive all remaining tax buckets from the result. |
| R2 | **TAKE** | Sale-date withholding removes cash before the next-year tax bill is settled. | Track withholding, available proceeds, and subsequent tax credit/refund for applicable foreign sellers. |
| R3 | **TAKE** | Stopping before paying the final tax bill overstates assets available to heirs; death-related deductions are processed too late. | Add final-return preparation and terminal liability settlement. |
| R4 | **TAKE** | A country-level cap does not establish that every US tax component qualifies for China's credit. | Filter eligible taxes before applying the country cap and carryforward rules. |
| R5 | **TAKE, with narrower scope** | Citizenship does not determine income-tax residency, estate domicile, or instrument situs. | Make these assumptions explicit and validate the supported combinations and holdings. |
| R6 | **TAKE validation; defer model replacement** | Accepted projections generate returns below -100%. | Validate transformed observations and final factors; retain linear rescaling where valid. |
| R7 | **TAKE budget reconciliation; retain a configurable age curve** | The included medical component needs correct allocation and growth disclosure; the growth arithmetic itself is consistent. | Reconcile the household budget and distinguish initial spending from a continuing real spending ceiling. |
| R8 | **TAKE age/amount rules; narrow benefit scope** | A static flag can pay a young survivor benefits prematurely or use an unspecified deceased benefit amount. | Add age gates and a supported benefit calculation or a documented conservative schedule. |

## R1 — Capital-loss netting

**Decision: TAKE.**

The specification collects securities gains/losses, ordinary long-term property gain, and unrecaptured Section 1250 gain separately. That is a useful ledger representation, but Section 6.2 nets only the first two categories before adding `u1250` to AGI. The components are consequently taxed without a complete netting step.

I reproduced the review example using the specification's MFS brackets and deduction:

```text
Correct case, assuming the property gain retains capital treatment:
  Net capital gain = -50,000 + 50,000 = 0
  Taxable ordinary income = 100,000 - 16,100 = 83,900
  Regular federal income tax = 13,170

Written sequence:
  Ordinary loss deduction = 1,500
  Taxable income = 100,000 - 1,500 + 50,000 - 16,100 = 132,400
  Regular federal income tax = 24,374
  Loss carryforward = 48,500
```

**Counterargument considered:** Property gain can have ordinary-income treatment under applicable recapture or Section 1231 lookback rules. If that were the example, a capital loss would not necessarily eliminate the ordinary gain. The review expressly excludes that complication and classifies the gain as unrecaptured Section 1250 gain. The counterargument therefore does not resolve this example.

**Change I would take:** Define a netting procedure consistent with the applicable Schedule D and Section 1231 treatment. Compute the remaining ordinary long-term gain, unrecaptured Section 1250 amount, deductible net capital loss, and carryforward from that procedure. Avoid merely adding `u1250` to the current expression while also adding it again to AGI.

**Closure evidence:** The exact offset case must produce $13,170 of regular income tax and zero loss carryforward under the spec's tables. Add partial-offset cases and check their bucket ordering against the relevant worksheets. The $11,204 difference concerns regular income tax; a separate NIIT reconciliation is still required.

**Legal verification:** Schedule D instructions and the unrecaptured Section 1250 gain worksheet, with Form 4797/Section 1231 treatment where applicable.

## R2 — FIRPTA withholding and liquidity

**Decision: TAKE for transactions subject to FIRPTA.**

The numerical example is correct: $1,000,000 less a $700,000 mortgage and $60,000 selling costs leaves $240,000 before withholding; a $150,000 withholding payment leaves **$90,000 at closing**. The withdrawal engine cannot spend the withheld $150,000 while awaiting a refund.

**Counterargument considered:** Withholding is a prepayment and ultimately may not change final tax. That is true, but this simulator measures shortfalls and forced sales, which depend on payment timing. The omission can make a sale appear to rescue a path that still lacks spendable cash.

The 15% assumption is explicitly conditional in the review request. At a $1 million sale price, buyer-use conditions can change the applicable withholding, so the example must identify a transaction for which the assumed rate applies. Foreign-seller status also depends on R5; noncitizenship alone is insufficient.

**Change I would take:** Add a sale-date withholding amount, reduce immediately available proceeds, and carry the amount as a tax prepayment. Final tax settlement uses that prepayment and recognizes a further payment or refund at a documented time. Apply it to the foreign seller's relevant share.

**Scope:** This is needed for supported property-sale scenarios. It has no cash-flow effect in a scenario that forbids all property sales. An annual settlement convention is adequate initially; a detailed closing-date/refund-calendar model is unnecessary.

**Closure evidence:** Withholding must affect the sale year's available cash. A later refund must restore cash exactly once, and cumulative permanent tax must equal final liability. Test zero/reduced withholding and a sale with insufficient equity to cover the withholding requirement.

**Legal verification:** IRC Section 1445, applicable FIRPTA withholding exceptions and certificates, and the IRS withholding guidance.

## R3 — Final returns and terminal liabilities

**Decision: TAKE, preserving the declared annual tax-payment convention.**

The specification intentionally pays annual tax one year later. That simplification can remain. However, Section 5.10 computes the last year's taxes and then stops after the second death; Section 6.7 subtracts estate tax only. A computed income-tax liability does not cease to exist when the household dies.

For example, if the terminal estate has $500,000 of assets and an unpaid $30,000 final income-tax liability, net assets available to heirs are **$470,000 before other liabilities**, even if estate tax is zero.

Death-related passive losses also need to be determined before completing the decedent's final return. Under the passive-loss-at-death rule to verify, the deductible suspended loss is generally limited to the amount exceeding the relevant basis increase:

```text
Suspended loss 30,000; basis increase 20,000 -> deductible loss 10,000
Suspended loss 30,000; basis increase 50,000 -> deductible loss 0
```

**Counterargument considered:** No living person needs spending after the second death. That explains ending the retirement cash-flow simulation; it does not justify overstating `net_to_heirs`.

The current lifetime-tax metric is explicitly cash paid. That metric can remain if accurately labeled. I would reject adding unpaid accrued liabilities into a field still called tax paid. Report the terminal unpaid liability and, if desired, a separate total tax-liability metric.

**Change I would take:** Prepare death-specific final-return inputs, complete the year's taxes, apply ownership/basis changes consistently, and produce a terminal settlement of assets, liabilities, and tax prepayments/refunds. Use the settlement to compute net assets to heirs. Record an estate shortfall separately from the existing definition of a living household's spending shortfall.

**Scope:** Recording liabilities is sufficient. Do not force post-death retirement-account liquidations or model beneficiaries' future distribution taxes as part of this correction unless that additional scope is explicitly specified.

**Closure evidence:** Reconcile the final ledger, accrued taxes, cash paid, and terminal net assets. Test first-death passive losses and second-death outstanding taxes/prepayments. Count each obligation once.

**Legal verification:** IRC Section 469(g)(2) and Publication 925 for passive losses; final-return and estate liability treatment for the supported case.

## R4 — China's foreign tax credit

**Decision: TAKE eligibility filtering; retain the country-level cap.**

The proposed formula starts with all US federal and state tax. An upper limit based on China tax on US-source income does not establish that all components of that US tax qualify for credit. Eligibility must be determined first.

The review's numerical illustration is internally correct under its stated legal assumption: $5,000 of eligible dividend tax can reduce a $10,000 China dividend liability to $5,000; including a further $5,100 of tax on China-exempt Social Security would instead erase that liability. The example demonstrates the consequence of the disputed eligibility assumption; arithmetic alone does not prove the Chinese legal result.

**Counterargument considered:** China permits a country-level calculation, so eligible US taxes may be pooled. I agree. I would reject adding US-style FTC baskets or a strict item-by-item cap merely because the US uses different rules. The correction is to exclude ineligible components before applying China's supported country limit.

**Change I would take:** Introduce an explicit eligible foreign-income-tax amount with documented treatment of China-exempt income, final versus refundable tax, and additional taxes/penalties. Keep the per-country cap and preserve country, eligibility, and vintage information needed by carryforwards.

**Closure evidence:** Establish from primary rules which taxes qualify, then pin the mixed Social Security/dividend example accordingly. Test the country cap, excess eligible tax, expiry, and refunds. The original CN-1 case states only a total US tax amount and cannot independently verify eligibility.

**Legal verification:** China IIT Law Article 7, implementing rules, MOF/STA Announcement 2020 No. 3, particularly its exclusions from creditable foreign income tax, and applicable US–China treaty provisions. The announcement is a verification target, not a claim of live source confirmation in this pass.

## R5 — Residency, domicile, and asset situs

**Decision: TAKE explicit classification; reject requiring a universal tax-status engine for the first implementation.**

The review correctly identifies three distinct concepts: US citizenship, US income-tax residency, and US estate-tax domicile. The specification's Boolean branches conflate them. A green-card holder normally meets the US income-tax residency test, subject to legally relevant exceptions or changes. Moving to China alone does not establish the modeled NRA status.

Instrument classification is also necessary. The same USD economic exposure can be held as a bank deposit, direct debt security, or US-domiciled fund. Those wrappers need not have the same estate situs or NRA income treatment. Treating every USD balance as US-situs is therefore not a factual classification rule.

**Counterargument considered:** The specification deliberately supports one household combination. It need not implement every resident-alien, treaty, or estate-domicile case. That is a valid scope limitation if the supported assumptions are explicit, compatible with the household, and enforced.

**Change I would take:** Add declared income-tax status and estate domicile, plus enough instrument/situs information for the holdings actually modeled. Validate combinations and display the assumptions in the scenario report. For unsupported status combinations, stop with an informative error instead of silently using the NRA branch.

**Change I would reject for now:** Making complete resident-alien and general treaty-residency support a prerequisite for every prototype. However, if this household retains a status that requires the resident branch, that branch is necessary before presenting its results as this household's forecast.

**Closure evidence:** Confirm Person B's intended modeled status. Validate the selected income-tax and estate branches independently. Classify the actual cash equivalents and funds, or identify an explicit conservative situs assumption. Do not infer these from the account currency. Establish any status transition and its effect on starting balances separately.

**Legal verification:** IRS green-card/residency rules, estate domicile rules, and Form 706-NA instructions, including relevant debt/deposit exclusions and domestic corporate holdings.

## R6 — Market domains and projection transformation

**Decision: TAKE domain validation; defer replacing linear rescaling.**

I recalculated the counterexample with both stock SD values appearing in the specification:

| Reference | SD | Rescaled worst return at 3% mean / 40% vol |
|---|---:|---:|
| Section 4.2 table | 19.40% | -111.7423% |
| Section 4.3.1 table and Section 11.2 test | 19.30% | -112.3368% |

Both results are impossible for an unlevered asset's total return. The disagreement between reference SD values should be reconciled when the source data are available; it does not affect this decision.

**Counterargument considered:** Such volatility is outside the expected household allocation. The interface expressly accepts it. Invalid accepted inputs need deterministic rejection or a documented valid interpretation.

**Change I would take:** Validate the rescaled sample window, actual factors used in account growth, inflation/PPP logarithms, and combined property growth. Fail before running a scenario whose finite transformed sample is invalid. Specify a deliberate admissibility policy for Gaussian China inflation, whose support is unbounded; ordinary input-range checks alone cannot mathematically guarantee valid draws.

**Domain distinction:** An unlevered holding can legitimately lose exactly 100% and reach zero if the engine supports that case. Price indices and arguments of `log(1 + inflation)` must remain strictly positive. I would reject a blanket rule that treats those domains as identical.

**Change I would defer:** Automatically switching the model to log-return rescaling. It changes the interpretation of mean/volatility and generally changes the asserted Pearson correlations. The first fix should preserve the current transformation for admissible projections. Silent clipping is also unacceptable because it changes the requested moments and dependence.

**Closure evidence:** The counterexample is rejected before simulation. Zero-volatility cases remain deterministic. Inflation/log domains and final property/account factors are checked. Any new stochastic admissibility policy is documented and its effect on calibration is measured.

## R7 — Medical spending and budget meaning

**Decision: TAKE household reconciliation and growth disclosure; reject an automatic change to the generic age-growth formula.**

The review's growth arithmetic is correct. At 4% general CPI, 2% medical excess inflation, and 4% annual age growth, the nominal factor is `1.06 * 1.04 = 1.1024`; dividing by general CPI leaves a real factor of `1.06`.

| Age | Included starting component grown at 6% real per year |
|---|---:|
| 40 | RMB38,000 |
| 60 | RMB121,871 |
| 80 | RMB390,857 |
| 90 | RMB699,966 |

The specification already labels the medical defaults illustrative and the base scenario a placeholder. The large result does not by itself establish that the formula is wrong. Age-related utilization and medical price inflation are distinct mechanisms and can reasonably be modeled separately.

**Change I would take:** Reconcile the first-year household budget: the RMB38,000 included component is allocated within RMB250,000, leaving RMB212,000 for other recurring spending. Confirm the actual breakdown, especially social contributions versus insurance premiums and out-of-pocket care; the combined component need not share one medical growth curve. Display nominal growth, real growth, and total projected household spending.

**Additional clarification needed:** Is RMB250,000 an initial annual budget, or a continuing ceiling in today's purchasing power? Reconciling the first year does not resolve that question. Inflating other spending by CPI while increasing included medical spending faster makes total real spending exceed RMB250,000 in later years. That can be an intentional forecast, but it must be stated. A continuing ceiling instead requires an explicit rule for accommodating higher medical spending and treating shocks/care costs.

**Change I would reject:** Choosing a lower age-growth rate or an arbitrary age cap simply to make the result smaller. Use actual premium/expense information where available, or show clearly labeled alternative growth scenarios. Preserve configurable price and age effects.

**Closure evidence:** First-year recurring spending totals RMB250,000 once. Show age-specific medical and total spending in today's CNY. Identify which commercial insurance, medical shocks, and care costs are included or additional. Do not apply the entire medical curve automatically to all social-insurance contributions.

## R8 — Survivor benefits

**Decision: TAKE an age gate and a defined benefit amount; reject requiring a complete SSA claiming engine initially.**

The death-year transition and static eligibility Boolean are insufficient for the user-adjustable ages supported by the simulator. The survivor can be too young to claim, and the deceased's configured `ss_monthly_usd` at a chosen claim age is not necessarily the survivor's payable benefit.

**Counterargument considered:** The example household starts near age 60 and the defaults disable B's benefits. That reduces the effect in some runs. It does not make the rule valid when the actual household starts at 40 or when a user enables benefits.

Ordinary widow/widower benefits generally have an earliest age of 60, with specified disability and child-care exceptions. Early survivor claiming can reduce benefits. Overseas payability is a separate condition. These legal details need source confirmation before implementation is accepted.

**Change I would take:** Define survivor claim age, supported eligibility conditions, age-specific reductions or a conservative payable-amount schedule, and coordination with own benefits. State whether the configured deceased amount represents PIA, an actual claimed benefit, or a manually supplied survivor entitlement. An own/survivor maximum is only meaningful after both payable amounts have been correctly established.

**Scope:** A manual conservative survivor schedule is sufficient for the first version if its assumptions are visible and the age gate is enforced. A full SSA earnings-history, PIA, delayed-credit, and claiming-optimization engine is unnecessary. With Social Security disabled, the corrected branch must still produce zero benefits.

**Closure evidence:** No ordinary age-based survivor payment at age 45. Test the supported eligibility/claim ages, early reductions or the manual schedule, the own/survivor transition, and payability abroad. Tie amounts to actual benefit information when available.

**Legal verification:** SSA survivor guidance, the applicable full-retirement-age schedule and benefit-reduction rules, and household-specific overseas eligibility.

## Decision on the requested household acceptance scenario

**TAKE, with explicitly completed assumptions.** The current generic example should remain useful as a software example; a separate scenario should represent this household. The request's ages, starting FX, spending, and financial balances provide the right starting point, but the table alone is insufficient to reproduce one exact projection.

I would require the following before comparing results with the earlier FIRE analysis:

1. **Exactly 50 spending years.** With spending at each year's start, use `t = 0...49`, corresponding to ages 40...89. Fixed death age 90 under the current end-of-year death rule would generate 51 spending years.
2. **Completed deterministic settings.** Specify US inflation, the entire FX path, investment/account allocations, yields, tax status/tables, withdrawal restrictions, and the medical growth interpretation. Disable random death, medical shocks, property noise, and flexible spending in the reconciliation case. Add each risk in separately identified comparisons.
3. **Return target.** A constant portfolio total return of 3% is a valid deterministic control. For stochastic cases, report the actual compound-return interpretation and calibration; setting each arithmetic mean to 3% is not an equivalent target.
4. **Spending definition.** Establish the R7 first-year-budget versus continuing-real-ceiling distinction. Additional reserves must be explicit.
5. **Hold property throughout.** Set the property strategy to hold and disable `last_resort_property_sale`. Under the current specification, `hold` alone still permits a forced sale. Document rental cash flow and mortgage service rather than treating property equity as available retirement cash.
6. **Document asset assumptions.** The $5.3M is gross financial wealth, including $1.6M of retirement accounts. Verify access ages, traditional/Roth split, cost basis, ownership, and the liquidity/wrappers of the $2M other investments. Apply taxes inside the scenario once; compare gross balances consistently.
7. **Define stress paths.** Identify the portfolio allocation, historical calendar returns, and tax treatment. Distinguish historical sequences from amplified stresses. A historical peak-to-trough equity drawdown is not an annual diversified-portfolio return.

### Independent arithmetic control

A minimal control can isolate annual spending, inflation, FX conversion, and return timing. Assume no tax, no spread, no benefits, no property cash flow, constant FX of 6.69, 4% spending inflation, and 3% constant nominal returns. This is a calculation control, not a retirement-funding recommendation.

```text
First-year USD spending = 250,000 / 6.69 = 37,369.21

Required starting balance for 50 beginning-of-year payments:
  sum[t=0..49] (250,000 / 6.69) * (1.04 / 1.03)^t
  = USD 2,390,572.98
```

The corrected engine should reproduce that result before adding taxes, FX changes, medical growth, or volatility. Each addition can then be reconciled separately.

## Changes I would approve for the first implementation

- Correct capital netting, final-return ordering, terminal liabilities, and eligible FTC inputs.
- Add FIRPTA cash/prepayment handling to applicable property-sale scenarios.
- Make supported tax status and instrument/situs assumptions explicit and validated.
- Reject invalid projected series and specify stochastic inflation-domain handling.
- Add the reconciled household scenario, spending-growth reports, and conservative survivor rules.
- Preserve the existing modular architecture and reproducible scenario comparisons.

I would defer a universal treaty/residency engine, a replacement return-generation model, a full SSA optimization engine, and detailed estate administration. These are separable expansions; the accepted corrections can be made without them.

## References to verify

The following were identified by search or by the specification. Their page contents were not accessible in this session. They are verification targets, not independently checked quotations or current-law certifications.

| Area | Reference |
|---|---|
| Capital netting | [IRS Schedule D instructions](http://www.irs.gov/instructions/i1040sd/ar01.html); unrecaptured Section 1250 gain worksheet; Form 4797 |
| FIRPTA | [IRS practice unit: withholding for individual sellers](https://www.irs.gov/pub/fatca/int_practice_units/wit_t_15_02_01.pdf); [withholding exceptions](http://www.irs.gov/Individuals/International-Taxpayers/Exceptions-from-FIRPTA-Withholding) |
| Passive losses at death | IRC Section 469(g)(2); IRS Publication 925 |
| China's FTC | IIT Law Article 7 and implementing rules; MOF/STA Announcement 2020 No. 3; relevant treaty provisions |
| Residency and estate situs | IRS Publication 519; Form 706-NA instructions; applicable domicile and situs provisions |
| Survivor benefits | [SSA Survivors Benefits](https://www.ssa.gov/pubs/EN-05-10084.pdf); [survivor full retirement age](https://www.ssa.gov/survivor/full-retirement-age-survivor) |

Source dates and applicability must be checked when closing the legal acceptance cases. The numerical tax examples in this document deliberately use the specification's tables, whose verification status remains unchanged.
