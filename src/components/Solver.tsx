import { useEffect, useRef, useState } from 'react';
import type { CompletedRun } from '../workers/pool';
import { CanceledRun, startRun } from '../workers/pool';
import { makeRunRequest } from '../config/config';
import type { RunnableScenario, ScenarioConfig } from '../model/types';
import {
  SOLVER_TARGETS,
  investableAssets,
  solveDecreasing,
  solveIncreasing,
  withAnnualBudget,
  withExtraAssets,
  type SolveOutcome,
} from '../model/solver';
import { money } from './format';
import { useI18n } from '../i18n/context';

type RowState = { outcome: SolveOutcome | null };
type CardStatus = 'idle' | 'solving' | 'done' | 'cancelled' | 'error';

const ASSET_TOL = 1000;
const SPEND_TOL = 100;

function useSolver(
  run: CompletedRun,
  kind: 'assets' | 'spending',
  onProgress: (text: string) => void,
) {
  const cancelRef = useRef<{ cancel: () => void; stop: boolean } | null>(null);
  useEffect(() => {
    const current = cancelRef.current;
    return () => {
      if (current) {
        current.stop = true;
        current.cancel();
      }
    };
  }, []);
  const cancel = () => {
    cancelRef.current?.cancel();
    if (cancelRef.current) cancelRef.current.stop = true;
  };
  const evaluate = async (variant: ScenarioConfig): Promise<number> => {
    // Variants derive from an already-runnable scenario; only the solved
    // knob changes, so no revalidation is needed.
    const request = makeRunRequest(
      variant as unknown as RunnableScenario,
      run.references,
    );
    const handle = startRun(request, run.references, () => {});
    const state = { cancel: handle.cancel, stop: false };
    cancelRef.current = state;
    try {
      const completed = await handle.promise;
      return completed.aggregate.success_probability;
    } finally {
      if (cancelRef.current === state) cancelRef.current = null;
    }
  };
  const solve = async (
    setRows: (rows: RowState[]) => void,
    setStatus: (s: CardStatus) => void,
  ) => {
    const base = run.request.scenario as ScenarioConfig;
    const rows: RowState[] = SOLVER_TARGETS.map(() => ({ outcome: null }));
    setStatus('solving');
    try {
      for (let i = 0; i < SOLVER_TARGETS.length; i++) {
        const target = SOLVER_TARGETS[i];
        let evals = 0;
        const onEval = (x: number, y: number) => {
          evals++;
          onProgress(`${target * 100}% · ${evals}`);
        };
        const outcome =
          kind === 'assets'
            ? await solveIncreasing(
                (x) => evaluate(withExtraAssets(base, x)),
                target,
                0,
                Math.max(100000, 0.25 * investableAssets(base)),
                Math.max(10_000_000, 25 * investableAssets(base)),
                ASSET_TOL,
                onEval,
              )
            : await solveDecreasing(
                (x) => evaluate(withAnnualBudget(base, x)),
                target,
                base.budget.annual,
                Math.max(
                  10000,
                  0.25 * (base.budget.annual - base.budget.included_health),
                ),
                0,
                SPEND_TOL,
                onEval,
              );
        rows[i] = { outcome };
        setRows([...rows]);
      }
      setStatus('done');
    } catch (e) {
      setStatus(e instanceof CanceledRun ? 'cancelled' : 'error');
    }
  };
  return { solve, cancel };
}

function SolverCard({
  run,
  kind,
}: {
  run: CompletedRun;
  kind: 'assets' | 'spending';
}) {
  const { t, intlLocale } = useI18n();
  const [status, setStatus] = useState<CardStatus>('idle');
  const [rows, setRows] = useState<RowState[]>(
    SOLVER_TARGETS.map(() => ({ outcome: null })),
  );
  const [progress, setProgress] = useState('');
  const { solve, cancel } = useSolver(run, kind, setProgress);
  const base = run.request.scenario as ScenarioConfig,
    ccy = base.people.domicile === 'US' ? 'USD' : 'CNY';
  const cap =
    kind === 'assets' ? Math.max(10_000_000, 25 * investableAssets(base)) : 0;
  const format = (v: number | null, capped: boolean): string => {
    if (v === null || capped)
      return kind === 'assets'
        ? `> ${money(cap, 'USD', false, intlLocale)}`
        : t('solver.unachievable');
    return kind === 'assets'
      ? money(Math.round(v / 1000) * 1000, 'USD', false, intlLocale)
      : money(Math.round(v / 100) * 100, ccy, false, intlLocale);
  };
  return (
    <article className="chart-card" data-testid={`solver-${kind}`}>
      <h3>
        {t(kind === 'assets' ? 'solver.assetsTitle' : 'solver.spendTitle')}
      </h3>
      <p>{t(kind === 'assets' ? 'solver.assetsHint' : 'solver.spendHint')}</p>
      <table>
        <thead>
          <tr>
            <th>{t('solver.target')}</th>
            <th>{t('solver.result')}</th>
          </tr>
        </thead>
        <tbody>
          {SOLVER_TARGETS.map((target, i) => (
            <tr key={target} data-target={target}>
              <td>{`${target * 100}%`}</td>
              <td>
                {rows[i].outcome
                  ? format(rows[i].outcome!.value, rows[i].outcome!.capped)
                  : status === 'solving'
                    ? progress.startsWith(`${target * 100}%`)
                      ? t('solver.solvingTarget', { progress })
                      : t('solver.queued')
                    : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="toolbar" style={{ marginTop: 12 }}>
        {status === 'solving' ? (
          <button type="button" className="secondary" onClick={cancel}>
            {t('solver.cancel')}
          </button>
        ) : (
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setRows(SOLVER_TARGETS.map(() => ({ outcome: null })));
              void solve(setRows, setStatus);
            }}
          >
            {t('solver.solve')}
          </button>
        )}
        {status === 'solving' && (
          <span className="muted">{t('solver.solving', { progress })}</span>
        )}
        {status === 'error' && (
          <span className="muted">{t('solver.error')}</span>
        )}
      </div>
    </article>
  );
}

export default function Solver({ run }: { run: CompletedRun }) {
  const { t } = useI18n();
  return (
    <>
      <div className="results-title">
        <div>
          <p className="eyebrow">{t('solver.eyebrow')}</p>
          <h2>{t('solver.title')}</h2>
        </div>
      </div>
      <p className="muted">{t('solver.hint')}</p>
      <div className="two-columns">
        <SolverCard run={run} kind="assets" />
        <SolverCard run={run} kind="spending" />
      </div>
    </>
  );
}
