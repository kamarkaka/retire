import { test, expect } from './fixtures';
import {
  complete,
  saveDownload,
  uploadDraft,
  record,
  saveDraftText,
} from './helpers';
import { observeWorkers, workerEvidence } from './worker-observer';
import { createExampleDraft } from '../../src/config/constructors';
import { parseScenario } from '../../src/config/config';
import { FI, FLOAT_FIELDS } from '../../src/model/layout';

test('M09: one/four workers, out-of-order chunks, 1000-path prefix and exact replay', async ({
  page,
}, info) => {
  const replayHashes = async (representative: {
    worst: number;
    p10: number;
    median: number;
  }) => {
    const hashes: Record<number, string> = {};
    await page
      .getByRole('button', { name: 'Year ledger', exact: true })
      .click();
    for (const [name, id] of [
      ['Worst', representative.worst],
      ['P10', representative.p10],
      ['Median', representative.median],
    ] as const) {
      await page.getByRole('button', { name, exact: true }).click();
      // Wait for this specific path's replay: length-based waits can catch a
      // stale in-flight replay from the tab remount under load.
      await expect
        .poll(() =>
          page.evaluate(
            (wanted) =>
              window.__workerEvidence.replays
                .filter((r) => r.path_id === wanted)
                .at(-1)?.hash,
            id,
          ),
        )
        .toBeTruthy();
      hashes[id] = (await workerEvidence(page)).replays
        .filter((r) => r.path_id === id)
        .at(-1)!.hash!;
    }
    return hashes;
  };
  await observeWorkers(page, {
    hashes: true,
    delay: 250,
    hardware: 2,
    prefix: 1000,
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Load sample config' }).click();
  await page.getByLabel('simulation.n_paths', { exact: true }).fill('1000');
  await complete(page, 1000);
  await expect
    .poll(() =>
      page.evaluate(() => window.__workerEvidence.summaries[0]?.hashes),
    )
    .toBeTruthy();
  const one = await workerEvidence(page),
    oneManifest = JSON.parse(
      (
        await saveDownload(
          page,
          'Download run manifest',
          `${info.project.name}-one-worker.json`,
        )
      ).text,
    );
  expect(oneManifest.execution.worker_count).toBe(1);
  const firstReplay = await replayHashes(
    oneManifest.aggregate.representative_paths,
  );
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      configurable: true,
      get: () => 5,
    }),
  );
  await complete(page, 1000);
  await expect
    .poll(() =>
      page.evaluate(() => window.__workerEvidence.summaries[1]?.hashes),
    )
    .toBeTruthy();
  const four = await workerEvidence(page);
  const fourManifest = JSON.parse(
    (
      await saveDownload(
        page,
        'Download run manifest',
        `${info.project.name}-four-workers.json`,
      )
    ).text,
  );
  expect(fourManifest.execution.worker_count).toBe(4);
  expect(four.summaries[1].hashes).toEqual(one.summaries[0].hashes);
  expect(fourManifest.scientific).toEqual(oneManifest.scientific);
  expect(fourManifest.aggregate).toEqual(oneManifest.aggregate);
  expect(four.delivered_chunks.slice(one.delivered_chunks.length)[0]).not.toBe(
    0,
  );
  expect(
    await replayHashes(fourManifest.aggregate.representative_paths),
  ).toEqual(firstReplay);
  await page
    .getByRole('button', { name: 'Configuration', exact: true })
    .click();
  await page.getByRole('button', { name: 'Simulation', exact: true }).click();
  await page.getByLabel('simulation.n_paths', { exact: true }).fill('2000');
  await complete(page, 2000);
  await expect
    .poll(() =>
      page.evaluate(() => window.__workerEvidence.summaries[2]?.hashes),
    )
    .toBeTruthy();
  const all = await workerEvidence(page);
  expect(all.summaries[2].hashes).toEqual(one.summaries[0].hashes);
  expect(all.transfers.filter((t) => t.type === 'summarize')).toHaveLength(3);
  expect(
    all.transfers.every(
      (t) => t.before.every((b) => b > 0) && t.after.every((b) => b === 0),
    ),
  ).toBe(true);
  expect(all.live).toBe(0);
  expect(all.max_live).toBeLessThanOrEqual(4);
  await record(`${info.project.name}-scheduling.json`, {
    status: 'PASS',
    hash_scope:
      'first 1000 complete paths, all chart/Float64/Int32/flag buffers; replay paths 0, 17 and 999 full ledgers',
    one: oneManifest.execution,
    four: fourManifest.execution,
    replay_hashes: firstReplay,
    evidence: all,
  });
});

