# AGENTS.md

## Commands

- `npm test` — run the unit/integration tests (Vitest)
- `npm run test:e2e` — run the Playwright browser tests against `dist/` (run `npm run build` first)
- `npm run check` — full gate: build, unit tests, `data:verify`, `verify:build` and browser tests
- `npm run build` — build the project
- `npm run dev` — start the project
- `npm run format` — run the format task
- `npm run serve` — serve the production build with scheduled market-data refresh
- `npm run market:refresh` — run one server-side market-data refresh manually

## Code Map

- `src` — application source
- `tests` — automated tests; browser tests live in `tests/e2e`
- `scripts` — build, data, market-refresh and server scripts
- `verification` — frozen oracles, fixtures, source files and contracts used by the tests
- `data` — reference-data documentation and importer output (`data/imported`)
- `examples` — example configurations
- `plan` — project documentation

## Conventions

- Use ESM `import` statements for module dependencies.
- Name unit test files with the `.test.ts` suffix; Playwright browser tests in `tests/e2e` use `.spec.ts`.
