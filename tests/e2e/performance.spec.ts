import { test, expect } from './fixtures';
import { complete, saveDownload, uploadDraft, record } from './helpers';
import { observeWorkers, workerEvidence } from './worker-observer';
import { createExampleDraft } from '../../src/config/constructors';
import { execFileSync } from 'node:child_process';
import { cpus, totalmem, release } from 'node:os';
test.use({ trace: 'off' });

test('M11: production performance, retained bytes and explicit 100000-path resource rejection', async ({
  page,
  context,
  browserName,
}, info) => {
  test.setTimeout(300000);
  await observeWorkers(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Load sample config' }).click();
  await page.getByLabel('simulation.max_age', { exact: true }).fill('92');
  await page.getByLabel('simulation.n_paths', { exact: true }).fill('1');
  await complete(page, 1);
  const browser = context.browser()!,
    rows: {
      paths: number;
      seed: number;
      elapsed_ms: number;
      ui_wall_ms: number;
      retained_bytes: number;
      execution: unknown;
      peak_rss_bytes: number | null;
    }[] = [],
    ids = new Set<string>();
  let session:
      Awaited<ReturnType<typeof browser.newBrowserCDPSession>> | undefined,
    peak = 0,
    timer: ReturnType<typeof setInterval> | undefined;
  if (browserName === 'chromium') {
    session = await browser.newBrowserCDPSession();
    const processInfo = await session.send('SystemInfo.getProcessInfo');
    const pids = [
      ...new Set(
        (processInfo.processInfo as { id: number }[]).map((p) => p.id),
      ),
    ].join(',');
    const sample = () => {
      try {
        const rss = execFileSync('/bin/ps', ['-o', 'rss=', '-p', pids], {
          encoding: 'utf8',
        })
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .reduce((n, v) => n + Number(v) * 1024, 0);
        peak = Math.max(peak, rss);
      } catch {
        /* Browser closing ends this sampler. */
      }
    };
    sample();
    timer = setInterval(sample, 200);
  }
  try {
    for (const paths of [2000, 20000])
      for (const seed of [42, 43, 44]) {
        await page
          .getByRole('button', { name: 'Configuration', exact: true })
          .click();
        await page
          .getByRole('button', { name: 'Simulation', exact: true })
          .click();
        await page
          .getByLabel('simulation.n_paths', { exact: true })
          .fill(String(paths));
        await page
          .getByLabel('simulation.seed', { exact: true })
          .fill(String(seed));
        peak = 0;
        const started = await page.evaluate(() => performance.now());
        await complete(page, paths, 90000);
        await expect(page.getByTestId('success-probability')).toBeVisible();
        const wall = await page.evaluate(
          (start) => performance.now() - start,
          started,
        );
        const manifest = JSON.parse(
          (
            await saveDownload(
              page,
              'Download run manifest',
              `${info.project.name}-performance-${paths}-${seed}.json`,
            )
          ).text,
        );
        expect(manifest.scientific.horizon).toBe(52);
        expect(manifest.scientific.n_paths).toBe(paths);
        expect(ids.has(manifest.execution.run_id)).toBe(false);
        ids.add(manifest.execution.run_id);
        expect(manifest.aggregate.retained_bytes).toBe(paths * 1199);
        if (paths === 20000)
          expect(manifest.aggregate.retained_bytes).toBeLessThan(50000000);
        rows.push({
          paths,
          seed,
          elapsed_ms: manifest.execution.elapsed_ms,
          ui_wall_ms: wall,
          retained_bytes: manifest.aggregate.retained_bytes,
          execution: manifest.execution,
          peak_rss_bytes: peak || null,
        });
        expect(wall).toBeLessThan(paths === 2000 ? 10000 : 90000);
      }
    await page
      .getByRole('button', { name: 'Pin completed run', exact: true })
      .click();
    const before = (await workerEvidence(page)).created;
    const d = createExampleDraft();
    d.simulation!.start_year = 2026;
    d.simulation!.n_paths = 100000;
    d.simulation!.max_age = 130;
    d.people!.A!.birth_year = d.people!.B!.birth_year = 1990;
    await uploadDraft(page, d);
    await page
      .getByRole('button', { name: 'Run simulation', exact: false })
      .click();
    await expect(page.getByTestId('run-status')).toContainText('Run failed');
    await expect(page.getByRole('alert')).toContainText('512 MiB');
    await expect(page.getByRole('alert')).toContainText(
      'Requested count is unchanged',
    );
    await page.getByRole('button', { name: 'Simulation', exact: true }).click();
    await expect(
      page.getByLabel('simulation.n_paths', { exact: true }),
    ).toHaveValue('100000');
    expect((await workerEvidence(page)).created).toBe(before);
    await record(`${info.project.name}-performance.json`, {
      status: 'PASS',
      environment: {
        browser: browser.version(),
        platform: process.platform,
        os: release(),
        cpu: cpus()[0]?.model,
        total_memory_bytes: totalmem(),
        node: process.version,
      },
      method:
        'Production build; explicit 52-year benchmark (sample ages41, max_age92); 1-path warmup; six distinct genuine computations; no tracing or cache. UI wall: browser performance.now before click through ready KPIs. RSS sampled every 200 ms using ps for CDP-listed browser processes; includes browser overhead and all workers in single-process mode, not a JS-heap estimate. Retained bytes are exact typed-array accounting.',
      rows,
      resource_rejection: {
        paths: 100000,
        horizon: 95,
        pinned_bytes: 23980000,
        message: await page.getByRole('alert').textContent(),
      },
      workers: await workerEvidence(page),
      open: [
        'Safari/WebKit process launch blocked on current host; no Safari performance claim',
      ],
    });
  } finally {
    if (timer) clearInterval(timer);
    await session?.detach();
  }
});
