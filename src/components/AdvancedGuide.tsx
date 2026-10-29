import { useState } from 'react';
import type { DraftScenario } from '../model/types';
import { fieldTree } from '../config/schema';
import { validateScenario } from '../config/config';
import { references as bundledReferences } from '../reference/bundle';
import { scenarioSummary } from '../model/preview';
import {
  Editor,
  FixedAccountsEditor,
  MarketEditor,
  MedicalEditor,
  PeopleEditor,
  PropertiesEditor,
} from './Builder';
import { money } from './format';
import { GuideModeContext } from './ConfigField';
import { useI18n } from '../i18n/context';

const STEP_KEYS = [
  'adv.step.people',
  'adv.step.budget',
  'adv.step.medical',
  'adv.step.accounts',
  'adv.step.properties',
  'adv.step.oneTime',
  'adv.step.market',
  'adv.step.simulation',
  'adv.step.review',
] as const;

const PROMPT_KEYS = [
  'adv.prompt.people',
  'adv.prompt.budget',
  'adv.prompt.medical',
  'adv.prompt.accounts',
  'adv.prompt.properties',
  'adv.prompt.oneTime',
  'adv.prompt.market',
  'adv.prompt.simulation',
] as const;

function assign(draft: DraftScenario, path: string[], value: unknown) {
  const next = structuredClone(draft) as Record<string, unknown>;
  let node = next;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (typeof node[key] !== 'object' || node[key] === null)
      node[key] = /^\d+$/.test(path[i + 1]) ? [] : {};
    node = node[key] as Record<string, unknown>;
  }
  node[path[path.length - 1]] = value;
  return next as DraftScenario;
}

// Guide Step 2 covers the budget without medical expenses, which moved to
// Step 3 with the rest of the medical costs.
const budgetCore = {
  children: Object.fromEntries(
    Object.entries(fieldTree.children.budget.children).filter(
      ([key]) => key !== 'included_health',
    ),
  ),
};

function PersonCountControl({
  draft,
  onChange,
}: {
  draft: DraftScenario;
  onChange: (d: DraftScenario) => void;
}) {
  const { t } = useI18n();
  if (draft.people?.B === undefined)
    return (
      <div className="toolbar">
        <button
          type="button"
          className="secondary"
          onClick={() => onChange(assign(draft, ['people', 'B'], {}))}
        >
          <span aria-hidden="true">+</span> {t('adv.addPerson')}
        </button>
      </div>
    );
  return (
    <div className="toolbar">
      <button
        type="button"
        className="secondary danger"
        onClick={() => {
          const next = structuredClone(draft);
          if (next.people) delete (next.people as Record<string, unknown>).B;
          onChange(next);
        }}
      >
        {t('adv.removePerson')}
      </button>
    </div>
  );
}

