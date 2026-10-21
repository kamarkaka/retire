# M00.1 contract verification record

Date:2026-10-18. Artifact preparation: **DONE**. Assistant contract review/supporting integrity checks:
**recorded in integrity-report.json**. Human manual acceptance: **NOT RUN**.

No application code, framework dependencies or server configuration files were created at this milestone.
Source and household gates remain OPEN. Exact artifact hashes/environment are in
[the manifest](../M00/artifact-manifest.json).

## Specific manual procedure

| Check | Action | Expected | Human result |
|---|---|---|---|
| M00.1-1 boundaries | Read spec §§3/5.10/6.9/7–9 beside `contracts.md` and `contracts.d.ts`; follow local upload and builder -> normalize/validate -> request -> workers -> summary/replay -> downloads | One local config pipeline and pure financial engine; correct12 phases; stable IDs/status/notes survive | NOT RUN |
| M00.1-2 ownership | Search proposed module/API names and file inventory for server scenario reads, config POSTs and React finance formulas; distinguish `verification/fixtures` from runtime assets | No required host scenario directory or configuration endpoint; public reference assets only | NOT RUN |
| M00.1-3 fields | Compare every row in `config-field-matrix.md` with spec §9 example, optional fields and §6.8 overrides |277 paths, explicit defaults/units/omissions, no inferred ownership/basis/status; all controls planned | NOT RUN |
| M00.1-4 review coverage | For R1–R8 in traceability.md, open each named oracle and later manual step | Every correction has input, expected answer/conditional source gate, owning module and specific manual action | NOT RUN |
| M00.1-5 arrays/RNG | Inspect54 ledger/8 chart fields and21 Float64/8 Int32/7 Uint8 summary fields; check tuple seeding, pair order and bootstrap consumption | Stable versioned field order;207 summary bytes/path;37,420,000 retained bytes at20k/T52; T/T+1 correct | NOT RUN |
| M00.1-6 gates | Read source registry and household-gates.md; try mentally routing retained B green card through types/validation | Noncitizen/resident cannot route to NRA; checkbox alone cannot bypass open source registry; draft remains saveable | NOT RUN |

## Assistant annotations / decisions

1. Filled a real configuration gap: `tax_tables.us.ltcg_rates` now explicitly defaults to `[0,.15,.20]`.
   The effective unrecaptured-gain maximum drives the derived ordinary ceiling; no nonfinite value is serialized.
2. Freeze canonicalization and draw-consumption versions before implementation; no per-worker RNG state
   or property array index becomes a seed. First bootstrap candidate followed by fixed jump/candidate pairs
   is explicit; odd normal-pair tail never shifts another stream.
3. Keep required household facts omitted rather than inheriting illustrative starter ownership/classification.
   Type declarations require runtime semantic checks, including union-specific keys and unsupported status.
4. Undefined investment return when balances are absent is not a fabricated0% return. Flex stays unchanged;
   geometric KPI excludes those years and is absent if no defined returns exist.
5. Full account returns/tax/basis/scalar summaries use Float64. Float32 visualization cannot decide depletion.
   Lifetime success and active cohorts retain separate denominators. Estate and ceiling excess are separate flags.
6. Retirement-access and source/worksheet details remain applicable source gates; numeric controls do not
   certify Rule55 conditions, FTC refund/expiry or actual resident-alien support.
7. Made the worker-to-analysis route for market bands explicit: temporary Float64 FX/CPI samples are
   transferred, aggregated over all generated paths and released. Their25,120,000 bytes at20k/T52 are
   part of peak preflight, not retained-chart accounting. No implicit global reference input is needed.

## Supporting checks vs human acceptance

`node verification/reference/check-artifacts.mjs` verifies case coverage, legal-registry completeness,
serialized paths, declaration presence, hashes and layout bytes. TOML and workbook syntax/structure
checks are recorded separately. These support review; the human result column above stays NOT RUN
until a reviewer actually follows each step.

Reviewer name/date: ____________________

Findings / resolution: ____________________
