# Retirement Simulator: Implementation Plan

- **Date:** 2026-10-18
- **Spec:** [Retirement simulator design](2026-10-18-retirement-sim-design.md), including the JavaScript web-app revision.
- **Status:** Software implemented in M00–M11 dependency order for the labeled sample/control workflow. M00 independent artifacts are retained. On user instruction, human sign-offs are retired and acceptance is automated. Current step results, remaining acceptance scope and open gates are recorded in [implementation status](../verification/implementation-status.md).
- **Stack:** React + TypeScript + Vite; pure TypeScript financial engine; browser module Web Workers; ECharts. TypeScript is compiled to JavaScript.
- **Delivery:** A static web app. Users upload TOML or create/edit a configuration in the browser, run locally, and download configuration/results. No server-side scenario files, configuration API or simulation service.

## 1. Implementation and acceptance rules

1. Implement in dependency order, preserving M00–M11 and all step IDs. Each step produces code and automated evidence. A failing numerical check blocks dependent financial integration.
2. Every step’s **Automated verification**, **Expected**, and **Evidence** sections define acceptance criteria. Implement these as unit, integration, CLI, or browser tests with independent literal oracles. No human execution, signature, or approval is required. The numbered inspection actions below describe assertions for automation, rather than tasks for the user. Source research remains a separate OPEN gate when evidence is unavailable.
3. Record the exact revision, Node/npm versions, browser version, OS/hardware, fixture/input hash, model/RNG/reference versions, actual output, expected output, and PASS/FAIL. Record the reason for a failure and repeat the affected check after fixing it.
4. Keep expected answers independent: literal values derived from the spec, a calculator/spreadsheet, the raw source worksheet, or a separately implemented reference algorithm. The verifier must show intermediate amounts, not just a green badge. Never generate a golden answer by calling the function being verified.
5. Use synthetic fixtures and explicitly labeled example/control scenarios during development. Actual household data belongs in local private exports. All configurations share calculation and validation rules. Missing facts and unsupported tax combinations block every run; legal/history source status is displayed separately.
6. Preserve financial corrections: included medical counted once; capital losses carry forward; FIRPTA is closing cash/prepayment; final liabilities/refunds survive death; China FTC uses eligible substantiated payments; residency/domicile/situs are explicit; invalid market factors fail the entire run; survivor benefits obey age/payability gates.

### Verification conventions

- Run commands from `/Users/mengcao/development/retire`. Commands/scripts below are implementation deliverables, available once their milestone creates them.
- `npm run dev`: product at `http://localhost:5173/`; development-only harness at `http://localhost:5173/verification`.
- `npm run check`: all supported numeric, unit, data/build and production browser assertions, followed by current inventory/release reports. Every step ID remains tracked; source/household/Safari OPEN scope is not a successful forecast.
- `npm run verify -- --list`: list case IDs, expected inputs/outputs and implementation status.
- `npm run verify -- --case <ID> --report verification/records/<step>/<case>.json`: run the **same model modules** as the browser, print inputs/actual/expected/intermediates, and save a report. `--all` runs implemented cases and reports unimplemented ones explicitly.
- In `/verification`, select **Case ID**, inspect **Inputs / Expected / Actual / Trace**, then **Run case**. Worker count, chunk size, controlled latent draws and historical tapes are harness controls; they are not extra household config fields.
- Numeric tolerances: money USD/CNY0.01 unless a step requires a stricter bound; integer RNG/state/IDs/counts exact; moment transforms 1e-9; deterministic FX 1e-12. Chart buffers may be Float32, but decisions and monetary scalar KPIs use Float64. Funding residuals at most 1e-6 are numerical zero per spec §6.5; RMB0.01 remains a real shortfall.
- Fixed input tapes and isolated state/settlement fixtures may exercise pure model functions in the harness. Full-engine cases must disclose any injected initial state; taxes are not replaced with a stub to obtain a preferred answer.
- Save automated reports at `verification/records/Mxx-y/notes.md`, with relevant JSON/CSV, screenshots, source row/page references and traces. Keep private configuration/evidence under an ignored local directory. Commit fixture oracles and public source provenance; exclude verification fixtures/records from `dist/`.
- Implemented verification evidence is indexed per step in [implementation status](../verification/implementation-status.md) and `verification/records/Mxx-y/notes.md`. Shared machine reports avoid repeating the same engine run for every milestone. Worker code is bundled inline for loaded offline use; the production build has no test harness payload.
- Every record starts `NOT RUN`, then becomes `PASS`, `FAIL`, or `OPEN: household/legal fact`. An OPEN fact is not a passed household forecast. Implementation and example acceptance can proceed under the documented gate boundaries.

### Milestones and dependencies

**Development reference scope:** When licensed/primary raw historical inputs are unavailable, implement the importer and reference-validation pipeline, then exercise subsequent milestones with a prominently labeled synthetic demonstration bundle. Actual historical replay, raw-row acceptance, and compound calibration against real history remain OPEN. Never label synthetic rows as dot-com/2008 history or clear data/legal gates from arithmetic tests. This permits a complete example end-to-end workflow without inventing household facts.

| Milestone | Deliverable | Depends on | Automated milestone gate |
|---|---|---|---|
| M00 | Contracts, fixture oracles, source/household gates | Spec | Review scope and independent control calculations |
| M01 | React/Vite shell and verification harness | M00 | Production shell builds; dev harness is excluded |
| M02 | Local TOML pipeline and complete builder | M01 | Upload/build/download/re-upload preserves values |
| M03 | Versioned public references and calibration | M00–M02 | Raw rows, population moments and build hashes reconcile |
| M04 | Indexed RNG and market paths | M03 | Seed vectors, timing and domain failures reconcile |
| M05 | Consumption, benefits and investment accounts | M02, M04 | Budget/access/basis journals reconcile |
| M06 | US/China/estate tax and settlements | M03, M05 types | Hand calculations, loss netting and payment eligibility reconcile |
| M07 | Properties and death transitions | M05–M06 numeric checks | Closing/death snapshots reconcile |
| M08 | Deterministic financial year loop | M04–M07 | 50 payments, depletion timing and terminal tax reconcile |
| M09 | Workers, compact summaries and reproducibility | M08 | Worker scheduling changes no path result |
| M10 | Results, ledger, comparison and exports | M02, M09 | Full browser workflow matches immutable runs |
| M11 | Crisis, resource, privacy and release acceptance | M00–M10 | Production build passes recorded acceptance; household gates stay explicit |

## 2. Milestones

### M00 — Freeze contracts and independent verification inputs

#### M00.1 — Translate the spec into model and configuration contracts

**Current evidence:** [Contracts](../verification/contracts.md), [declarations](../verification/contracts.d.ts),
[272-field matrix](../verification/config-field-matrix.md), [result layout](../verification/result-layout.json),
[traceability](../verification/traceability.md) and [historical record](../verification/records/M00-1/notes.md).
Artifacts are prepared; independent integrity/arithmetic checks are recorded. The former human gate is retired.

**Build:** Define the module/API boundaries, serialized key inventory, draft/runnable distinction, ledger/chart fields, path-summary fields, year ordering, RNG identifiers and run manifest. Write a traceability matrix mapping spec sections and review corrections R1–R8 to the step/case proving each rule. Separate public reference assets from user configurations.

**Automated verification:**

1. Read spec §§3, 5.10, 6.9, 7–9 beside the proposed interfaces. Follow upload and builder objects into the same normalizer, then workers, summaries and downloads.
2. Search the proposed architecture for scenario-directory reads, configuration POST endpoints and financial formulas inside React components. Check that property IDs and tax-status fields survive the full route.
3. Inspect the matrix: each accepted review correction has an input fixture, expected answer, owning module and verification step. Check that defaults, units and field omission rules agree with the spec.

**Expected:** One browser-owned config pipeline and one financial engine. Every serialized field has a builder control and round-trip mapping. No required user config exists on the host. Each correction has a concrete verification case; unresolved B status/holdings/medical/property inputs remain named gates.

**Evidence:** `contracts.md`, field/mapping matrix, reviewer annotations and a gate inventory in `verification/records/M00-1/`.

#### M00.2 — Prepare independently calculated fixture oracles

**Current evidence:** [80-case inventory](../verification/fixtures/README.md), [literal oracles](../verification/fixtures/oracles.json),
[independent workbook](../verification/records/M00-2/control-calculations.xlsx), [arithmetic report](../verification/records/M00-2/arithmetic-report.json)
and [reference procedure](../verification/records/M00-2/notes.md). Independent reference arithmetic:55 PASS/0 FAIL;
18 structural cases prepared,7 source/data numeric cases OPEN. The original M00 record predates product execution; new product tests compare against its immutable oracles.

**Build:** Create `verification/fixtures/` with literal inputs, expected values and provenance. Include all spec §11.1 cases and the cases named below. Define the shared `CONTROL-PV`: start 2026, both born 1986, death ages 89, RMB212k ordinary + RMB38k CPI-linked health spending, medical bases/shocks zero, no benefits/property/flex, accessible taxable investment, all applicable tax rates zero, return 3%, China CPI 4%, US CPI 3%, FX6.69 flat, spread0.

**Automated verification:**

