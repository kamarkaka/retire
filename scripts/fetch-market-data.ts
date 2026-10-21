import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import {
  fetchPublicMarketData,
  type PublicSourceId,
} from './market-data-source';

const args = process.argv.slice(2);
if (args.some((arg, i) => arg !== '--output' && args[i - 1] !== '--output'))
  throw new Error('Usage: npm run data:fetch -- --output <directory>');
const index = args.indexOf('--output');
if (index >= 0 && !args[index + 1])
  throw new Error('--output requires a directory');
const output = resolve(index < 0 ? 'data/refreshed' : args[index + 1]);
const { data, raw } = await fetchPublicMarketData();
// Writes only after all five sources and the complete package have passed validation.
await mkdir(output, { recursive: true });
for (const [id, bytes] of Object.entries(raw) as [PublicSourceId, Uint8Array][])
  await writeFile(
    join(output, id === 'NYU' ? 'history.xls' : `${id}.csv`),
    bytes,
  );
await writeFile(
  join(output, 'market-data.json'),
  JSON.stringify(data, null, 2) + '\n',
);
console.log(`Fetched and validated five public sources → ${output}`);
console.log(
  JSON.stringify(
    {
      history: [data.history[0].year, data.history.at(-1)!.year],
      income_yields: data.income_yields,
      latest: data.latest,
      sha256: data.sha256,
    },
    null,
    2,
  ),
);
