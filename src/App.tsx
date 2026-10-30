import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  DraftScenario,
  FieldIssue,
  PublicReferenceBundle,
} from './model/types';
import { createExampleDraft, createEmptyDraft } from './config/constructors';
import {
  normalizeScenario,
  parseScenario,
  validateScenario,
  exportScenario,
  makeRunRequest,
  MAX_CONFIG_BYTES,
} from './config/config';
import { hashObject } from './model/canonical';
import { randomSeed } from './components/RandomSeedButton';
import { references as bundledReferences } from './reference/bundle';
import {
  applyMarketData,
  withMarketData,
  type MarketDataSnapshot,
} from './reference/market-data';
import { marketPreview, prepareMarket } from './model/market';
import { scenarioSummary } from './model/preview';
import {
  startRun,
  completedBytes,
  CanceledRun,
  type CompletedRun,
} from './workers/pool';
import { downloadLocal, runManifestText } from './config/downloads';
import Builder from './components/Builder';
import Results from './components/Results';
import Ledger from './components/Ledger';
import Assumptions from './components/Assumptions';
import Compare from './components/Compare';
import { money } from './components/format';
import { SimulationError } from './model/errors';
import MarketData from './components/MarketData';
import ConfigField from './components/ConfigField';
import { BUILD_DISPLAY_VERSION } from './build-info';
import Tutorial from './components/Tutorial';
import ModeSelect from './components/ModeSelect';
import AdvancedGuide from './components/AdvancedGuide';
import LanguageSwitcher from './i18n/LanguageSwitcher';
import { useI18n } from './i18n/context';
type Tab = 'configuration' | 'results' | 'ledger' | 'assumptions' | 'compare';
export default function App() {
  const { t, intlLocale } = useI18n();
  const [references, setReferences] =
    useState<PublicReferenceBundle>(bundledReferences);
  const [draft, setDraft] = useState<DraftScenario | null>(null),
    [tab, setTab] = useState<Tab>('configuration'),
    [phase, setPhase] = useState('ready'),
    [progress, setProgress] = useState(0),
    [activeCount, setActiveCount] = useState(0),
    [error, setError] = useState(''),
    [importIssues, setImportIssues] = useState<FieldIssue[]>([]),
    [completed, setCompleted] = useState<CompletedRun>(),
    [baseline, setBaseline] = useState<CompletedRun>(),
    [toml, setToml] = useState(''),
    [tutorial, setTutorial] = useState(false),
    [tutorialStep, setTutorialStep] = useState(0),
    [tutorialDraft, setTutorialDraft] = useState<DraftScenario | null>(null),
    [modeSelect, setModeSelect] = useState(false),
    [advanced, setAdvanced] = useState(false),
    [advancedStep, setAdvancedStep] = useState(0),
    [advancedDraft, setAdvancedDraft] = useState<DraftScenario | null>(null),
    [pendingAutoRun, setPendingAutoRun] = useState(false),
    [builderSection, setBuilderSection] = useState('simulation'),
    [showStart, setShowStart] = useState(true);
  const fileInput = useRef<HTMLInputElement>(null),
    job = useRef<ReturnType<typeof startRun> | null>(null),
    importVersion = useRef(0);
  useEffect(() => () => job.current?.cancel(), []);
  const normalized = useMemo(
    () => (draft ? normalizeScenario(draft) : null),
    [draft],
  );
  const validated = useMemo(
    () => (draft ? validateScenario(draft, references) : null),
    [draft, references],
  );
  const issues = validated && !validated.ok ? validated.issues : [],
    valid = validated?.ok ? validated.value : undefined;
  const projection = useMemo(() => {
    if (!valid) return { preview: undefined, error: '' };
    try {
      return { preview: marketPreview(valid.scenario, references), error: '' };
    } catch (e) {
      return {
        preview: undefined,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }, [valid, references]);
  const summary = useMemo(
    () => (valid ? scenarioSummary(valid.scenario, references) : undefined),
    [valid, references],
  );
  const preview = useMemo(() => {
    try {
      return normalized?.ok
        ? exportScenario(normalized.value)
        : draft
          ? exportScenario(draft)
          : '';
    } catch {
      return t('draft.invalidArray');
    }
  }, [normalized, draft, t]);
  const draftHash = normalized?.ok ? hashObject(normalized.value) : '',
    busy = ['running', 'preparing', 'summarizing'].includes(phase);
  const change = (d: DraftScenario) => {
    importVersion.current++;
    setDraft(d);
    setImportIssues([]);
  };
  const load = (d: DraftScenario) => {
    importVersion.current++;
    // Server data auto-applies at mount, possibly before any draft exists;
    // patch newly loaded drafts when the active package differs from bundled.
    const server = references.market_data;
    setDraft(
      server && server.sha256 !== bundledReferences.market_data?.sha256
        ? applyMarketData(d, server, bundledReferences)
        : d,
    );
    setShowStart(false);
    setTab('configuration');
    setImportIssues([]);
    setError('');
  };
  const applyData = (data: Readonly<MarketDataSnapshot>) => {
    const next = withMarketData(references, data);
    setReferences(next);
    setDraft((current) =>
      current ? applyMarketData(current, data, references) : null,
    );
    setError('');
  };
  const example = () => {
    const d = createExampleDraft();
    load(
      references.market_data
        ? applyMarketData(d, references.market_data, bundledReferences)
        : d,
    );
  };
  const startTutorial = () => {
    setModeSelect(true);
  };
  // Every fresh blank draft — guided setup in either mode, or the blank
  // configuration link — starts from the same defaults the Power guide
  // used to pre-fill: US domicile, the current-year horizon, and a
  // freshly drawn seed. Explicit and uploaded values are never touched;
  // only drafts born blank get these.
  const freshBlankDraft = (): DraftScenario => {
    const blank = createEmptyDraft();
    if (blank.people) blank.people.domicile = 'US';
    blank.simulation = {
      ...blank.simulation,
      start_year: blank.simulation?.start_year ?? new Date().getFullYear(),
      max_age: blank.simulation?.max_age ?? 110,
      seed: blank.simulation?.seed ?? randomSeed(),
    };
    // A blank household starts with one person; an empty second person
    // only appears through the add-person control (guide or Builder).
    // Strip it here, at draft creation, rather than in a mount effect
    // whose stale clone could overwrite an early edit.
    const second = blank.people?.B;
    if (second && Object.keys(second).length === 0)
      delete (blank.people as Record<string, unknown>).B;
    return blank;
  };
  const pickMode = (mode: 'basic' | 'advanced') => {
    setModeSelect(false);
    setBuilderSection('simulation');
    if (mode === 'basic') {
      setTutorialStep(0);
      setTutorialDraft(freshBlankDraft());
      setTutorial(true);
    } else {
      setAdvancedStep(0);
      setAdvancedDraft(freshBlankDraft());
      setAdvanced(true);
    }
  };
  const finishTutorial = () => {
    if (tutorialDraft) load(tutorialDraft);
    setTutorialDraft(null);
    setTutorial(false);
    setPendingAutoRun(true);
  };
  const exitTutorial = () => {
    setTutorialDraft(null);
    setTutorial(false);
  };
  const finishAdvanced = () => {
    if (advancedDraft) load(advancedDraft);
    setAdvancedDraft(null);
    setAdvanced(false);
    setPendingAutoRun(true);
  };
  const exitAdvanced = () => {
    setAdvancedDraft(null);
    setAdvanced(false);
  };
  const stageText = (text: string) => {
    const result = parseScenario(text);
    if (result.ok) {
      load(result.value);
      return;
    }
    setImportIssues(result.issues);
  };
  const upload = async (file: File) => {
    const version = ++importVersion.current;
    if (file.size > MAX_CONFIG_BYTES) {
      setImportIssues([
        { code: 'range', path: 'file', message: t('error.tooLarge') },
      ]);
      return;
    }
    try {
      const text = await file.text();
      if (version === importVersion.current) stageText(text);
    } catch (e) {
      setError(t('error.readFile', { detail: String(e) }));
    }
  };
  const run = async () => {
    if (!valid || busy || projection.error) return;
    setError('');
    setProgress(0);
    setPhase('preparing');
    let ownId = '';
    try {
      const request = makeRunRequest(valid.scenario, references);
      prepareMarket(request.scenario, references);
      setActiveCount(request.manifest.n_paths);
      const memory =
        (baseline ? completedBytes(baseline) : 0) +
        (completed && completed !== baseline ? completedBytes(completed) : 0);
      const handle = startRun(
        request,
        references,
        (state, count) => {
          if (job.current?.id === handle.id) {
            setPhase(state);
            setProgress(count);
          }
        },
        memory,
      );
      ownId = handle.id;
      job.current = handle;
      setPhase('running');
      const result = await handle.promise;
      if (job.current?.id !== handle.id) return;
      setCompleted(result);
      setPhase('completed');
      setTab('results');
      job.current = null;
    } catch (e) {
      if (ownId && job.current?.id !== ownId) return;
      job.current = null;
      if (e instanceof CanceledRun) setPhase('canceled');
      else {
        setPhase('failed');
        const context =
          e instanceof SimulationError
            ? [
                e.detail.path_id !== undefined
                  ? t('run.errorPath', { id: e.detail.path_id })
                  : '',
                e.detail.year !== undefined
                  ? t('run.errorYear', { year: e.detail.year })
                  : '',
                e.detail.series ?? '',
              ]
                .filter(Boolean)
                .join(' · ')
            : '';
        setError(
          `${e instanceof Error ? e.message : String(e)}${context ? ` (${context})` : ''}`,
        );
      }
    }
  };
  // Guided-setup finish lands here after load() commits, so validation has
  // settled; waits out any in-flight run, then fires once.
  useEffect(() => {
    if (!pendingAutoRun || busy) return;
    setPendingAutoRun(false);
    void run();
  });
  const newDraft =
    completed &&
    (completed.request.manifest.scenario_sha256 !== draftHash ||
      JSON.stringify(completed.request.manifest.reference_hashes) !==
        JSON.stringify(references.hashes));
  return (
    <>
      <header className="app-header">
        <a className="brand" href="./" aria-label={t('header.home')}>
          <svg
            width="29"
            height="29"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
          >
            <rect width="32" height="32" rx="10" fill="#1f6259" />
            <g transform="translate(4 4)" fill="#fff">
              <path d="M17 15v9h5v-9zM2 0v24h5v-9h10v-5H7V5h10v5h5V0z" />
            </g>
          </svg>
          <span>
            retire<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="header-right">
          <LanguageSwitcher />
          <span className="local-badge">
            <span />
            {t('header.localBadge')}
          </span>
          <span className="version">v{BUILD_DISPLAY_VERSION}</span>
        </div>
      </header>
      <main>
        <section className="hero">
          <h1>{t('hero.title')}</h1>
          <p className="hero-copy">{t('hero.copy')}</p>
        </section>
        <input
          className="file-input"
          ref={fileInput}
          type="file"
          aria-label={t('upload.aria')}
          accept=".toml,text/plain"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = '';
          }}
        />
        {(!draft || showStart) && (
          <>
            {draft && (
              <div className="workspace-toolbar">
                <button
                  className="secondary"
                  onClick={() => setShowStart(false)}
                >
                  {t('start.backToConfig')}
                </button>
              </div>
            )}
            <section className="entry-grid" aria-label={t('entry.grid')}>
              <article className="entry-card">
                <div className="entry-icon">✎</div>
                <h2>{t('entry.guided.title')}</h2>
                <p>{t('entry.guided.body')}</p>
                <div className="entry-actions">
                  <button className="primary" onClick={startTutorial}>
                    {t('entry.guided.start')} <span>→</span>
                  </button>
                  <button
                    className="text-button"
                    onClick={() => load(freshBlankDraft())}
                  >
                    {t('entry.guided.blank')}
                  </button>
                </div>
              </article>
              <article className="entry-card">
                <div className="entry-icon">↗</div>
                <h2>{t('entry.example.title')}</h2>
                <p>{t('entry.example.body')}</p>
                <div className="entry-actions">
                  <button className="secondary" onClick={example}>
                    {t('entry.example.load')} <span>→</span>
                  </button>
                  {/* Reserves one link row so all three main buttons align */}
                  <span className="text-button entry-spacer" aria-hidden="true">
                    &nbsp;
                  </span>
                </div>
              </article>
              <article className="entry-card">
                <div className="entry-icon">⇧</div>
                <h2>{t('entry.byo.title')}</h2>
                <p>{t('entry.byo.body')}</p>
                <div className="entry-actions">
                  <button
                    className="secondary"
                    onClick={() => fileInput.current?.click()}
                  >
                    {t('actions.uploadConfig')} <span>→</span>
                  </button>
                  {/* Reserves one link row so all three main buttons align */}
                  <span className="text-button entry-spacer" aria-hidden="true">
                    &nbsp;
                  </span>
                </div>
              </article>
            </section>
          </>
        )}
        {draft && !showStart && (
          <>
            <div className="workspace-toolbar">
              <button
                className="secondary"
                onClick={() => {
                  setTutorial(false);
                  setTutorialDraft(null);
                  setAdvanced(false);
                  setAdvancedDraft(null);
                  setShowStart(true);
                }}
              >
                {t('workspace.backToStart')}
              </button>
            </div>
            {summary && (
              <div className="plan-strip">
                <div>
                  <span>{t('plan.financial')}</span>
                  <b>{money(summary.financial_usd, 'USD', true, intlLocale)}</b>
                </div>
                <div>
                  <span>{t('plan.property')}</span>
                  <b>
                    {money(
                      summary.property_equity_usd,
                      'USD',
                      true,
                      intlLocale,
                    )}
                  </b>
                </div>
                <div>
                  <span>{t('plan.budget')}</span>
                  <b>
                    {money(summary.budget, summary.currency, true, intlLocale)}
                  </b>
                </div>
                <div>
                  <span>{t('plan.health')}</span>
                  <b>
                    {money(summary.health, summary.currency, true, intlLocale)}
                  </b>
                </div>
              </div>
            )}
            <section
              className="run-bar"
              style={
                phase === 'running' && activeCount > 0
                  ? {
                      background: `linear-gradient(to right, #c9dfcd ${(100 * progress) / activeCount}%, #edf2e9 ${(100 * progress) / activeCount}%)`,
                    }
                  : undefined
              }
            >
              <div>
                <strong>
                  {issues.length
                    ? t('run.issues', { count: issues.length })
                    : projection.error
                      ? t('run.marketAttention')
                      : t('run.ready')}
                </strong>
                <p>
                  {issues.length ? t('run.issuesHint') : t('run.readyHint')}
                </p>
              </div>
              <div className="run-controls">
                {busy ? (
                  <button
                    className="secondary"
                    onClick={() => {
                      job.current?.cancel();
                      setPhase('canceled');
                    }}
                  >
                    {t('run.cancel')}
                  </button>
                ) : (
                  <button
                    className="primary"
                    disabled={!valid || !!projection.error}
                    onClick={() => void run()}
                  >
                    {t('run.start')} <span>→</span>
                  </button>
                )}
              </div>
            </section>
            <div className="run-status" role="status" data-testid="run-status">
              {phase === 'running'
                ? ''
                : phase === 'summarizing'
                  ? t('run.summarizing')
                  : phase === 'completed'
                    ? t('run.completed', {
                        paths:
                          completed?.request.manifest.n_paths.toLocaleString(
                            intlLocale,
                          ) ?? '',
                        seconds: (
                          (completed?.execution.elapsed_ms ?? 0) / 1000
                        ).toFixed(2),
                        hash:
                          completed?.request.manifest.scenario_sha256.slice(
                            0,
                            12,
                          ) ?? '',
                      })
                    : phase === 'canceled'
                      ? t('run.canceled')
                      : phase === 'failed'
                        ? t('run.failed')
                        : t('run.local')}
            </div>
            {(issues.length > 0 || projection.error) && (
              <details className="validation panel" open>
                <summary>{t('validation.title')}</summary>
                {projection.error && <p role="alert">{projection.error}</p>}
                <ul>
                  {issues.map((i, n) => (
                    <li key={`${i.path}:${n}`}>
                      <code>{i.path}</code> — {i.message}
                    </li>
                  ))}
                </ul>
              </details>
            )}
            <nav className="tabs" aria-label={t('tabs.label')}>
              {(
                [
                  'configuration',
                  'results',
                  'ledger',
                  'assumptions',
                  'compare',
                ] as const
              ).map((key) => (
                <button
                  key={key}
                  className={tab === key ? 'active' : ''}
                  disabled={
                    (key === 'results' ||
                      key === 'ledger' ||
                      key === 'compare') &&
                    !completed
                  }
                  onClick={() => setTab(key)}
                >
                  {t(
                    key === 'configuration'
                      ? 'tabs.configuration'
                      : key === 'results'
                        ? 'tabs.results'
                        : key === 'ledger'
                          ? 'tabs.ledger'
                          : key === 'assumptions'
                            ? 'tabs.assumptions'
                            : 'tabs.compare',
                  )}
                  {key === 'compare' && baseline && (
                    <span className="tab-dot" />
                  )}
                </button>
              ))}
            </nav>
            {completed &&
              (newDraft ||
                busy ||
                phase === 'canceled' ||
                phase === 'failed') &&
              tab !== 'configuration' && (
                <p className="snapshot-note">
                  {t('snapshot.note', {
                    hash: completed.request.manifest.scenario_sha256.slice(
                      0,
                      12,
                    ),
                    seed: completed.request.manifest.seed,
                  })}
                </p>
              )}
            {tab === 'configuration' && (
              <>
                <Builder
                  draft={draft}
                  onChange={change}
                  section={builderSection}
                  onSectionChange={setBuilderSection}
                />
                <details className="panel toml-panel">
                  <summary>{t('toml.title')}</summary>
                  <p>{t('toml.hint')}</p>
                  <pre>{preview}</pre>
                  <button className="small" onClick={() => setToml(preview)}>
                    {t('toml.copy')}
                  </button>
                  <ConfigField
                    path={t('toml.editorPath')}
                    label={t('toml.label')}
                    description={t('toml.description')}
                  >
                    {(attributes) => (
                      <textarea
                        {...attributes}
                        aria-label={t('toml.editorPath')}
                        rows={12}
                        value={toml}
                        onChange={(e) => setToml(e.target.value)}
                        placeholder={t('toml.placeholder')}
                      />
                    )}
                  </ConfigField>
                  <button className="secondary" onClick={() => stageText(toml)}>
                    {t('toml.apply')}
                  </button>
                </details>
              </>
            )}
            {tab === 'results' && completed && (
              <>
                <Results run={completed} />
                <div className="toolbar export-toolbar">
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={() => {
                      setBaseline(completed);
                      setTab('compare');
                    }}
                  >
                    {t('export.pin')}
                  </button>
                  <button
                    className="secondary"
                    onClick={() =>
                      downloadLocal(
                        'retire-completed-run.toml',
                        exportScenario(completed.request.scenario),
                      )
                    }
                  >
                    {t('export.runConfig')}
                  </button>
                  <button
                    className="secondary"
                    onClick={() =>
                      downloadLocal(
                        'retire-run-manifest.json',
                        runManifestText(completed),
                        'application/json',
                      )
                    }
                  >
                    {t('export.manifest')}
                  </button>
                </div>
              </>
            )}
            {tab === 'ledger' && completed && (
              <Ledger key={completed.execution.run_id} run={completed} />
            )}
            {tab === 'assumptions' && (
              <Assumptions
                references={references}
                hash={draftHash}
                projection={projection.preview}
                summary={summary}
                run={completed}
              />
            )}
            {tab === 'compare' && completed && (
              <Compare
                run={completed}
                baseline={baseline}
                onPin={() => setBaseline(completed)}
                onUnpin={() => setBaseline(undefined)}
              />
            )}
          </>
        )}
        {modeSelect && (
          <ModeSelect onPick={pickMode} onClose={() => setModeSelect(false)} />
        )}
        {tutorial && tutorialDraft && (
          <Tutorial
            draft={tutorialDraft}
            onChange={setTutorialDraft}
            step={tutorialStep}
            onStep={setTutorialStep}
            onExit={exitTutorial}
            onFinish={finishTutorial}
          />
        )}
        {advanced && advancedDraft && (
          <AdvancedGuide
            draft={advancedDraft}
            onChange={setAdvancedDraft}
            step={advancedStep}
            onStep={setAdvancedStep}
            onExit={exitAdvanced}
            onFinish={finishAdvanced}
          />
        )}
        {(importIssues.length > 0 || error) && (
          <section className="panel error-panel" role="alert">
            <h3>{error ? t('error.simulation') : t('error.import')}</h3>
            {error && <p>{error}</p>}
            <ul>
              {importIssues.map((i, n) => (
                <li key={n}>
                  <code>{i.path}</code> — {i.message}
                </li>
              ))}
            </ul>
            <p>{t('error.preserved')}</p>
          </section>
        )}
        <MarketData references={references} onApply={applyData} />
      </main>
    </>
  );
}