1. In a spreadsheet, enter t=0…49, USD payment `(250000/6.69)*1.04^t`, and discount factor `1.03^t`. Sum discounted payments using full precision.
2. Repeat with FX `6.69*0.99^t`; discount payment by the same 3% investment return. Check that both tables start with the same first payment and have exactly 50 rows.
3. Recalculate US-7/US-8, FIRPTA-1 and TERMINAL-1 from the spec; write source/page references beside cases whose legal interpretation remains open. Inspect fixture code to ensure expected answers do not import model functions.

**Expected:** First payment USD37,369.20777279521; flat-FX PV approximately USD2,390,572.9770677146, displayed **2,390,572.98**; 1% annual RMB-appreciation PV approximately USD3,152,520.3411145047, displayed **3,152,520.34**. Exact rational decimal values are retained in the M00 oracles; earlier floating-point sums differ by less than2e-9 USD. US-7 tax13,170/carry0; US-8 tax12,840/carry28,500; FIRPTA cash90k/refund130k; terminal assets500k−unpaid30k=470k. These are controlled arithmetic answers, not household funding recommendations.

**Evidence:** Independent workbook/formulas, full-precision oracle JSON and case provenance in `verification/records/M00-2/`.

**Milestone automated gate:** Review the traceability matrix against the spec and independently open both 50-row control tables. Confirm 50 payments, the two PVs and every open gate; save the machine-readable report. Proceed when contracts/oracles are reviewable; pending legal/household facts remain OPEN.

### M01 — Establish the JavaScript app and verification harness

#### M01.1 — Create a reproducible React/TypeScript/Vite project

**Build:** Create `package.json`, lockfile, strict TS configs, Vite entry and source folders from spec §3.4. Pin compatible Node24 LTS/npm/package versions. Add `dev`, `typecheck`, `test`, `build`, `preview` scripts. Keep the engine package independent of React/DOM. Add ignore rules for dependencies, build output, raw downloads and personal exports.

**Automated verification:**

1. Record `node --version` and `npm --version`; run `npm ci`, `npm run typecheck`, `npm run build` and `npm run preview`.
2. Open the printed preview URL in Chrome and Safari. Inspect Network/Console and open **Upload configuration** and **Create configuration** entry controls.
3. Inspect `dist/` and dependencies. Confirm the deployed output is static app/assets and the model folder imports no React, DOM or server filesystem APIs.

**Expected:** Fresh install/build works at recorded versions; no Console errors; both entry choices appear. No backend/configuration service is needed. Dependencies match the lockfile; the earlier runtime is not a build/runtime requirement.

**Evidence:** Command transcripts, versions, build file inventory and two-browser shell screenshots in `verification/records/M01-1/`.

#### M01.2 — Add the development harness and structured case reports

**Build:** Add `/verification` only in development, `scripts/verify-case.ts`, `verify` script, case selector, raw inputs/oracles/intermediate outputs, and JSON reports. Not-yet-implemented cases show `NOT IMPLEMENTED` and cannot pass. Provide controlled tapes/state only through this development interface.

**Automated verification:**

1. Run `npm run verify -- --list`; compare IDs and literal expected values with M00's fixture inventory.
2. Open `/verification`, select US-7 and CONTROL-PV, and inspect every input/oracle before implementations exist.
3. Request an unimplemented case and an unknown ID. Build/preview again and navigate to `/verification`; inspect bundle contents for fixture/oracle imports.

**Expected:** Inputs/oracles are readable, but unimplemented/unknown cases fail explicitly rather than returning PASS. The production app has no verification route or fixture payload; an SPA fallback may show the normal entry screen. Reports include revision/case/versions/tolerances/actual/expected and source status.

**Evidence:** Case-list/report output, dev screenshots and production bundle search in `verification/records/M01-2/`.

#### M01.3 — Prove worker loading and transfer ownership early

**Build:** Add typed worker messages with run ID/path ranges, a minimal module-worker round trip, transferable buffers and disposal. This is an infrastructure probe using fixed nonfinancial bytes, not a financial simulation.

**Automated verification:**

1. In the dev harness send a `Float64Array([1,2,3])` to a worker by transfer. Inspect the sender's detached buffer and the returned values.
2. Repeat in the production build under the preview URL and the intended deployment base path. Inspect the worker entry in browser tools and module-load errors.
3. Dispose/recreate the worker and send another job with a new run ID; confirm the old response is not displayed as the new job.

**Expected:** Values return exactly `[1,2,3]`; the sending transferred buffer has byteLength0 while detached. Production worker assets resolve correctly. A disposed job cannot replace the new job's output. No SharedArrayBuffer/cross-origin-isolation dependency.

**Evidence:** Transfer/run-ID trace and dev/preview worker screenshots in `verification/records/M01-3/`.

**Milestone automated gate:** Repeat the worker probe in the built app on both browsers, then rebuild from `npm ci`. Confirm correct transfers and that no verification fixture is in the production bundle. Record PASS for the static foundation.

### M02 — Implement portable configuration and the complete browser builder

#### M02.1 — Implement strict TOML parsing, normalization and draft gates

**Build:** Add Zod draft/runnable schemas, `smol-toml` import/export, root schema version1, defaults, deep tax-table merge, canonical hashing and legacy migration preview. Implement spec §9.2 field-path errors, 2MiB limit, finite/safe-integer checks and stable property IDs.

**Automated verification:**

1. Load the documented example; inspect normalized defaults, required classifications and root version. Check n_paths1 and100,000 and seeds0 and4,294,967,295 are accepted.
2. Try malformed TOML, an unknown field, schema_version999, `nan`, paths0/100,001, fractional paths, seed−1/4,294,967,296, max_age below a start age, fixed death above max_age, and a file over2MiB. Check each exact field/size error and preservation of the current draft.
3. Try B=`unresolved`, B=noncitizen/resident, a citizen/nonresident mismatch, duplicate property IDs, missing profile and descending tax brackets. Export/re-import an unresolved draft. Import a versionless old example and inspect migration before applying it.

**Expected:** Syntax/unknown/unsupported/numeric failures never run or silently disappear. Unresolved draft values survive export; a noncitizen resident is never sent to 1040-NR. Legacy migration adds version/IDs and leaves missing tax classifications unresolved. Normalization/defaults are consistent for uploads and builder objects.

**Evidence:** Imported files, error screenshots, normalized objects, migration diff and config hashes in `verification/records/M02-1/`.

#### M02.2 — Build every configuration section and its references

**Build:** Implement all spec §8.1 form sections, numeric/unit handling, optional overrides, add/remove/reorder lists and reference validation. Add `createEmptyDraft`, `createExampleDraft`, `createHouseholdDraft` in browser code. Draft edits update a normalized TOML preview.

**Automated verification:**

1. Create an empty draft and fill a complete example through the UI. Follow the M00 field matrix; edit at least one field in every section, including one-time costs, classifications/notes, survivor flags, rule_of_55, wrapper situs, prior §1231 losses, FIRPTA rates and tax overrides.
2. Add/rename/reorder a property; check its ID is unchanged. Delete an account/profile referenced by withdrawals or properties and check visible errors; repair the reference.
3. Clear numeric inputs and market overrides. Check blank required values remain draft errors, zero is distinct, and a removed override restores “use history.” Create the household draft and inspect its facts/gates.

**Expected:** Every field is editable and appears correctly in the preview. Required blanks do not turn into zero. IDs/metadata/notes persist. Household draft shows both age40, FX6.69, financial total5.3M, property2M/loan731k, recurring budget250k with38k health, `hold`/last-resort-sale=false and unresolved B/assets/medical/property facts. It cannot run.

**Evidence:** Completed field matrix, preview exports, reference/blank screenshots and household draft in `verification/records/M02-2/`.

#### M02.3 — Finish local upload/download and round-trip equivalence

**Build:** Add `File.text()` staged imports, local Blob downloads/revoked object URLs, separate current-draft/run exports, and session-memory state. Preserve all known fields, explicit overrides and unresolved information. Display that Download saves work for re-upload after reload.

**Automated verification:**

1. Download the UI-built example; open the TOML in a text editor. Re-upload it, compare normalized objects and hashes, then reload the page and re-upload again.
2. Edit a UTF-8 note, tax-table override and property label/order; repeat the round trip. Export/re-import a structurally incomplete draft and verify missing required fields remain editable errors.
3. On the production preview, clear Network and perform create/edit/upload/download. Inspect request URLs, methods and bodies; inspect browser storage before and after reload. Then try a bad upload with a good draft open.

**Expected:** Same normalized configuration/hash under the same build. Notes, IDs, overrides and unresolved omissions survive. No config request, file listing or automatic server save; session reload requires re-upload. Invalid syntax/unknown-field imports preserve the good draft. App/worker assets are the only permitted host traffic.

**Evidence:** Both TOMLs, canonical diff/hash, Network trace, storage/reload observations and failure screenshot in `verification/records/M02-3/`.

**Milestone automated gate:** Starting with a blank browser session, create and download a scenario, reload, upload it, and independently compare its normalized values to the builder export. Repeat with the unresolved household draft. Confirm exact round trips, blocked household Run and no transmitted configuration.

