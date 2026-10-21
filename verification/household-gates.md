# Actual household input readiness

These are financial/factual requirements, not a Simulation checklist or legal-verification checkbox. All configurations share validation; source status is reported separately. One actual spouse is a US citizen and the other holds a green card; the sample NRA classification is an example assumption.

## Recorded facts and explicit control choices

| Item | Value / treatment |
|---|---|
| Household | One or two adults, no children; age40 in the original2026 scenario. Requested example births1986, A Female/B Male. Sex is descriptive; everyone lives through the younger (or single) Max age. |
| Financial assets | USD1.7M cash equivalents +2M other investments +1.6M retirement =5.3M gross before withdrawals/tax |
| Property | USD2M value,731k loans,1.269M equity; no-sale uses hold plus last_resort_property_sale=false |
| FX | User-selected6.69 CNY/USD, not a live-quote claim |
| Budget | RMB250k including38k base medical/social-insurance; ordinary212k. The Budget health amount is aggregate and counted once. |
| Care | If enabled, always additional, from selected person's start age through final simulation year; no end age/scope. |
| SS / CNY deposits | Social Security is not modeled and no benefits are ever paid; Cash CNY interest intentionally omitted and potentially restored later. |
| Independent control | Start2026/birth1986/Max89 gives50 rows, both alive; nominal3%/China CPI4%/US CPI3%, zero taxes/spread and disabled shocks/care/property randomness. |

## Required actual facts

| ID | Fact / model input | Resolution needed |
|---|---|---|
| H-AGES | Actual birth years/start-year convention and Max age | Confirm annual inputs; no mortality parameters/death ages are required. Example2027/birth1986 gives41 and T70 at Max110; control2026 gives40. |
| H-STATUS | Citizenship, US income-tax residency, one household China/US domicile and any transition | B's retained-green-card resident-alien income branch is not implemented. Do not route it to NRA. Estate domicile is no longer a field/gate. |
| H-HOLDINGS | Instruments, liquidity, income profiles and asset allocation for1.7M cash equivalents/2M investments | Actual balances and adopted return/yield assumptions; income treatment is fixed by asset with no declarations. CNY deposits always earn zero in current model. |
| H-OWNERSHIP | Account owners/joint shares and property shares | Actual ownership; it stays fixed through the horizon. |
| H-BASIS | Property purchase/depreciation history; brokerage basis always equals starting balance | Actual property basis schedules; avoid both a starting haircut and the same withdrawal tax. |
| H-RETIREMENT | Pre-tax/after-tax split, owner and age/access exceptions | Statements and supported distribution/access rules;1.6M gross is not automatically accessible at40. No inherited-account input. |
| H-HISTORY | Existing capital/passive/FTC histories and pre-start tax bills | Confirm zero or supply schedules. No prior histories are serialized; nonzero initial histories need a model/schema extension. Annual capital-loss carryforward is implemented. |
| H-BUDGET | Initial budget treatment | Every budget uses initial treatment; ordinary follows China CPI. Care stays outside included consumption but is fully funded. |
| H-MEDICAL | Aggregate included38k, premiums/social contributions/out-of-pocket care, shocks, care amount/start/growth | Adopt actual medical assumptions once in Budget; configure additional care and any insurance/shock needs. No People medical base or recurring list. |
| H-PROPERTY | Rent, mortgage service/term, basis/ownership, operating costs/taxes and sale assumptions | Statements/schedules; aggregate731k debt does not establish annual payments. Zero rent is only a sensitivity. |
| H-SSA | Social Security exclusion | No benefits are ever paid and there are no inputs; no survivor entitlement. |

`LEGAL-ALL` labels applicable broad source work, not a runnable-input flag. The current public registry is [src/reference/source-gates.json](../src/reference/source-gates.json); the frozen [18-row M00 registry](source-gates.json) is historical. Checked2025 IRS §1250 subset evidence is separate from broader unverified rules.

## Save/run behavior

Structurally valid incomplete drafts remain editable/exportable. Required missing values and unsupported combinations prevent every Run; source status is displayed separately. Explicit sensitivities use entered financial parameters, not a category/checkbox bypass. Samples and arithmetic controls do not certify actual household FIRE readiness or a dollar funding floor.
