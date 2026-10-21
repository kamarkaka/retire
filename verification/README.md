# Automated verification

Manual execution/signatures are retired by user instruction. The app is implemented in the original M00–M11 order; [implementation status](implementation-status.md) records the supported scope and remaining OPEN requirements. M00 oracles and original reference reports are preserved as independent evidence; the current configuration contracts follow subsequent user changes.

## Review these files

| Deliverable | Location |
|---|---|
| Model/API/configuration contract | [contracts.md](contracts.md), [declarations](contracts.d.ts) |
| Complete input/builder mapping | [87-field matrix](config-field-matrix.md), [machine inventory](config-fields.json) |
| Ledger/chart/summary field order | [result-layout.json](result-layout.json) |
| Eight accepted findings → cases/steps | [traceability.md](traceability.md) |
| Literal fixture inputs/oracles | [80-case inventory](fixtures/README.md), [oracles.json](fixtures/oracles.json) |
| Independent calculations | [spreadsheet](records/M00-2/control-calculations.xlsx), [flat50-row table](records/M00-2/control-flat.csv), [appreciation50-row table](records/M00-2/control-appreciation.csv) |
| Historical M00 preparation | [M00.1](records/M00-1/notes.md), [M00.2](records/M00-2/notes.md), [retired checklist](records/M00/acceptance.md) |
| Open facts/sources | [household gates](household-gates.md), [current source registry](../src/reference/source-gates.json), [frozen M00 registry](source-gates.json) |
| Current product execution | [numeric cases](records/product-cases.json), [unit results](records/unit-results.json), [browser results](records/browser-results.json) |
| Current references/inventory | [data report](records/M03/data-report.json), [BIFF test](records/M03/importer-test.json), [inventory integrity](records/inventory-integrity.json) |
| Current independent arithmetic | [reference calculation](records/reference-arithmetic.json); original M00 report remains archived |
| Release and browser evidence | [release record](records/release.json), [downloads/screenshots/workflows](records/e2e) |

## Results and status boundaries

- Independent reference arithmetic: **55 PASS, 0 FAIL**. 18 applicable literal cases run against product modules;38 superseded cases are RETIRED. MARKET-TIMING explicitly excludes its retired deposit-rate and FX-stress subfields. Six broader cases remain OPEN. The §1250 worksheet subset is intentionally not modeled and its former scoped evidence is archived. Structural cases are covered by unit/browser/inventory tests; the numeric CLI labels them `SUITE`, not PASS.
- All20 spec §11.1 cases and all named plan cases are present. Source-dependent arithmetic remains
  conditional on its stated assumptions; no whole-rule source status is upgraded by numeric tests. Scoped IRS worksheet evidence is recorded independently.
- Flat FX50-payment PV: **USD2,390,572.98**. Annual1% RMB-appreciation PV: **USD3,152,520.34**.
  Both start at USD37,369.20777279521 and cover ages40–89. These are tax-free timing controls.
- Product execution, browser round trips, worker transfers/reproducibility/cancellation and measured performance have separate current reports. Independent raw NYU/FRED receipts, population checks, calendar 2000–2002/2008/2022 replays and a production-worker source test now verify the observed references. An arithmetic PASS alone never verifies a legal rule. Household/source gates and Safari acceptance remain OPEN.

## Run the automated app checks

```sh
npm run check
```

For a focused report:

```sh
npm run verify -- --case CONTROL-PV --report verification/records/control-pv.json
npm run verify -- --all
npm run test:e2e
```

The browser suite runs against `dist/`, including upload/builder → workers → comparison → ledger/download → reload/re-upload, fresh offline runs, subdirectory hosting and failure/cleanup. See the root [README](../README.md) for the browser launch limitation and optional WebKit project.

## Reproduce independent supporting checks

From `/Users/mengcao/development/retire`, using Node built-ins and no npm installation:

```sh
npm run verify:reference
node verification/reference/check-artifacts.mjs
```

The reference calculator is separate from the product model. It reads literal inputs and the
unverified spec table snapshot, derives intermediate values, and compares them with literal expected
values. It never imports `src/model`. The integrity checker verifies the prepared inventory, layout,
case/source coverage and file hashes; it does not pretend to test unimplemented browser behavior.

To regenerate current field mappings after an intentional schema change:

```sh
node scripts/sync-field-inventory.mjs
```

This updates current field metadata/matrix and never rewrites independent expected answers. The original prepare-artifacts/workbook authoring scripts belong to historical M00 preparation and are not the current schema generator. Keep frozen oracle/source reports unchanged; current raw fixture revisions have a pre-fixed-horizon archive.

All `verification/` content is development evidence and must be excluded from the production bundle.

Original M00 reports describe the state at preparation time (Node26, no app execution, NOT IMPLEMENTED labels). These are archival facts, not current app status. Routine inventory checks now write `records/inventory-integrity.json` and `records/evidence-manifest.json` without overwriting the original M00 reports. Current app checks run under the pinned Node24 binary.

The original arithmetic report hashes the pre-implementation spec. Current independent recomputation writes `records/reference-arithmetic.json`, with the current spec/algorithm/oracle hashes. The expected numeric oracles are unchanged; reports are never used to generate new expected answers.

## Current shared model

Both people remain alive through the younger Max age year. Ordinary spending and the single aggregate medical base come from Budget; care under Medical is always additional and lasts from its selected start age through the final year. Social Security is excluded: no benefits are ever paid and there are no Social Security inputs. Cash CNY interest/rate/floor is intentionally omitted with a Markets note. Decimal typing is preserved; ledger money displays integers and CSV/calculations retain precision. Current manifests record model-v5.1, fixed lifetimes and no-interest Cash CNY.