### M03 — Bundle public references and reproduce calibration

#### M03.1 — Import verified source rows using Node tooling

**Build:** Add development-only BIFF `.xls` reader, `scripts/import-data.ts` and `data:import`. Import local downloaded Damodaran/FRED files into `src/data/*.csv`; record source edition/retrieval date/raw and output SHA-256. Reject malformed or missing required input rather than substituting rounded design numbers.

**Automated verification:**

1. Run `npm run data:import -- --source-dir <local-directory>` using a real legacy workbook and matching FRED downloads. Parse its “Returns by year” sheet independently and the generated CSV.
2. Compare years1928,1931,2000,2001,2002,2008,2022,2025 for stock/bond/cash/home columns; independently calculate CPI from December levels. Inspect FRED missing cells and each year-end FX selection.
3. Verify 98 consecutive US rows1928–2025; record any unavailable China/FX observations explicitly. Repeat import and compare hashes. Supply a wrong sheet or missing CPI observation to the importer.

**Expected:** Named sheet/columns and Dec/Dec CPI are correct; no percent/decimal mistake or last-November substitution. Source availability is recorded accurately; required missing/malformed data stops the import. Reimporting the same inputs gives identical outputs/hashes. Runtime assets contain reviewed reference data, not raw workbooks or user scenarios.

**Evidence:** Raw source hashes, worksheet coordinates, selected CSV rows, independent CPI calculations and importer reports in `verification/records/M03-1/`.

#### M03.2 — Calculate population moments and freeze reference versions

**Build:** Add `calibrate-data.ts`, `data:calibrate`, `data:verify`, exact window moments/correlations/drawdowns, provisional-reference comparisons, and the bundled tax-table/source registry with all Uniform Lifetime ages72–120. Use population SD with denominatorK.

**Automated verification:**

1. Recalculate selected-window stock/bond/cash/home/CPI mean, population SD and stock/bond correlation in a spreadsheet. Compare exact values with `npm run data:calibrate`; inspect differences from rounded §4 references rather than replacing them.
2. Check each tax-table bracket/rate/deduction and every RMD age against the cited source or mark it unverified. Use age75 divisor24.6 and inspect monotonic divisors/no missing ages.
3. Run `npm run data:verify`; change one CSV value and confirm hash verification fails. Restore it and verify again. Confirm source status/hash changes are included in provenance.

**Expected:** Moments use the exact selected rows and population formula; numerical differences within1e-9. No silent assumption that old rounded/calibration claims are reproduced. RMD1M/24.6=40,650.40650406504. Invalid hashes/table structure fail; legal status stays unverified until actual source checks.

**Evidence:** Spreadsheet, exact calibration JSON, version/hash inventory, RMD source comparison and tamper/restore reports in `verification/records/M03-2/`.

#### M03.3 — Load references in the static app and enforce source gates

**Build:** Compile CSV/JSON references and default tax-table objects into the app/worker build. Validate runtime references and attach hashes to manifests. Report the actual source registry for every configuration. The former verification checkbox/note and all other Simulation metadata are removed; actual values and supported combinations determine Run eligibility.

**Automated verification:**

1. Build/preview and inspect the displayed reference versions/hashes against M03.2. Create/upload an example and a household draft without any server scenario files.
2. Remove required reference input from a temporary build and confirm a clear build/load error. Restore it, warm app/worker assets, then disable network during a running verification job.
3. Set household legal boolean/note while registry checks remain open; attempt Run. Inspect Network for user-config or external source downloads.

**Expected:** Build/runtime hashes agree; missing references do not produce forecasts. Loaded calculation completes without external source/server-config reads. Source status remains visible for every configuration; missing input and unsupported-combination validation applies uniformly.

**Evidence:** Preview version screenshot, missing-data error, offline completion trace and common-validation/source-status report in `verification/records/M03-3/`.

**Milestone automated gate:** Reimport/recalibrate from the archived raw inputs, rebuild, and compare source/output/runtime hashes and selected raw rows. Verify all complete supported configurations use those references with the same calculation rules, and that missing inputs still prevent any configuration from running. Record the verified data scope and all pending legal checks.

### M04 — Implement deterministic streams and market generation

#### M04.1 — Freeze PRNG seeding, output and draw-consumption conventions

**Build:** Implement xoshiro128**, SHA-256 tuple seeding, open uniforms and fixed-order Box–Muller pairs in `rng.ts`. Add independent integer/hash vectors, stream/entity names and version constants. Model code never uses `Math.random()`.

**Automated verification:**

1. Run `RNG-VECTORS`; compare a raw state `[1,2,3,4]` against the reference algorithm's unsigned operations and the literal vector below. Inspect all eight outputs rather than a sample histogram.
2. Independently SHA-256 the exact UTF-8 text `["retire-rng-v1",42,0,"bootstrap",""]`, with no trailing newline/spaces. Compare byte order, four seed words and first outputs.
3. Run uniform endpoint and normal-pair fixtures: raw0/maxuint32, then supplied uniforms(.5,.5). Inspect pair order and consumption for odd/even horizons; an unused second normal must not shift another stream.

**Expected:** Raw-state outputs exactly `[11520,0,5927040,70819200,2031721883,1637235492,1287239034,3734860849]`. Tuple SHA-256 is `ab710528cf1bc287af2b294db0827f5bf5ec8348ee9de1d5ba81169939757f3b`; LE state `[671445419,2277645263,1294543791,1535083184]`; first five outputs `[2406593643,4039661935,1310122810,591680076,881506770]`. Uniforms are strictly between0 and1. Normal pair approximately `[-1.1774100225154747,0]` within1e-12. All-zero seed policy matches the spec.

**Evidence:** Reference calculation/source algorithm, complete RNG report, seed-byte trace and pair-consumption notes in `verification/records/M04-1/`.

#### M04.2 — Implement bootstrap and admissible custom projections

**Build:** Implement joint-row stationary bootstrap, wrap/jump logic and affine projections with exact population moments. Use fixed per-year jump/candidate draws; omitted/zero-vol keys follow spec §4.3.1. Add `MARKET-JOINT`, `MARKET-PROJECTION`, `MARKET-DOMAIN` fixtures.

**Automated verification:**

1. In `MARKET-JOINT`, use a ten-row source with identifiable values in all five columns. Inspect selected row IDs and tuples; force no-jump progression and a jump, including the last-to-first wrap. Verify unused candidates are still consumed.
2. Run the three-row unit projection `[-.2,0,.2]`, mean=.07/vol=.15. Calculate population SD and transformed values independently. Repeat with omitted mean/vol, vol0 and a constant source requesting positive vol. These small sources test helpers; app scenarios still require at least ten years.
3. Run the full-history projection mean=.03/vol=.40; inspect the failing source year/factor. Test return−100% with zero income yield, then the same return with a positive yield that makes its used price factor negative.

**Expected:** Every bootstrap tuple comes from one row; wraps/jumps match supplied draws. Unit source SD0.1632993161855452, transformed values approximately `[-0.11371173070873836,0.07,0.25371173070873836]`; transformed mean.07/SD.15 within1e-9. Positive transforms retain nonconstant correlations; vol0 is constant with undefined correlation. Full-history3%/40% rejects the approximately−112.34% transformed stock year. No clipping/redrawing; an admissible zero balance causes no NaN/division error.

**Evidence:** Selected-row trace, independent projection worksheet, exact moments/correlations and domain-error reports in `verification/records/M04-2/`.

#### M04.3 — Implement China CPI, FX, indices and derived growth

**Build:** Implement CPI AR(1), PPP/drift FX and stress timing, price indices, deposit rate, medical price growth and property factors. Validate generated paths before financial calculations. Add `MARKET-TIMING`, `MARKET-AR`, `MARKET-INVALID`.

**Automated verification:**

1. Use zero sigma, China mean/start=.04, US CPI=.03, FX6.69 flat. Inspect indices at t0,t1,t20 and T; compare with powers of1.04/1.03. For AR transient mean=.04/start=.02/phi=.5, verify first rates. Check deposit floor and medical factor separately.
2. Use drift=log(.99), sigma0; compare S[10] with `6.69*.99^10`. Repeat drift−.01 against `6.69*exp(-.01*t)`. Apply a−15% stress at start_year+3 and check it affects S[3], not S[4]. Reproduce the PPP constant-gap limiting equation from the spec.
3. Force China mean.04/phi0/sigma.02/z−60 in one path/year. Force a valid CPI but nonpositive medical/property factor in separate fixtures; inspect failure before indices/balances are computed.

**Expected:** Start indices1; end-of-year valuations use index[t+1]. AR rates `.03,.035,.0375`; CNY deposit at CPI4%/real rate.5%=4.5%, floor applies below it; medical-price factor1.06. S[10]=6.0503160818089015 in exact1% appreciation; stress S[3] is0.85 of the no-stress value. Forced CPI=−1.16 invalidates the whole run with series/path/year/factor; no probability from surviving partial paths.

**Evidence:** Full deterministic arrays, recurrence worksheet, stress/PPP comparison and invalid-path reports in `verification/records/M04-3/`.

#### M04.4 — Prove stable indexed streams and stochastic calibration

