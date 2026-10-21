# Supporting checks and environment

M00 checks verify prepared artifacts and independent arithmetic. They do not execute the product.

| Check / exact command | Actual result |
|---|---|
| `node verification/reference/recalculate.mjs` |55 independent reference PASS,0 FAIL;18 structural prepared,7 OPEN |
| `node verification/reference/check-artifacts.mjs` |Current counts and checks in integrity-report.json; case/field/source/array/hash coverage |
| `node --check verification/reference/<name>.mjs` for all six scripts |PASS; independently repeated by inspection-command.txt |
| `python3 - < verification/records/M00-1/inspection-command.txt` |Standard-library TOML/ZIP/XML/CSV validation; all checks passed, exact intermediates in format-inspection-report.json |
| `command -v tsc` |Exit1/no compiler found; TypeScript compile NOT RUN. Standalone declarations are prepared; strict app toolchain verification belongs to M01 |
| Open/recalculate workbook in a spreadsheet app |NOT RUN by human; required manual procedure in M00-2/notes.md |
| Browser application/worker/performance/privacy tests |NOT IMPLEMENTED/NOT RUN; later milestones |

The independent format inspection uses Python's standard library only as a development evidence reader;
the reference calculations/authoring scripts are JavaScript, and the web-app runtime remains React/TypeScript.
No Python app, framework dependency installation, package/config setup or server scenario dependency was added.

Exact revision hashes, Node/npm, OS/CPU/memory and absent browser execution are in
[artifact-manifest.json](../M00/artifact-manifest.json). Supporting runs used Node26.5.0/npm11.17.0;
Node24 is still the planned app runtime, not a verified result from M00.

Every source row remains unverified. The seven conditional numeric cases are CAPITAL-PARTIAL,
PROPERTY-1231, CN-EXPIRY, CN-REFUND, MARKET-CALIBRATION, CRISIS-DOTCOM and CRISIS-2008.
The18 structural cases have explicit expected behavior for later app tests; catalog coverage is not
execution evidence for that behavior. The human checklist remains unsigned/NOT RUN.
