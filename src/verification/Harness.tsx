import { useState } from 'react';
import oracles from '../../verification/fixtures/oracles.json' with { type: 'json' };
import { probeWorker } from '../workers/probe';
import {
  runProductCase,
  compareActual,
  RETIRED_CASE_IDS,
  type VerificationCase,
} from './cases';
export default function Harness() {
  const [id, setId] = useState('US-7');
  const [probe, setProbe] = useState('');
  const [actual, setActual] = useState('');
  const fixture = oracles.cases.find((c) => c.id === id);
  return (
    <main>
      <h1>Development verification</h1>
      <p>
        Literal M00 oracles and real product modules. Legal-source status is
        separate. Mortality/survivor cases are retained as archived oracles and
        cannot run.
      </p>
      <select
        value={id}
        onChange={(e) => {
          setId(e.target.value);
          setActual('');
        }}
      >
        {oracles.cases.map((c) => (
          <option key={c.id}>{c.id}</option>
        ))}
      </select>
      <pre>{JSON.stringify(fixture, null, 2)}</pre>
      <button
        disabled={
          fixture?.oracle_kind !== 'numeric' || RETIRED_CASE_IDS.includes(id)
        }
        onClick={() => {
          try {
            const c = fixture as unknown as VerificationCase,
              result = runProductCase(c),
              failures = compareActual(
                c.expected,
                result.actual,
                c.tolerance,
                result.excluded_expected_fields,
              );
            setActual(
              JSON.stringify(
                {
                  status: failures.length ? 'FAIL' : 'PASS',
                  ...result,
                  failures,
                },
                null,
                2,
              ),
            );
          } catch (e) {
            setActual(String(e));
          }
        }}
      >
        Run case
      </button>
      <pre>
        {actual ||
          'Conditional source/data cases remain OPEN. Structural browser cases run in Playwright.'}
      </pre>
      <button
        onClick={() =>
          void probeWorker().then((p) => setProbe(JSON.stringify(p)))
        }
      >
        Probe transfer
      </button>
      <pre>{probe}</pre>
    </main>
  );
}