**Build:** Generate per-path latent arrays before the year loop; key properties by persisted IDs and people by slots. Add prefix/parameter/switch/entity fixtures and structural/statistical calibration reports; mark old sampled benchmark claims provisional until reproduced with this RNG.

**Automated verification:**

1. For seed42 compare path IDs0…9 generated alone, in a100-path run and in a longer-horizon run. Compare latent stream prefixes byte for byte.
2. Change spending, disable medical/Social Security, reorder/rename properties, and add a new property ID. Compare existing market, mortality, medical and property streams. Change seed43 and confirm a stochastic path changes.
3. Run the spec's20,000×40 pure-history calibration. Inspect source support, means, correlations, CPI autocorrelation/SD, FX log-change SD and drawdowns against reproduced M03 references. Document any failed provisional tolerance with its exact data/RNG versions; do not adjust tolerances to hide a structural failure.

**Expected:** Path/stream prefixes and existing property noises remain identical for unchanged IDs. Spending/enable switches never shift market draws; seed change affects stochastic draws. Pure history uses only source rows; admissible projections match exact moments. Reference statistical claims receive measured reports, not inherited PASS status.

**Evidence:** Byte/hash comparisons, ID mutation inputs and calibration report in `verification/records/M04-4/`.

**Milestone automated gate:** Review RNG integer/hash vectors, deterministic CPI/FX arrays, joint-row traces and a forced invalid path. Re-run path0 after changing path count/property order; all unchanged streams must match and invalid input must produce no statistics.

### M05 — Implement consumption, benefits and financial accounts

#### M05.1 — Implement spending, budget scope, age windows and flex

**Build:** Implement currency/today's-money indexing, survivor factors, one-time scope, recurring budget/health reconciliation, real-ceiling reporting and return-linked flex. Add `BUDGET-1`, `SPENDING-TIMING`, `FLEX-1`.

**Automated verification:**

1. Use included ordinary212k plus CPI-linked health38k with medical bases0; verify t0 total250k/health38k. Add a medical base38k without removing the health item and inspect the reconciliation error; repair it.
2. Activate care at A's start age+20 with8000 CNY/month; inspect all earlier rows and t20. Give another item survivor_factor.6 and force the first death at end of t0. Add an included/additional one-time expense and check separate totals.
3. Supply last-year return tape `[-.20,.05,.05,.05]`; inspect years0–4 multipliers and flexible/nonflexible expense rows. Repeat five−10% years and disabled flex.

**Expected:** Included costs count once; unrepaired double count is288k and blocks Run. Delayed care is0 before t20 and `96000*cn_index[20]` at t20. Survivor reduction starts t1. Flex `[1,.9,.945,.99225,1]`; repeated losses `[1,.9,.81,.75,.75,.75]`; disabled=1. Medical/one-time/taxes are not flexed; requested consumption remains visible even when unfunded.

**Evidence:** Budget reconciliation, age/survivor/flex ledgers and independent calculations in `verification/records/M05-1/`.

#### M05.2 — Implement medical growth/shocks and mortality

**Build:** Implement per-person medical base/age/price growth, independent occurrence/size streams, shock scope and conditional Gompertz deaths. Add `MEDICAL-GROWTH`, `MEDICAL-SCOPE`, `MORT-1` and fixed-death cases.

**Automated verification:**

1. Put38k in a medical base and remove the38k ordinary health item. Use CPI4%/medical excess2%/age4%; calculate t1 nominal/real health and included consumption under `initial` and `real_ceiling` modes. Inspect20- and50-increment sensitivity amounts.
2. At age60 supply occurrence u=.01 and size z=0; verify50k shock at index1. Switch only its scope between additional/included and inspect both expense/budget totals. Supply a no-shock draw and force an end-of-year death.
3. Numerically integrate conditional survival at age65 for(m88,b9.5)/(m91,b8.5) in an independent worksheet/calculator. Inspect fixed age89, random ages conditioned on start age, flooring and max-age cap.

**Expected:** Medical t1=41,891.20, real40,280, nominal growth10.24%/real6%; included t1=262,371.20. Initial mode discloses growth; real ceiling260,000 has excess2,371.20. Health50-increment real amount699,965.86245 is a sensitivity at90 when starting40; the50-payment horizon ends89. Shock adds50k once; inclusion affects ceiling classification, not funding cost. Life expectancies20.05/22.52±.05; fixed age89 yields final spending age89, with no medical in later years.

**Evidence:** Growth/scope worksheets, shock/death traces and independent mortality integration in `verification/records/M05-2/`.

#### M05.3 — Implement own/survivor Social Security gates

**Build:** Implement master switch, claim ages, COLA/cut once, separate eligibility/overseas flags, manually supplied survivor amount and maximum payable benefit. Add `SS-GATES`.

**Automated verification:**

1. Survivor A starts45; B dies at end of t0. A own monthly2200/claim67, survivor monthly1800/claim62, eligibility/payability true. Give B a much larger future configured own benefit; inspect A at45,60,62,67.
2. Apply a20% trust-fund cut starting at A age62; compare every benefit with the independent indexed amount. Disable own/survivor eligibility/payability individually, then the master switch.
3. Attempt ordinary survivor claim age45 and inspect validation. Check death-year payments belong to start-of-year alive spouses and survivor payments start no earlier than the following year.

**Expected:** Survivor0 at45/60; at62 annual `21600*us_index[17]`, and at67 annual `26400*us_index[22]` from the larger payable own amount. Cut multiplies by.8 once. No sum of own+survivor and no substitution of B's future benefit. Master false gives0 for all years/people; unsupported age45 is rejected.

**Evidence:** Age/flag/cut matrix, actual benefit rows and rejected-config screenshot in `verification/records/M05-3/`.

#### M05.4 — Implement account journals, access, RMD and FX funding

**Build:** Implement per-class balances/bases, reinvested income, proportional withdrawals, year-end rebalance, retirement access/penalty inputs, RMD prior-year balance, withdrawal ordering and conversion. Add `ACCOUNT-BASIS`, `ACCOUNT-REBALANCE`, `ACCOUNT-ACCESS`, `RMD-1`, `CONVERSION-1`.

**Automated verification:**

1. Sell50k from a100k taxable holding/basis60k with no growth; inspect gain/remaining basis. Separately apply10% stock total return and1.3% yield to100k/basis60k. Rebalance stock60k/basis30k and bond50k/basis30k to50/50 with yields0; compare taxable and retirement journals.
2. Test retirement owner40 without early permission, with early trad permission, at55 with qualifying rule_of_55, and at60. Test Roth40 even with the early flag. Confirm the walk skips inaccessible accounts and respects the ordered list.
3. Run RMD1M at75/divisor24.6 using the prior-year balance, not a grown current balance. Use need10k and inspect surplus30,650.4065. Convert6690 CNY need from USD at6.69/spread.003; convert1000 USD need from CNY.

**Expected:** Sale gain20k/remaining basis30k. Reinvestment value110k/basis61,300; yield is not added twice to return. Rebalance sells5k stock, realizes2.5k, final bases27.5k/35k; retirement rebalance has no realized taxable gain. Age40 locked retirement cannot fund; allowed early trad identifies penalty base, never unlocks Roth. RMD40,650.406504; USD need for6690 CNY=1003.0090270812436; CNY need for1000 USD=6710.07.

**Evidence:** Before/after account journals, access walk, RMD source trace and conversion calculations in `verification/records/M05-4/`.

**Milestone automated gate:** Run a one-year synthetic household through spending/medical/benefit/account helpers, independently reconcile sources/uses/basis and verify250k starting consumption with38k health. Re-run with locked retirement and a medical shock: actual requested cost remains visible and the funding shortage is reported.

### M06 — Implement tax arithmetic, eligibility and settlement books

#### M06.1 — Implement resident capital netting and income tax

**Build:** Add property-character inputs, positive loss carryforwards, worksheet ordering, deductions/SS/NIIT/early penalty and indexed tables. Implement US-1…US-8 plus mixed/prior-loss fixtures tied to actual worksheets.

**Automated verification:**

1. Run US-1…US-6 individually and inspect gross inputs, net gains, AGI, deduction, TI, ordinary/preferential buckets and NIIT. Recalculate the regular-bracket and25% cap cases with the spec's index1 tables.
2. Run US-7: ordinary100k, LT securities loss50k, capital-treatment gross§1250 gain50k, prior losses0. Then US-8 with§1250 gain20k. Check raw gains are not added back after netting.
3. Carry US-8's28,500 into a next-year case with current LTCG10k, ordinary100k and MFS; inspect loss deduction/carry history. Pin partial-offset/§1231-lookback cases to the verified worksheet, not a gross-gain shortcut. Check early-trad10k at40 yields a1k penalty when no exception applies.

**Expected:** US-1…6 income taxes `[15517,11261.80,17917.50,30007,34334,63804]`; NIIT `[0,0,2280,3230,1520,1900]`. US-7 TI83,900/tax13,170/carry0; US-8 TI82,400/tax12,840/carry28,500. Next-year net loss18,500, allowed1,500, carry17,000. Eliminated gains never remain in NII. Ordinary/preferential calculations count each net gain once; unresolved worksheet interpretations remain source gates.

