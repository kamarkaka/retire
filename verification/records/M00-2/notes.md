# M00.2 independent fixture verification record

Date:2026-10-18. Artifact preparation: **DONE**. Independent reference arithmetic: **55 PASS /0 FAIL**.
Structural cases prepared:18. Source/data numeric oracles OPEN:7. Product execution: **NOT IMPLEMENTED**.
Human spreadsheet/manual acceptance: **NOT RUN**.

## Inputs and exact arithmetic

Both controls use50 beginning-of-year payments t=0…49, start2026/birth1986, ages40…89.
RMB212k ordinary +38k CPI-linked included health =250k; medical bases/shocks, benefits, property, flex,
taxes and FX spread are zero. Nominal USD return3%, China CPI4%, US CPI3%. One accessible taxable USD
bank-profile account holds cash total return3%. The actual household's B status is not inferred from these controls.

| Control | Payment / discount | PV USD |
|---|---|---|
| Flat FX | `250000/6.69 * 1.04^t / 1.03^t` |2390572.9770677145932828554267970000473442304988766842740735298308 |
| RMB appreciation | `250000/(6.69*.99^t) * 1.04^t / 1.03^t` |3152520.3411145046905392977802592090780936043212755608347596589861 |

Exact ratios: flat q=104/103; appreciation q=10400/10197; first payment=25,000,000/669 USD.
The independent Node reference uses BigInt rational sums, not the future engine's Float64 operations.
Spreadsheet cached values/CSV derive from that independent reference. Excel/Safari/browser recalculation
has not occurred at M00; a final Float64 balance within1e−6 is numerical zero, not a genuine shortfall.

## Specific manual spreadsheet instructions

Open [control-calculations.xlsx](control-calculations.xlsx) in Excel, Numbers or an independent spreadsheet.

1. Select **Flat FX**. Inspect B4:B11:2026,250000,6.69,.04,.03,1,50,1986. Select **RMB appreciation**;
   only annual FX multiplier B9 becomes.99. Keep formula precision; formatting to cents does not round inputs.
2. Confirm data rows14…63 contain exactly50 payments (A14=0, A63=49), years2026…2075 and ages40…89.
   B69 must be50 in both sheets. First USD payment G14 must equal250000/6.69.
3. Show formulas (Excel Formulas -> Show Formulas), then inspect:
   - E14=`$B$5*(1+$B$7)^A14` (CNY spending).
   - F14=`$B$6*$B$9^A14` (start-year FX).
   - G14=`E14/F14`; H14=`(1+$B$8)^A14`; I14=`G14/H14`.
   - B65=`SUM(I14:I63)`; no51st payment is included.
   - K14=`$B$65`, L14=`K14-G14`, M14=`L14*(1+$B$8)`; K15=`M14`.
4. Force spreadsheet recalculation. B65 must display2,390,572.98 /3,152,520.34, B66 first payment37,369.21,
   and final B68/M63 must be within1e−6 of zero. Record full displayed formula/value or export CSV;
   do not accept cached values alone as manual recalculation evidence.
5. Cross-check the two [CSV tables](control-flat.csv) / [appreciation CSV](control-appreciation.csv) and
   independent arithmetic report. CSV values are40-place rational reference values, not product exports.
6. Independently recalculate the following examples, using the spec's index1 tables:

| Case | Specific calculation | Expected / source target |
|---|---|---|
| US-7 | Net capital=−50k+50k=0. TI=100k−16,100=83,900. Tax=12,400*.10+38,000*.12+33,500*.22 |13,170; carry0. ScheduleD/unrecaptured worksheet and Form4797 still need legal confirmation |
| US-8 | Net capital=−50k+20k=−30k. Allowed loss1,500; carry28,500. TI=82,400. Tax=12,400*.10+38,000*.12+32,000*.22 |12,840. Same worksheet sources remain unverified |
| FIRPTA-1 |1M−700k−60k−(1M*.15)=90k closing cash;150k−20k=130k later refund |90k cash/130k refund; IRC1445 buyer-use/certificate application still open |
| TERMINAL-1 |500k current assets−30k unpaid final income tax |470k heirs before beneficiary traditional-account tax; actual-paid remains0 |

7. Inspect every row of [oracles.json](../../fixtures/oracles.json) with `oracle_kind=conditional`.
   Leave partial capital/§1231 buckets, FTC expiry/refund FX, stochastic calibration and crisis historical
   rows OPEN until the specified source/data worksheet is checked. Review every other case's legal status
   separately from arithmetic PASS.

## Human acceptance record

| Check | Human result / actual evidence |
|---|---|
|50 rows, t0…49, same first payment | NOT RUN |
|Both spreadsheets recalculated, PVs and final residual checked | NOT RUN |
|US-7/US-8/FIRPTA-1/TERMINAL-1 hand calculations | NOT RUN |
|Primary-source page/worksheet references and all open gates reviewed | NOT RUN |

Reviewer name/date: ____________________

Spreadsheet/version and actual values: ____________________

Source page/worksheet references: **pending**; see [source-gates.json](../../source-gates.json).

Independent reference report: [arithmetic-report.json](arithmetic-report.json). No fixture imports product
functions; no expected value was produced by the unimplemented engine.