test('M09 M11: responsive draft edits and cancel during summarization discard a delayed old result', async ({
  page,
}, info) => {
  await observeWorkers(page, { summaryDelay: 500 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Load sample config' }).click();
  await page.getByLabel('simulation.n_paths', { exact: true }).fill('2000');
  await page
    .getByRole('button', { name: 'Run simulation', exact: false })
    .click();
  const times: { action: string; ms: number }[] = [];
  let start = Date.now();
  await page.getByLabel('simulation.seed', { exact: true }).fill('99');
  times.push({ action: 'draft edit', ms: Date.now() - start });
  start = Date.now();
  await page.getByRole('button', { name: 'Assumptions', exact: true }).click();
  times.push({ action: 'tab switch', ms: Date.now() - start });
  expect(times.every((t) => t.ms < 250)).toBe(true);
  await expect(page.getByTestId('run-status')).toContainText(
    'Calculating percentiles',
    { timeout: 60000 },
  );
  start = Date.now();
  await page.getByRole('button', { name: 'Cancel run', exact: true }).click();
  await expect(page.getByTestId('run-status')).toContainText('Run canceled');
  const cancel = Date.now() - start;
  expect(cancel).toBeLessThan(1000);
  expect((await workerEvidence(page)).live).toBe(0);
  await expect(page.getByTestId('success-probability')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Configuration', exact: true })
    .click();
  await page.getByRole('button', { name: 'Simulation', exact: true }).click();
  await page.getByLabel('simulation.n_paths', { exact: true }).fill('32');
  await page.getByLabel('simulation.seed', { exact: true }).fill('44');
  await complete(page, 32);
  const manifest = JSON.parse(
    (
      await saveDownload(
        page,
        'Download run manifest',
        `${info.project.name}-after-analysis-cancel.json`,
      )
    ).text,
  );
  expect(manifest.scientific.seed).toBe(44);
  expect(manifest.scientific.n_paths).toBe(32);
  await expect
    .poll(() => page.evaluate(() => window.__workerEvidence.stale_deliveries))
    .toBeGreaterThan(0);
  await record(`${info.project.name}-ui-and-analysis-cancel.json`, {
    status: 'PASS',
    times,
    cancel_ms: cancel,
    method:
      'Real worker computation and main-thread controls; delay analysis message delivery to hold summarizing phase and deliver old data after termination.',
    evidence: await workerEvidence(page),
  });
});

test('M10: immutable current/run exports, matched-path deltas and pinned replay', async ({
  page,
}, info) => {
  await observeWorkers(page, { floats: true, hashes: true });
  await page.goto('/');
  await page.getByRole('button', { name: 'Load sample config' }).click();
  await complete(page, 200);
  const baseline = await saveDownload(
    page,
    'Download run config',
    `${info.project.name}-baseline.toml`,
  );
  await page
    .getByRole('button', { name: 'Pin completed run', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Configuration', exact: true })
    .click();
  await page.getByRole('button', { name: 'Budget', exact: true }).click();
  await page.getByLabel('medical.age_growth', { exact: true }).fill('0.01');
  const current = await saveDraftText(
    page,
    `${info.project.name}-edited-draft.toml`,
  );
  await page.getByRole('button', { name: 'Results', exact: true }).click();
  await expect(page.locator('.snapshot-note')).toContainText(
    'Current draft edits',
  );
  const snapshot = await saveDownload(
    page,
    'Download run config',
    `${info.project.name}-unchanged-run.toml`,
  );
  expect(snapshot.text).toBe(baseline.text);
  expect(current.text).not.toBe(baseline.text);
  const a = parseScenario(baseline.text),
    b = parseScenario(current.text);
  expect(a.ok && b.ok).toBe(true);
  if (a.ok && b.ok) {
    expect(b.value.medical!.age_growth).toBe(0.01);
    b.value.medical!.age_growth = a.value.medical!.age_growth;
    expect(b.value).toEqual(a.value);
  }
  await complete(page, 200);
  await page.getByRole('button', { name: 'Compare', exact: true }).click();
  await expect(page.getByTestId('comparison-compatibility')).toContainText(
    'Paired:',
  );
  await expect(page.getByTestId('paired-deltas')).toBeVisible();
  const downloaded = JSON.parse(
      (
        await saveDownload(
          page,
          'Download paired comparison',
          `${info.project.name}-paired-comparison.json`,
        )
      ).text,
    ),
    evidence = await workerEvidence(page),
    values = evidence.summaries.slice(0, 2).map((s) => s.floats!);
  const differences = Array.from(
    { length: 200 },
    (_, id) =>
      values[1][id * FLOAT_FIELDS.length + FI.terminal_net_heirs_cny_real] -
      values[0][id * FLOAT_FIELDS.length + FI.terminal_net_heirs_cny_real],
  ).sort((x, y) => x - y);
  const q = (p: number) => {
    const index = 199 * p,
      low = Math.floor(index);
    return (
      differences[low] +
      (differences[Math.ceil(index)] - differences[low]) * (index - low)
    );
  };
  expect(downloaded.comparison.deltas.terminal_net_heirs_cny_real).toEqual({
    p10: q(0.1),
    p50: q(0.5),
    p90: q(0.9),
    paired_count: 200,
  });
  expect(q(0.5)).not.toBe(0);
  await page
    .getByRole('button', { name: 'Configuration', exact: true })
    .click();
  await page.getByRole('button', { name: 'Simulation', exact: true }).click();
  await page.getByLabel('simulation.seed', { exact: true }).fill('43');
  await complete(page, 200);
  await page.getByRole('button', { name: 'Compare', exact: true }).click();
  await expect(page.getByTestId('comparison-compatibility')).toContainText(
    'Unpaired:',
  );
  await expect(page.getByTestId('paired-deltas')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Show baseline ledger', exact: true })
    .click();
  await expect(
    page.getByRole('table', { name: 'Year ledger', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Median', exact: true }).click();
  await expect(page.getByTestId('year-provenance')).toContainText('"report"');
  const csv = (
    await saveDownload(
      page,
      'Download ledger CSV',
      `${info.project.name}-baseline-median.csv`,
    )
  ).text;
  expect(csv).toContain('# seed=42');
  expect(csv).toContain(downloaded.baseline.scenario_sha256);
  await page
    .getByRole('button', { name: 'Unpin baseline', exact: true })
    .click();
  await expect(page.getByTestId('comparison-compatibility')).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => window.__workerEvidence.live))
    .toBe(0);
  await record(`${info.project.name}-comparison-oracle.json`, {
    status: 'PASS',
    direction:
      'current minus baseline; independent sorting and Type7 interpolation of Float64 per-path values',
    terminal_net_heirs_expected: { p10: q(0.1), p50: q(0.5), p90: q(0.9) },
    downloaded,
    transfer_evidence: (await workerEvidence(page)).transfers,
  });
});

test('M09: later invalid path fails the whole job and five cancel/restarts release workers', async ({
  page,
}, info) => {
  await observeWorkers(page, { holdChunks: true });
  await page.goto('/');
  await page.getByRole('button', { name: 'Load sample config' }).click();
  for (let i = 0; i < 5; i++) {
    await page.getByLabel('simulation.n_paths', { exact: true }).fill('20000');
    await page
      .getByLabel('simulation.seed', { exact: true })
      .fill(String(100 + i));
    const before = (await workerEvidence(page)).native_chunks;
    await page
      .getByRole('button', { name: 'Run simulation', exact: false })
      .click();
    await expect
      .poll(() => page.evaluate(() => window.__workerEvidence.native_chunks))
      .toBeGreaterThan(before);
    const start = Date.now();
    await page.getByRole('button', { name: 'Cancel run', exact: true }).click();
    await expect(page.getByTestId('run-status')).toContainText('Run canceled');
    expect(Date.now() - start).toBeLessThan(1000);
    expect((await workerEvidence(page)).live).toBe(0);
  }
  await page.getByLabel('simulation.n_paths', { exact: true }).fill('32');
  await page.getByLabel('simulation.seed', { exact: true }).fill('42');
  await page
    .getByRole('button', { name: 'Run simulation', exact: false })
    .click();
  expect(
    await page.evaluate(() => window.__releaseHeldWorkerChunks()),
  ).toBeGreaterThan(0);
  await expect(page.getByTestId('run-status')).toContainText(
    'Completed 32 paths in ',
    { timeout: 60000 },
  );
  await expect
    .poll(() => page.evaluate(() => window.__workerEvidence.stale_deliveries))
    .toBeGreaterThan(0);
  expect((await workerEvidence(page)).summaries).toHaveLength(1);
  await page.reload();
  await page.evaluate(() => window.__releaseHeldWorkerChunks());
  const d = createExampleDraft();
  d.simulation!.n_paths = 4000;
  d.market!.home_cpi_mean = -0.5;
  d.market!.home_cpi_sigma = 0.12;
  d.market!.home_cpi_phi = 0;
  await uploadDraft(page, d);
  await page
    .getByRole('button', { name: 'Run simulation', exact: false })
    .click();
  await expect(page.getByTestId('run-status')).toContainText('Run failed', {
    timeout: 60000,
  });
  await expect(page.getByRole('alert')).toContainText('path');
  await expect(page.getByRole('alert')).toContainText('year');
  await expect(page.getByTestId('success-probability')).toHaveCount(0);
  await expect(
    page.getByLabel('simulation.n_paths', { exact: true }),
  ).toHaveValue('4000');
  const failed = await workerEvidence(page);
  expect(failed.native_chunks).toBeGreaterThan(0);
  expect(failed.summaries).toHaveLength(0);
  expect(failed.live).toBe(0);
  expect(failed.failures.length).toBeGreaterThan(0);
  await record(`${info.project.name}-failure-and-cleanup.json`, {
    status: 'PASS',
    requested_paths: 4000,
    failed_job: failed,
    message: await page.getByRole('alert').textContent(),
  });
});