**Evidence:** Each case's raw/intermediate/output report, independent bracket worksheet and capital/§1231 source references in `verification/records/M06-1/`.

#### M06.2 — Implement NRA/profile routing and estate arithmetic

**Build:** Route income by declared resident/NRA status and holding profiles, separate FDAP/ECI, retirement origin and estate domicile/holding-wrapper situs. Implement NRA-1, EST-1…3, `SOURCE-1`, supported-combination validation and prepayment/refund settlement helpers.

**Automated verification:**

1. Run NRA-1 and independently sum rental tax2,152, dividend1,000 and SS5,100. For a100k `usd_cash` holding with3% income, compare an assumed qualifying bank deposit profile and assumed US fund-distribution profile.
2. Run estate cases; inspect worldwide versus classified US-situs bases and the citizen-spouse deduction. Change only underlying profiles versus retirement-wrapper situs and confirm the wrapper controls retirement inclusion.
3. Submit B noncitizen/resident or unresolved domicile and unresolved profile/situs; check no NRA forecast. Give a prepayment150k/final liability20k, then150k/200k, and inspect signed settlement/refund without a second charge.

**Expected:** NRA-1=8,252. Profile-only cash income tax0 versus300 under the assumed10% dividend rate; this verifies routing, not a specific ticker's legal classification. Estate T(1M)=345,800/T(60k)=13,000; NRA2M=732,800; citizen16M with15M exclusion=400k. Unsupported statuses block; refund130k or remaining due50k, never both or a repeated full bill.

**Evidence:** Income/situs mapping, estate calculations, blocked-status errors and settlement journal in `verification/records/M06-2/`.

#### M06.3 — Implement China tax, eligible payments and vintage FTC

**Build:** Implement CN-1/CN-2, six-year assumptions, income-category eligibility, final source-tax liability/payment allocation, country limit, payment-year adjustments and five-year carry records. Separate projected credits, actual remittances/refunds, unpaid tax and confirmed/conditional receivables.

**Automated verification:**

1. Run CN-1 with its20k CNY US tax explicitly eligible, finalized and paid. Recalculate flat dividends/rent and comprehensive pension brackets. Run CN-2 with dividend tax5k plus China-exempt SS tax5.1k.
2. For China precredit tax10k and eligible final source liability10k, set actual source payment4k with6k still unpaid. Inspect eligible paid pool, projected10k versus used4k and adjustment. Refund/reallocate source tax in a separate fixture and inspect the income/payment/vintage record.
3. Use excess credit with five following-year vintages; independently review expiry inclusive years from the primary source before finalizing its oracle. Confirm carry is pooled by source country, not US-style baskets. Present gross FIRPTA150k against finalized eligible liability20k and inspect the cap.

**Expected:** CN-1 precredit73,080/credit20,000/due53,080. CN-2 eligible5k/due5k; SS tax5.1k is excluded. Partial payment permits at most4k used credit, leaving6k China due versus the projected zero; unpaid6k is not cash/credit. Refundable withholding is not150k of permanent eligible tax. Provenance/expiry stay visible; legally unconfirmed allocation/expiry cases remain OPEN.

**Evidence:** China bracket worksheet, component filters, actual-payment/adjustment trace and vintage/source checks in `verification/records/M06-3/`.

#### M06.4 — Audit primary sources and report source status

**Build:** Complete `legal-sources.json` with each rule's edition/date, conditions, verification evidence and affected cases. Apply input/combination validation uniformly and show source status for every configuration. Keep unresolved treaty/pension/IRA/SSA/situs rules explicitly unverified.

**Automated verification:**

1. Compare every spec §6.9 row with the registry and owning case: brackets/senior deduction, Schedule D/Form4797, FIRPTA, passive death losses, estate/wrapper situs, treaty income, China FTC/payment/refund rules and SSA eligibility/age/payability. Include access/penalty/RMD exceptions used by accounts.
2. Open each available primary document and record the exact worksheet/page/conditions supporting the implementation. If inaccessible or ambiguous, record the missing evidence and leave that item unverified.
3. Import identical complete inputs with each legacy kind and with the kind omitted. Verify that all normalize and execute identically, independent of removed legacy metadata. Test a falsely resolved B status that still uses an unsupported branch.

**Expected:** No confidence label becomes verified without evidence. Every configuration uses the same calculations and supported-combination checks. Source verification remains a separate status; no verification checkbox or note exists in the current schema. Numeric US/CN/estate regressions may pass while legal/household acceptance remains OPEN. An unsupported retained-green-card branch remains blocked until separately implemented.

**Evidence:** Source-to-rule/case matrix, supporting pages and blocked/permitted run records in `verification/records/M06-4/`. This step records an accurate source audit; it does not certify unresolved law.

**Milestone automated gate:** Inspect US-7, US-8, CN-2 and FIRPTA settlement traces together. Reconcile losses, eligible payments and refunds independently; then run identical complete configs with each legacy kind and without it. Arithmetic and results must match, while missing inputs and unsupported branches remain blocked. Record legal status separately from numeric acceptance.

### M07 — Implement properties, sale liquidity and death transitions

#### M07.1 — Implement property cash/basis/mortgage journals

**Build:** Implement rents/fees/cost indexing, mortgage payment/interest/principal, capped property tax, depreciation, gain character and §1231 lookback. Keep tax income distinct from cash flow and property equity. Add `PROPERTY-BOOKS` and source-checked character cases.

**Automated verification:**

1. With cost600k/land20%, calculate annual depreciation and remaining depreciable basis. Step through the last depreciation year and one following year. Compare rents/management/vacancy and price-linked costs with explicit inputs.
2. Amortize a100k loan at0% over10 years: check10k annual principal and no interest; then a nonzero-rate example against an independent amortization schedule. Inspect cash principal versus deductible interest.
3. Sell an appreciated/depreciated property and compare adjusted basis, gross gain, §1250/other capital/ordinary portions and the five-year §1231 history. No realized gain is produced by an unsold hold strategy.

**Expected:** Depreciation17,454.54545455/year, never beyond480k total. Zero-rate mortgage balances90k…0; no payment after term. Cash payments/equity/tax deductions reconcile without double-counting debt. Property character/history match the applicable worksheet or remain a blocked legal case; no sale means no sale gain.

**Evidence:** Property/depreciation/mortgage journals, independent schedule and gain-character source comparison in `verification/records/M07-1/`.

#### M07.2 — Implement feasible sales, FIRPTA and hold restriction

**Build:** Execute strategy/last-resort sales using costs, mortgage payoff and per-owner withholding; feed real prepayment records to tax settlements. Keep an infeasible sale unexecuted. Add `FIRPTA-1`, `SALE-FAIL`, `HOLD-1`.

**Automated verification:**

1. Sell1M with700k mortgage,60k costs and sole foreign-owner rate15%. Inspect90k closing cash,150k prepayment, final liability20k and next-year refund130k. Repeat50/50 ownership with resident A rate0/foreign B rate15%.
2. Try price1M, mortgage900k, costs60k and150k withholding: closing deficit110k. Run with no other funds, then with sufficient accessible funds. Check property ownership/basis/prepayments/gains before and after.
3. Force spending exhaustion with `strategy=hold` and `last_resort_property_sale=false`; then explicitly enable last-resort sale in a separate control.

**Expected:** Sole-seller90k/prepay150k/refund130k; half foreign withholding75k/closing165k, attributed to B. Unfunded deficit leaves property unsold, no realized gain/prepayment, `sale_failed` visible. Funding a deficit reduces actual liquid cash. The household's hold/false control never sells, including during a shortfall.

**Evidence:** Before/after sale and tax journals, infeasible-close traces, ownership attribution and hold ledger in `verification/records/M07-2/`.

#### M07.3 — Implement pre-transfer death snapshots and terminal settlement

**Build:** Prepare final-return passive deductions, preserve capital/passive attributes until final tax, compute estate bases before transfer, handle same-year deaths, survivor account origin/access/basis and signed terminal dues/refunds. Add DEATH-1/2, TERMINAL-1 and `DEATH-SNAPSHOT`.

**Automated verification:**

1. With suspended passive loss30k, test relevant basis increases20k and50k. Inspect final tax inputs **before** attribute expiry. Reconcile survivor basis/ownership and retirement origin separately from deceased final liability.
2. For simultaneous deaths and a1M US-situs estate owned50/50, inspect two500k pre-transfer bases; confirm no survivor marital deduction or second inclusion of transferred ownership. Compare tentative T(500k)=155,800 and NRA credit13k under the assumed supported classifications.
3. Set terminal assets500k/unpaid30k/no other tax and inspect net470k with cash-paid unchanged. Add confirmed refund130k or an unpaid source-tax contingent credit; verify signed deficits and no repeated mortgage/prepayment/estate deduction.

**Expected:** Permitted passive deductions10k and0. Simultaneous estates use original500k shares; citizen estate tax0 at the default exclusion and NRA tax142,800, before any separately disclosed liabilities. Terminal470k before heirs' traditional-distribution income tax; confirmed refund adds once, unpaid source credit is conditional/zero conservative recognition. Estate shortfall is separate from living-household depletion.

