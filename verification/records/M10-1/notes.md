# M10.1 — Connect run controls, validation and financial previews

- Status: **PASS** for the scope below.
- Recorded: 2026-10-20T11:36:03.928Z
- Build: 0.1.0+c8db356364cb09f858f3b1a01c2840f5466826d2a158b0b441f6c0820f05a027
- Human/manual sign-off: RETIRED.

## Scope and result

Validated run controls, previews, common validation, source status and immutable labels are connected to the engine. Paths/Seed and the TOML editor share accessible plain-English help; numeric controls block wheel stepping.

## Implementation

- [src/App.tsx](../../../src/App.tsx)
- [src/components/ConfigField.tsx](../../../src/components/ConfigField.tsx)
- [src/components/NumberInput.tsx](../../../src/components/NumberInput.tsx)
- [src/components/Assumptions.tsx](../../../src/components/Assumptions.tsx)
- [src/model/preview.ts](../../../src/model/preview.ts)

## Automated evidence

- [browser-results.json](../browser-results.json)
- [e2e/chromium-configuration-help.json](../e2e/chromium-configuration-help.json)
- [e2e/chromium-decimal-wheel.json](../e2e/chromium-decimal-wheel.json)
- [e2e/chromium-after-analysis-cancel.json](../e2e/chromium-after-analysis-cancel.json)

Numeric reports retain raw inputs, independent expected answers, actuals, intermediates, tolerance and source IDs. RETIRED preserves superseded original oracles; excluded subfields are explicit. SUITE refers to separate structural/browser checks; OPEN is not PASS. Scoped IRS evidence is checked; broader rules and actual household readiness remain separate.