export default function AdvancedGuide({
  draft,
  onChange,
  step,
  onStep,
  onExit,
  onFinish,
}: {
  draft: DraftScenario;
  onChange: (d: DraftScenario) => void;
  step: number;
  onStep: (n: number) => void;
  onExit: () => void;
  onFinish: () => void;
}) {
  const { t, intlLocale } = useI18n();
  const [confirmExit, setConfirmExit] = useState(false);
  const currentYear = new Date().getFullYear();

  // Prefill horizon defaults in the same transition that opens the
  // simulation step, so the step renders with them already in the draft.
  // A post-paint effect cannot do this safely: an edit made before the
  // effect runs closes over the pre-prefill draft, and its onChange then
  // overwrites the prefilled values for good (the effect never re-runs).
  const goToStep = (nextStep: number) => {
    if (nextStep === 7) {
      let next = draft;
      if (next.simulation?.start_year === undefined)
        next = assign(next, ['simulation', 'start_year'], currentYear);
      if (next.simulation?.max_age === undefined)
        next = assign(next, ['simulation', 'max_age'], 110);
      if (next !== draft) onChange(next);
    }
    onStep(nextStep);
  };

  const last = step === STEP_KEYS.length - 1;
  const validation = last ? validateScenario(draft, bundledReferences) : null;
  const summary =
    validation && validation.ok
      ? scenarioSummary(validation.value.scenario, bundledReferences)
      : null;

  return (
    <div className="modal-overlay">
      <section
        className="modal-dialog wide"
        role="dialog"
        aria-modal="true"
        aria-label={t('adv.dialog')}
      >
        <div className={confirmExit ? 'modal-stack modal-blur' : 'modal-stack'}>
          <div className="section-title">
            <div>
              <h2>
                {t('adv.stepTitle', {
                  step: step + 1,
                  total: STEP_KEYS.length,
                  name: t(STEP_KEYS[step]),
                })}
              </h2>
            </div>
            <button
              type="button"
              className="modal-close"
              onClick={() => setConfirmExit(true)}
              aria-label={t('adv.exit')}
            >
              ✕
            </button>
          </div>
          <div key={step} className="wizard-body">
            {step < PROMPT_KEYS.length && (
              <p>
                {t(PROMPT_KEYS[step], {
                  ccy: draft.people?.domicile === 'US' ? 'USD' : 'CNY',
                })}
              </p>
            )}
            <GuideModeContext.Provider value={true}>
              {step === 0 && (
                <>
                  <div className="people-editor">
                    <PeopleEditor draft={draft} onChange={onChange} />
                  </div>
                  <PersonCountControl draft={draft} onChange={onChange} />
                </>
              )}
              {step === 1 && (
                <Editor
                  node={budgetCore}
                  keys={['budget']}
                  draft={draft}
                  onChange={onChange}
                />
              )}
              {step === 2 && (
                <MedicalEditor draft={draft} onChange={onChange} />
              )}
              {step === 3 && (
                <FixedAccountsEditor draft={draft} onChange={onChange} />
              )}
              {step === 4 && (
                <PropertiesEditor draft={draft} onChange={onChange} />
              )}
              {step === 5 && (
                <Editor
                  node={fieldTree.children.one_time}
                  keys={['one_time']}
                  draft={draft}
                  onChange={onChange}
                />
              )}
              {step === 6 && <MarketEditor draft={draft} onChange={onChange} />}
              {step === 7 && (
                <Editor
                  node={fieldTree.children.simulation}
                  keys={['simulation']}
                  draft={draft}
                  onChange={onChange}
                />
              )}
              {last && (
                <>
                  <p>{t('adv.reviewBody')}</p>
                  {summary ? (
                    <ul className="wizard-review">
                      <li>
                        {t('adv.reviewPeople', {
                          size: draft.people?.B ? 2 : 1,
                          domicile: draft.people?.domicile ?? '—',
                          ageA: summary.start_ages.A,
                        })}
                      </li>
                      <li>
                        {t('adv.reviewMoney', {
                          budget: money(
                            summary.budget,
                            summary.currency,
                            false,
                            intlLocale,
                          ),
                          assets: money(
                            summary.financial_usd,
                            'USD',
                            false,
                            intlLocale,
                          ),
                        })}
                      </li>
                      <li>
                        {t('adv.reviewHorizon', {
                          start: draft.simulation?.start_year ?? '—',
                          paths: draft.simulation?.n_paths ?? '—',
                        })}
                      </li>
                    </ul>
                  ) : (
                    <ul className="wizard-review">
                      {(validation && !validation.ok
                        ? validation.issues.slice(0, 12)
                        : []
                      ).map((i, n) => (
                        <li key={n}>
                          <code>{i.path}</code> — {i.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </GuideModeContext.Provider>
          </div>
          <div className="toolbar">
            <button
              className="secondary"
              disabled={step === 0}
              onClick={() => goToStep(step - 1)}
            >
              {t('tutorial.back')}
            </button>
            {step < STEP_KEYS.length - 1 ? (
              <button className="primary" onClick={() => goToStep(step + 1)}>
                {t('tutorial.next')} <span>→</span>
              </button>
            ) : (
              <button
                className="primary"
                disabled={!summary}
                onClick={onFinish}
              >
                {t('tutorial.finish')}
              </button>
            )}
          </div>
        </div>
        {confirmExit && (
          <div className="exit-confirm" role="alertdialog">
            <p>{t('tutorial.confirmExit')}</p>
            <div className="toolbar">
              <button
                className="primary"
                autoFocus
                onClick={() => setConfirmExit(false)}
              >
                {t('tutorial.keepEditing')}
              </button>
              <button className="secondary danger" onClick={onExit}>
                {t('tutorial.discardExit')}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