**Evidence:** Pre-transfer/final-return/expiry trace, independent estate calculation and signed terminal reconciliation in `verification/records/M07-3/`.

**Milestone automated gate:** Walk through FIRPTA-1, an unfunded sale and a same-year death with the raw snapshots visible. Independently reconcile cash, basis, prepayment, final liability and estate ownership. Confirm hold/false never sells and no final-return attribute expires before tax.

### M08 — Integrate the deterministic financial year loop

#### M08.1 — Implement annual ordering and the exact50-payment control

**Build:** Implement `engine.ts` in spec §5.10 order, using pure household/account/property/tax functions and a Float64 ledger. Attach start-of-year alive flags, end-of-year indices/FX, raw settlement provenance and path summary. Use M00's full-precision `CONTROL-PV` balance/basis.

**Automated verification:**

1. Run CONTROL-PV as one path in the harness; download its full ledger. Inspect every year t0…49 against the independent spreadsheet recurrence `B[t+1]=(B[t]-W[t])*1.03`.
2. Check t0 payment37,369.20777279521/end balance2,423,799.8823737665, t1 payment38,863.97608370702, and t49 payment255,356.85244474807. Verify valuation at FX[t+1]/price_index[t+1], taxes0 and no payment after both deaths.
3. Count spending rows/ages40…89 and inspect final-row alive flags. Extend both fixed death ages to90 without increasing starting wealth; inspect the added payment/shortfall. Create a separate RMB0.01 funding deficit to test numerical-zero handling.

**Expected:** Exactly50 funded payments; final balance withinUSD0.01 of zero and no false depletion from sub-micro roundoff. Death-year alive flags are1, subsequent padding is NaN/blank rather than funded zero-cost years. The51st requested payment isUSD265,571.126542538 and is unfunded. A true RMB0.01 shortage remains reported. This is a tax-free budget/timing control, not a household-after-tax conclusion.

**Evidence:** Actual/independent50-row ledgers, first/last/51st row comparison and numerical-boundary report in `verification/records/M08-1/`.

#### M08.2 — Verify access, FX and living-household depletion

**Build:** Add `CONTROL-DEPLETION`, `CONTROL-FX`, `CONTROL-HOLD` full-engine fixtures. Preserve requested consumption, funding shortfall, first depletion, ceiling breach and estate shortfall separately.

**Automated verification:**

1. Run zero-return/inflation/spread control at FX7: A starts60 with120k Roth plus empty taxable surplus account; A lives through t10, B dies end of t0, consumption7000 CNY/month/survivor1, benefits/medical/property/flex/taxes off. Inspect each withdrawal/shortfall.
2. Run CONTROL-PV with FX drift=log(.99), using full starting PV3,152,520.341114506; compare all50 rows with M00.2. At flat3% USD return/CPI4%, independently compute one-year real CNY returns with and without appreciation.
3. Lock all substantial assets in inaccessible retirement/property, force positive expenses, and keep hold/false. Then add an included medical-growth ceiling breach while leaving ample liquid assets. Inspect separate solvency/budget/estate flags.

**Expected:** Roth withdrawals12k/year; t9 closes at0 without a funded-expense failure; first shortfall t10 is84k CNY. FX-appreciation control funds50 payments at the independent PV. Real CNY returns: flat FX−0.9615384615%; 1% appreciation−1.9519230769%, before tax. Illiquid wealth does not prevent a living funding failure; hold never sells. Ample assets can be solvent while breaching a real ceiling; estate shortfall is distinct.

**Evidence:** Per-year sources/uses, FX/control spreadsheet and three separate flag reports in `verification/records/M08-2/`.

#### M08.3 — Verify final bills, prior bills, refunds and payment order

**Build:** Integrate next-year settlement queues, US-payment-before-China-FTC ordering, death finalization and terminal netting. Add `ENGINE-FINAL-TAX`, `ENGINE-PRIOR-TAX`, `ENGINE-FIRPTA`; fixtures use real tax modules and documented override tables. All three use constant FX1 and zero inflation/returns/yields; the receiving cash profile is an explicitly assumed qualifying bank deposit with non-US estate situs, and there is no B-owned retirement balance or terminal estate tax.

**Automated verification:**

1. ENGINE-FINAL-TAX: A age60/trad650k/return0 spends150k USD in the first year, both die end of that year. Use flat20% ordinary US rates, zero standard deduction, no other tax/income/property/benefits, B owns no assets; use supported classifications and China exemption assumptions. Inspect150k distribution, computed30k final tax and terminal result.
2. ENGINE-PRIOR-TAX: same setup, both die in the second year; the150k expense is active only in year0. Follow the30k prior bill through a new trad withdrawal in year1, its own new tax liability and terminal settlement.
3. ENGINE-FIRPTA: sole B property sells at the start of year0, price1M/basis840k/depreciation0/mortgage700k/costs60k/withholding15%; no other income/costs/returns. Use FX/purchaseFX1, flat20% US ordinary tables with standard deduction0 and LTCG thresholds0, plus China20%/eligible source credit under explicit control assumptions. Inspect100k gain/final20k liability,90k cash,130k next-year refund. Repeat with both deaths in year0 and inspect confirmed terminal receivable.
4. Inspect a partial/unpaid eligible-source-tax case from M06.3 in the year trace: actual US payment is recorded before China credit/payment is finalized; unpaid source tax never becomes credit or cash.

**Expected:** Final-tax case: assets500k, unpaid30k, cash-paid0, net heirs470k. Prior-tax case: year1 cash-paid30k funded by trad30k, current tax6k, assets470k, net heirs464k; the new withdrawal tax does not vanish. FIRPTA case:90k year0,220k after refund, permanent federal tax20k; terminal receivable130k adds once. Prepaid150k is not charged again, not all creditable tax, and not investment income. No final/prior bill, death deduction or refund disappears when simulation stops.

**Evidence:** Full income/payment/FTC/death-year traces, override TOMLs and independent terminal reconciliations in `verification/records/M08-3/`.

**Milestone automated gate:** Run CONTROL-PV, CONTROL-DEPLETION and all three tax/refund year-loop fixtures; independently reconcile the first/last/depletion/settlement rows. Expected answers must match before Monte Carlo parallelism or presentation can obscure a financial failure.

### M09 — Add workers, summaries and scheduling-independent results

#### M09.1 — Execute bounded path chunks and aggregate off the main thread

**Build:** Implement `pool.ts`/worker protocols with immutable run snapshots, path-indexed assembly, transfer ownership, bounded chunks and analysis-worker aggregation/replay. Define typed-array field order and byte accounting. Default worker cap4.

**Automated verification:**

1. Run a200-path example; inspect assigned/returned path ranges, buffer lengths and completion counts. Delay one chunk in the harness so chunks arrive out of order.
2. Compare the assembled path0/path199 ledgers/summaries with direct single-path engine results from the same snapshot. Inspect that transfers avoid retaining cloned full market/ledger objects.
3. Start2000 paths and type into a draft field/switch tabs while recording browser Performance. Inspect simulation/aggregation work on worker threads and memory estimates before allocation.

**Expected:** Every requested path appears exactly once, indexed by ID, regardless of chunk arrival. Only compact chart/summary data is retained per path; full ledger replay uses its snapshot. Heavy loops/quantile sorting run in workers; typing/tab response target250ms and no simulation-attributed main-thread task over100ms. Byte lengths match the declared shapes.

**Evidence:** Chunk ownership/index trace, direct-versus-pooled path diffs, Performance trace and byte inventory in `verification/records/M09-1/`.

#### M09.2 — Implement quantiles, cohorts, rankings and scalar KPIs

**Build:** Implement spec §7.2 Type7 quantiles, alive denominators, success/depletion/estate/budget metrics and stable representative-path ranking. Monetary scalar KPIs use Float64, not chart-quantized balances. Add `SUMMARY-1` and `RANKING-1`.

**Automated verification:**

1. At one year use five paths: four alive with values1,2,3,4 and one dead/NaN. Exactly one of the four alive paths is depleted, while the dead path never depleted. Calculate bands and percentages by hand; then make all paths inactive.
2. Rank four paths: ID2 depletes year3, ID0 year5, ID3 never depletes/terminal100, ID1 never depletes/terminal200. Inspect worst/10th/median selections and tie-breaks. Give one otherwise successful path an estate shortfall.
3. Inspect actual fiscal/terminal scalar values beside Float32 chart data for a large-balance fixture. Verify terminal liabilities, excluded conditional credits, lifetime cash taxes and ceiling excess totals against the full replay.

**Expected:** p10=1.3/median2.5/p90=3.7; alive80%, alive-and-not-depleted60%, conditional-on-alive75%, lifetime success80% in the stated five-path fixture. Empty bands have no value. Ranking `[2,0,3,1]`; worstID2,10thID2,medianID0 using floor(q*(N−1)). Estate shortfall changes its metric, not living success. Scalar financial decisions/KPIs reconcile to Float64; chart precision is not silently substituted.

**Evidence:** Independent cohort/rank table, raw summary report and scalar-versus-chart/replay comparison in `verification/records/M09-2/`.

#### M09.3 — Verify reproducibility, prefix stability and immutable replay

