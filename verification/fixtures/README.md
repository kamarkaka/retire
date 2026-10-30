# Fixtures

Frozen literal inputs. Product code never generates these answers.

- `oracles.json`: the original 80-case M00 inventory, including 55 independent numeric answers. `tests/oracles.test.ts` runs every numeric case not listed in `RETIRED_CASE_IDS` (`src/verification/cases.ts`).
- `control-pv.toml`, `control-fx.toml`: 50 beginning-year payment controls (start 2026, both 40, Max age 89) for `tests/engine.test.ts`. The browser workflow test also uploads `control-pv.toml`.
- `control-depletion.toml`: net-asset depletion and stopping control for `tests/engine.test.ts`.
- `engine-final-tax.toml`, `engine-prior-tax.toml`, `engine-firpta.toml`: tax-payment controls under the bundled reference rates for `tests/engine.test.ts`.
- `control-pv.json`, `engine-firpta.json`: JSON copies read by the oracle case adapters in `src/verification/cases.ts`.
