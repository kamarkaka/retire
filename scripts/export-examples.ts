import { mkdir, writeFile } from 'node:fs/promises';
import {
  createExampleDraft,
  createControlDraft,
} from '../src/config/constructors';
import { exportScenario } from '../src/config/config';
await mkdir('examples', { recursive: true });
for (const [name, draft] of [
  ['sample', createExampleDraft()],
  ['control-50year', createControlDraft()],
] as const) {
  await writeFile(
    `examples/${name}.toml`,
    '# Local example input. US market data use NYU historical rows; China CPI/FX are modeled and legal sources are unverified.\n' +
      exportScenario(draft),
  );
}
console.log(
  'Wrote examples/sample.toml and examples/control-50year.toml. The app never fetches these files; upload or use the in-browser constructors.',
);