**Build:** Complete canonical run manifests, exact cache keys, serial/parallel/common-random checks and replay API. Include model/RNG/build/reference/effective-tax hashes and stable entity IDs.

**Automated verification:**

1. Run the same stochastic1000-path config/seed42 with one/four workers, different chunk sizes, and delayed reverse-order completion. Compare raw chart buffers, Float64 summaries and path0/17/999 replay byte for byte in the same browser.
2. Increase to2000 paths; compare original path IDs0…999. Change only spending and compare market/latent hashes; change seed, a reference hash and tax override individually and inspect cache invalidation/manifest changes.
3. Start a run, edit the draft, complete/pin/replay it and compare with the original snapshot. Repeat goldens in Chrome/Safari, checking exact integer vectors/discrete decisions and monetary tolerance0.01.

**Expected:** Same-browser numeric results are exact across schedules; execution metadata can differ. Increased path count preserves original path outputs. Spending edits do not reshape latent markets, while cash results change as modeled. Replay/baseline never use newer draft fields. Seed/reference/table/model changes cannot produce a stale cache hit. Cross-browser acceptance does not promise identical transcendental bits.

**Evidence:** Byte/hash/diff reports, manifests before/after edits and two-browser golden comparison in `verification/records/M09-3/`.

#### M09.4 — Implement cancel, full-run failure and stale-message protection

**Build:** Implement ready/preparing/running/summarizing/completed/canceled/failed state machine, worker termination, run-ID guards and cleanup of partial/detached buffers. Preserve a previous completed result only with its own “previous run” label.

**Automated verification:**

1. Cancel a long run during simulation and again during aggregation; inspect UI and worker disposal. Immediately start a new seed/path-count run and deliberately deliver an old completion message in the harness.
2. Force invalid Gaussian CPI in a later path after some chunks have finished. Check all job statistics and allocated partial buffers are discarded; inspect the reported path/year/factor.
3. Repeat cancel/restart five times while observing workers and memory; return to the last completed baseline and replay it.

**Expected:** Cancel state within1s and active job workers stop; no canceled/failed job gets KPIs or pin/export-result controls. A late message cannot alter the new run. Any invalid path fails the entire requested job; no denominator reduction or resampling. Worker/buffer retention stays bounded rather than growing with retries; prior completed results remain identifiable/replayable.

**Evidence:** Timing/state/worker/memory trace, forced-failure report and stale-message demonstration in `verification/records/M09-4/`.

**Milestone automated gate:** Repeat one/four-worker1000-path runs and exact path/summary comparisons, then cancel/restart and force a late domain failure. All schedules must agree; incomplete jobs must never yield probabilities. Record worker-memory cleanup.

### M10 — Complete results, ledger, comparison and browser exports

#### M10.1 — Add run controls, validation summaries and assumption previews

**Build:** Connect the full builder to immutable RunRequests, progress/cancel, common input validation, source status, budget reconciliation, effective market moments and assumption notes. Debounce/offload expensive previews; keep financial formulas in model modules.

**Automated verification:**

1. Upload the complete example, run200 paths, and inspect matching config hash/seed/path count. Edit a field during the run; confirm old results remain associated with old inputs.
2. Compare budget/health totals with M05.1 and medical growth at representative ages with M05.2. Toggle market mean-only/vol0/clear override and compare arithmetic/compound previews with M04 outputs.
3. Load the actual household draft, inspect all open fields and attempt Run; fix only one gate and repeat. Try an invalid projection and descending tax brackets through the UI.

**Expected:** Consistent controls, units, first-year totals and exact effective previews.3% arithmetic with volatility is not described as3% compound. Gates list all remaining errors and block Run; household facts are never silently inferred. Editing a draft cannot retitle or mutate active/pinned output; examples/controls retain labels.

**Evidence:** UI/config/preview comparisons, gate screenshots and active-versus-draft manifests in `verification/records/M10-1/`.

#### M10.2 — Add charts and reconcile labels/metrics

**Build:** Add ECharts fan bands, survival/depletion curves, histogram, medical/budget disclosures, terminal/heir metrics and assumptions views. Plot aggregated years/quantiles rather than every full path. Support real CNY/default, real USD and nominal toggles.

**Automated verification:**

1. Load SUMMARY-1 and deterministic CONTROL-PV results through the harness display. Inspect p10/median/p90, cohort percentages, final death year and empty post-death bands.
2. At a selected year independently convert/deflate nominal balances using FX[t+1] and the relevant price index. Toggle currencies and compare chart tooltip/KPI units.
3. Display a ceiling-breach solvent path, depleted property-rich path, and estate-shortfall path. Compare each separate KPI with raw summaries. Compare the reference60/40 assumptions chart with the configured household allocation and label.

**Expected:** Correct Type7 bands/cohorts and value conventions; inactive bands are absent, not a zero-wealth forecast. Pre-tax account balances and net-to-heirs exclusions are visible. Budget/solvency/estate are separate metrics. The reference60/40 return chart cannot be mistaken for a differently allocated household portfolio; FX help uses the real CNY formula.

**Evidence:** Tooltip/KPI screenshots, independent conversion calculations and raw summary-to-chart mapping in `verification/records/M10-2/`.

#### M10.3 — Add full-precision ledger/provenance and immutable comparison

**Current ledger amendment:** Default rows also show opening liquid USD/net worth CNY, complete medical costs, non-medical spending and weighted annual financial return. Capture opening values before cash flows; include all health-category costs in the medical split; include CNY deposit return at opening FX. The core 54-column buffer is preserved, with five per-year report values and 59 CSV columns. Verify mixed USD/CNY cash, property mortgage equity, FX moves and prior-year tax payment timing against independent numeric fixtures.

**Build:** Add path-ID/representative selection, worker replay, ≤100-row pages, selected-year tax/payment/FTC/death detail, pin/unpin and paired/unpaired comparison. Keep one baseline and account for its memory.

**Automated verification:**

1. Select worst/10th/median in RANKING-1 and arbitrary path17 of a stochastic run. Compare displayed ledger/detail to M09 replay; paginate and inspect final-year/after-death treatment.
2. Pin seed42/1000 paths; change only spending and rerun with matched versions/timeline. Verify identical latent hashes and computed KPI/median deltas. Change seed/path count/start year and inspect compatibility status/rerun controls.
3. Edit active draft, upload another config and replay the pinned ledger. Reset only tax overrides and confirm other fields survive; unpin and inspect released retained bytes.

**Expected:** Actual path selection follows stable ranking; full tax/refund/death provenance matches Float64 replay. Baseline uses its original snapshot. Matched household changes are paired; mismatched controls/versions are labeled unpaired and never claim identical draws. Pagination bounds rendering; memory drops after unpin/release.

**Evidence:** Selected-path replay comparison, compatibility/delta table, baseline manifest and retained-byte observations in `verification/records/M10-3/`.

#### M10.4 — Complete config/run/ledger downloads and end-to-end round trip

**Build:** Add distinctly labeled current-draft/completed-run TOML, JSON manifest and round-trip-safe numeric CSV exports. Revoked object URLs and local-only file controls must work in the production build. Add relevant Playwright regression flows for these state/data invariants.

**Automated verification:**

1. In preview upload/build an example, run/pin, edit the draft, then download both draft and completed-run configurations. Open files and compare each with the correct snapshot/hash.
2. Export path17 CSV and manifest; inspect numeric precision, inactive blanks, field order/units and path/run identity. Recompute one FX/real-balance/tax-settlement row outside the app from the CSV.
3. Reload, upload the completed-run TOML under the same build, rerun its seed/path count and compare scientific outputs/manifest hashes. Inspect Network during all upload/download/run actions.

**Expected:** Draft and run files differ exactly where edited; no old snapshot is passed off as current. CSV preserves Float64 values rather than display cents, post-death blanks and provenance. Under the same versions, reload/re-upload reproduces results. No config/file-list/save/simulation request reaches the host; JSON manifest has enough version/hash context to identify the run.

**Evidence:** All downloaded artifacts, external row calculation, replay diff and production Network capture in `verification/records/M10-4/`.

**Milestone automated gate:** From a blank production-browser session: create/upload, run, edit, pin/compare, replay/export, reload/re-upload/rerun. Independently reconcile a ledger row, paired delta and scientific manifest. Check all financial/config content stays local and the household draft remains gated.

### M11 — Verify scenarios, resources, privacy and release readiness

#### M11.1 — Reconcile household scenarios and the3% compound assumption

**Build:** Add a reproducible development calibration for a stated reference allocation/volatility and a scenario matrix: exact control; verified after-tax household baseline; FX appreciation/stress; medical scope/growth; stochastic markets; longevity. Keep actual unresolved facts in the household draft. Document the scope of any3% compound target.

**Automated verification:**

