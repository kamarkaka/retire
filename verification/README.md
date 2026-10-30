# Verification inputs

`npm run check` is the automated gate (see the [main README](../README.md#automated-verification)). This folder holds only the inputs that tests, data checks and the market refresh read:

| Path | Used by |
| --- | --- |
| `fixtures/oracles.json` | Frozen independent M00 answers. `tests/oracles.test.ts` runs the still-applicable numeric cases against product modules through `src/verification/cases.ts`. |
| `fixtures/*.toml`, `fixtures/*.json` | Literal engine controls for `tests/engine.test.ts`, the oracle cases and the browser workflow test; see [fixtures](fixtures/README.md). |
| `market-tapes.ts` | Literal return tapes for unit tests. |
| `sources/` | Frozen public NYU/FRED files and independent receipts, read by `npm run data:verify`, `npm run data:bundle` and the historical-data tests. |
| `reference/*.py` | Stdlib source readers used by `data:verify`, `data:bundle` and the production market refresh (the Docker image copies two of them). |
| `contracts.md` | Plain-language summary of the current model and configuration contracts. |

The M00–M11 milestone records, evidence archive, independent reference arithmetic, inventory cross-checks and release reports were retired on 2026-10-30. They remain in git history at tag `verification-archive`; `git checkout verification-archive -- verification` restores them.