1. Inspect the household draft: financial1.7M+2M+1.6M=5.3M gross; property2M/loans731k; spend250k with38k included health; ages40; FX6.69; China CPI4%; nominal deterministic return3%; hold/false. Reconcile wrappers/bases/ownership/liquidity and medical categories to actual evidence before clearing their gates.
2. For a synthetic40/60 stock/bond reference, keep chosen population vols and jointly shift means by a documented scalar. Independently calculate each annual portfolio return `.4*r_stock+.6*r_bond` and geometric mean `exp(mean(log1p(r_portfolio)))-1`; solve for3% over the exact reference window. Validate every transformed/used factor; do not substitute3% arithmetic mean at positive volatility.
3. Run the scenario matrix with the same compatible latent draws. Inspect every step added to the tax-free control: access/tax, FX, medical growth/shocks, then market/longevity variation. Check gross starting retirement assets are not haircut and taxed again. Medical included/additional scope and budget mode remain explicit.

**Expected:** Arithmetic controls match M08; financial balances total5.3M before internal withdrawal tax. Reference calibrated geometric mean3% within1e-6, with disclosed per-asset arithmetic means/vols and window. This target describes that reference allocation/window, not a guarantee that a cash-changing household, finite stochastic path or after-tax return is3%. Invalid calibration is rejected. All configurations execute through the same engine when their required inputs and tax branches are supported. Source status and assumptions accompany every result; unverified references do not become verified through execution.

**Evidence:** Household reconciliation/gate list, independent geometric-return/calibration worksheet, normalized scenario matrix and manifests in `verification/records/M11-1/`.

#### M11.2 — Replay dot-com/2008 annual losses and sequence effects

**Build:** Add development historical-tape cases using M03's verified2000–2002 and2008 rows, fixed property/medical/mortality draws and stated allocation. Report source-year-to-simulation-year mapping. Keep amplified stresses separately labeled. Preserve capital-loss carryforward in taxed crisis cases.

**Automated verification:**

1. Replay raw2000/2001/2002 at t8/9/10 and raw2008 at a separately specified index for the40/60 reference. Independently calculate yearly weighted returns and compound factors from the actual stock/bond rows; verify annual rebalance/withdrawal timing.
2. Compare a no-withdrawal tape with its reversed order: compound product must match. Then use a100k accessible portfolio/10k annual withdrawal/control tax0, with returns−20% then+25%, and reverse them. Inspect each year-end balance.
3. Compare historical replay, no-crisis control and an explicitly amplified stress. Repeat a realized-loss case with normal tax rules and confirm its carryforward offsets later eligible gains; inspect premiums/care/FX/tax changes separately from the market loss.

**Expected:** Historical annual portfolio return is the weighted sum of verified calendar-year asset returns, not a compressed equity peak-to-trough fall. In the two-year withdrawal oracle, bad-first ends77,500 and good-first82,000; without withdrawals both finish100,000. Tax carry is retained instead of inventing permanent loss-year tax drag. Any hybrid path—historical rows inserted into otherwise fixed3% years—is labeled as such, and an amplified crisis is labeled sensitivity rather than a historical planning minimum.

**Evidence:** Raw-row comparison, source/simulation mapping, independent weighted/compound/sequence calculations, crisis ledgers and loss-carry trace in `verification/records/M11-2/`.

#### M11.3 — Measure production performance, memory and cancellation

**Build:** Finalize bounded workspaces, transfer/aggregation/cache ownership, run memory estimator and documented resource budget. Optimize only measured bottlenecks while rerunning affected numeric/reproducibility checks. Record desktop browser support and feasible run limits.

**Automated verification:**

1. Build/preview on the recorded M4 Pro/browser, warm app/reference/worker assets with a1-path run and unpin the baseline. For n_paths2000 and20,000, time three genuine computations with seeds42/43/44 from Run to ready KPIs. Confirm no completed-result cache hit; record horizon52, worker count and versions.
2. Sum retained chart/summary buffer byteLengths. For20,000×52×8 Float32 fields compare33,280,000 chart bytes; verify total retained result under50,000,000. Inspect browser/worker peak memory and distinguish measured process/heap memory from deterministic buffer accounting.
3. Try100,000 paths, including a pinned baseline, against the resource estimate. Chart buffers alone are166,400,000 bytes for the example; the age40/max110 upper horizon is71 and alone requires227,200,000. If rejected, inspect unchanged requested count/clear estimate; if admitted, verify all100,000 paths and bounded workspace.
4. Record a separate Performance trace while typing/switching tabs, cancel simulation/aggregation, then restart. Repeat measured critical checks in Safari and Chrome; do not use tracing overhead as the normal runtime benchmark.

**Expected:** Three warm runs at each standard size meet <10s/<90s targets; report median/max. Retained result bytes satisfy the stated gate; total peak/pinned/temporary costs are not hidden. Run count never silently decreases. UI response≤250ms and cancel/worker stop≤1s; no simulation-attributed main-thread task>100ms. A failed speed/memory check stays FAIL until a concrete fix and required numerical regression verification.

**Evidence:** Timing table, hashes/seeds/hardware/versions, byte worksheet, peak-memory method/trace, resource preflight and cancel timings in `verification/records/M11-3/`.

#### M11.4 — Verify static hosting, local files and offline computation

**Build:** Finalize the static bundle/base paths and loaded-worker/reference availability. Keep user configuration processing, scenario construction, comparison and downloads within browser memory. Exclude dev fixtures/raw source data/private exports from production.

**Automated verification:**

1. Serve only `dist/` from a static host/preview, with no server scenario directory/config API. In a clean browser create a scenario, enter a recognizable test-only note, upload/download TOML, run, replay and compare. Inspect all Network URLs/methods/bodies and Console.
2. Warm app/worker/analysis assets and all result views, set Network offline, and run a different seed/config not already cached. Verify calculation, local download/upload and ledger replay; document that a cold offline first visit/PWA installation is outside v1.
3. Reload, verify no automatic server/session restore, and re-upload the downloaded TOML. Inspect browser storage and static distribution for user files, dev harness/oracles, raw workbooks and external data fetching. Repeat under the intended static deployment base path and both supported browsers.

**Expected:** App works with only static app/reference assets. No configuration contents/file listing/server-save/simulation/telemetry request; the test note is absent from network bodies. Loaded calculations/replay work offline without a result-cache shortcut. Reload requires re-upload; chosen files are local. Workers resolve under the production base path; no dev fixtures/private exports are shipped.

**Evidence:** Production file inventory, Network/Console captures, offline fresh-run/replay results and reload/storage observations in `verification/records/M11-4/`.

#### M11.5 — Perform the final automated acceptance and report open gates

**Build:** Add usage/run/export instructions and a release checklist mapping all42 steps,12 milestone gates, supported classifications/browsers, reproducibility versions and known deferred scope. Add relevant automated financial/browser regressions; retain historical evidence and current automated reports.

**Automated verification:**

1. Open every step/milestone record for the final revision; inspect FAIL/OPEN items, stale evidence and source applicability. Run `npm run typecheck`, `npm test`, `npm run data:verify`, `npm run verify -- --all`, and `npm run build`; examine results rather than treating command exit alone as acceptance.
2. Independently repeat the user-facing create/upload→run→pin/compare→ledger/export→reload/re-upload workflow in the final production build. Spot-check CONTROL-PV, US-7, CN-2, FIRPTA refund, final/prior tax and a historical crisis against archived independent oracles.
3. Review household gates: actual B income residency/estate domicile; required tax branch; reported source status; holdings/liquidity/basis/retirement split; property cash/tax details; medical scope and initial-versus-ceiling meaning. Attempt Run with a missing required input or unsupported combination, regardless of prior legacy kind.

**Expected:** Every completed software step has current automated PASS evidence; tests/build/data checks have no unexplained failure, skipped required case or unimplemented model rule. The static app works for its explicitly supported examples/configurations. Missing facts and unsupported branches block any configuration. Legal/history status remains visible separately in all outputs. If retained-green-card/resident B is confirmed, implement and independently verify that branch before claiming household readiness; do not choose NRA to bypass it.

**Evidence:** Final checklist, command reports, repeated workflow artifacts, release/version manifest and a separate household readiness/open-gate statement in `verification/records/M11-5/`. Publishing/deployment is a later action after this reviewable result exists.

**Milestone automated gate:** Review the42-step records,12 milestone gates, crisis/performance/privacy traces and source/household status together. Mark software acceptance only for the supported scope with all required PASS evidence. Record household readiness separately; no blocked factual/legal requirement can be described as completed.

## 3. Completion checklist and handoff

The implementation is ready for review when:

- React/Vite builds static assets; the TypeScript engine, workers, charts and local file flows pass their automated gates.
- Both upload and builder paths produce portable configurations without server-side files; download/re-upload reproduces normalized values and compatible run outputs.
- Arithmetic, tax/loss/prepayment/FTC/death/terminal cases reconcile to independently reviewed oracles.
- RNG/path indexing, worker counts/chunking, immutable replay, failure and cancellation are verified.
- Historical crises are distinguished from amplified sensitivities, and the3% nominal compound assumption is precisely labeled.
- Runtime, retained/peak memory, resource rejection, privacy and loaded offline computation have measured evidence.
- Source versions and actual household limitations are disclosed; no unresolved green-card, holdings, property or medical assumption becomes a fabricated fact.

M00 contract/oracle preparation and independent checks are complete. The former [human checklist](../verification/records/M00/acceptance.md) is retired by user instruction. Implementation proceeds in the milestone order above; [current automated results](../verification/implementation-status.md) distinguish supported example acceptance from OPEN household/source requirements.
