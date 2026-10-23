import { useEffect, useState } from 'react';
import type { DraftScenario } from '../model/types';
import NumberInput from './NumberInput';
import { useI18n } from '../i18n/context';
import { enumLabel } from '../i18n/core';

const STEP_KEYS = [
  'tutorial.step.household',
  'tutorial.step.people',
  'tutorial.step.spending',
  'tutorial.step.savings',
  'tutorial.step.retirement',
  'tutorial.step.horizon',
  'tutorial.step.done',
] as const;
const MIX = { us_stocks: 0.6, us_bonds: 0.3, usd_cash: 0.1 };
const currentYear = new Date().getFullYear();

function assign(
  root: DraftScenario,
  keys: (string | number)[],
  value: unknown,
): DraftScenario {
  const copy = structuredClone(root) as Record<string | number, unknown>;
  let obj = copy;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!obj[key] || typeof obj[key] !== 'object')
      obj[key] = typeof keys[i + 1] === 'number' ? [] : {};
    obj = obj[key] as Record<string | number, unknown>;
  }
  if (value === undefined) delete obj[keys.at(-1)!];
  else obj[keys.at(-1)!] = value;
  return copy as DraftScenario;
}

function Toggle({
  label,
  options,
  value,
  onPick,
}: {
  label: string;
  options: readonly { value: string; label: string }[];
  value: string | undefined;
  onPick: (v: string) => void;
}) {
  return (
    <div className="toolbar toggle-group" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="secondary"
          aria-pressed={value === o.value}
          onClick={() => onPick(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function Tutorial({
  draft,
  onChange,
  onExit,
  onFinish,
  step,
  onStep,
}: {
  draft: DraftScenario;
  onChange: (d: DraftScenario) => void;
  onExit: () => void;
  onFinish: () => void;
  step: number;
  onStep: (n: number) => void;
}) {
  const { t, lang, intlLocale } = useI18n();
  const [confirmExit, setConfirmExit] = useState(false);
  const size = draft.people?.B === undefined ? 1 : 2;
  const upsertAccount = (
    base: DraftScenario,
    account: Record<string, unknown>,
  ) => {
    const accounts = [...(base.accounts ?? [])];
    const i = accounts.findIndex((a) => a.name === account.name);
    if (i >= 0) accounts[i] = { ...accounts[i], ...account };
    else accounts.push(account as never);
    return {
      ...base,
      accounts,
      withdrawals: {
        ...base.withdrawals,
        last_resort_property_sale: false,
      },
    };
  };
  const setSize = (n: number) => {
    // Ownership is derived from the household size; nothing per-account to fix.
    onChange(
      n === 1
        ? assign(draft, ['people', 'B'], undefined)
        : assign(draft, ['people', 'B'], draft.people?.B ?? {}),
    );
  };
  const setCitizen = (id: 'A' | 'B', citizen: boolean) =>
    // Tax status is derived from citizenship during normalization.
    onChange(assign(draft, ['people', id, 'us_citizen'], citizen));
  const setBalance = (balance: number | undefined) =>
    onChange(
      upsertAccount(draft, {
        name: 'brokerage',
        type: 'brokerage',
        balance,
        allocation: { ...MIX },
      }),
    );
  const setRetirement = (
    kind: 'pre_tax' | 'after_tax',
    amount: number | undefined,
  ) =>
    onChange(
      upsertAccount(draft, {
        name: kind,
        type: kind,
        balance: amount,
        allocation: { ...MIX },
        ...(kind === 'pre_tax' ? { rule_of_55: false } : {}),
      }),
    );
  // Prefill horizon defaults once when the step opens; everything else stays blank until answered.
  useEffect(() => {
    if (step !== 5) return;
    let next = draft;
    if (next.simulation?.start_year === undefined)
      next = assign(next, ['simulation', 'start_year'], currentYear);
    if (next.simulation?.max_age === undefined)
      next = assign(next, ['simulation', 'max_age'], 110);
    if (next !== draft) onChange(next);
  }, [step]);
  // Shocks default to enabled, so opt out explicitly until the user opts in.
  useEffect(() => {
    if (step !== 2) return;
    if (draft.medical?.shock_enabled === undefined)
      onChange(assign(draft, ['medical', 'shock_enabled'], false));
  }, [step]);
  const startYear = draft.simulation?.start_year ?? currentYear;
  const birthOk = (id: 'A' | 'B') => {
    const birth = draft.people?.[id]?.birth_year,
      age = typeof birth === 'number' ? startYear - birth : NaN;
    return Number.isInteger(birth) && age >= 18 && age <= 100;
  };
  const citizenOk = (id: 'A' | 'B') =>
    typeof draft.people?.[id]?.us_citizen === 'boolean';
  const ccy = draft.people?.domicile === 'US' ? 'USD' : 'CNY',
    annual = draft.budget?.annual,
    medical = draft.budget?.included_health,
    shockOn = draft.medical?.shock_enabled === true,
    shockMedian = draft.medical?.shock_median,
    careOn = draft.medical?.late_life_care?.enabled === true,
    careAge = draft.medical?.late_life_care?.start_age,
    careMonthly = draft.medical?.late_life_care?.monthly;
  const balanceOf = (name: string) =>
    draft.accounts?.find((a) => a.name === name)?.balance;
  const balance = balanceOf('brokerage'),
    preTax = balanceOf('pre_tax'),
    afterTax = balanceOf('after_tax');
  const amountOk = (v: number | undefined) =>
    typeof v === 'number' && Number.isFinite(v) && v >= 0;
  const maxAge = draft.simulation?.max_age;
  const valid = [
    draft.people?.domicile === 'US' || draft.people?.domicile === 'China',
    birthOk('A') &&
      citizenOk('A') &&
      (size === 1 || (birthOk('B') && citizenOk('B'))),
    typeof annual === 'number' &&
      Number.isFinite(annual) &&
      annual >= 0 &&
      (medical === undefined ||
        (Number.isFinite(medical) && medical >= 0 && medical <= annual)) &&
      (!shockOn || amountOk(shockMedian)) &&
      (!careOn ||
        (Number.isInteger(careAge) &&
          (careAge ?? 0) >= 0 &&
          (careAge ?? 0) <= 200 &&
          amountOk(careMonthly))),
    amountOk(balance),
    amountOk(preTax) && amountOk(afterTax),
    Number.isInteger(draft.simulation?.start_year) &&
      Number.isInteger(maxAge) &&
      (maxAge ?? 0) >= 18 &&
      (maxAge ?? 0) <= 200 &&
      (size === 1 ? ['A'] : ['A', 'B']).every(
        (id) =>
          (maxAge ?? 0) >=
          startYear -
            (draft.people?.[id as 'A' | 'B']?.birth_year ?? startYear),
      ),
    true,
  ][step];
  const person = (id: 'A' | 'B', label: string) => (
    <fieldset className="wizard-person">
      <legend>{label}</legend>
      <label>
        {t('tutorial.birthYear')}
        <NumberInput
          aria-label={t('tutorial.personBirth', { id })}
          value={draft.people?.[id]?.birth_year}
          onChange={(v) =>
            onChange(assign(draft, ['people', id, 'birth_year'], v))
          }
        />
      </label>
      <Toggle
        label={t('tutorial.citizenship', { id })}
        options={[
          { value: 'citizen', label: t('tutorial.citizen') },
          { value: 'noncitizen', label: t('tutorial.nonCitizen') },
        ]}
        value={
          draft.people?.[id]?.us_citizen === undefined
            ? undefined
            : draft.people[id]!.us_citizen
              ? 'citizen'
              : 'noncitizen'
        }
        onPick={(v) => setCitizen(id, v === 'citizen')}
      />
    </fieldset>
  );
  return (
    <div className="modal-overlay">
      <section
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={t('tutorial.dialog')}
      >
        <div className="section-title">
          <div>
            <p className="eyebrow">{t('tutorial.eyebrow')}</p>
            <h2>
              {step < 6
                ? t('tutorial.question', {
                    step: step + 1,
                    name: t(STEP_KEYS[step]),
                  })
                : t('tutorial.reviewTitle')}
            </h2>
          </div>
          <span className="chip">
            {t('tutorial.stepOf', { step: step + 1, total: STEP_KEYS.length })}
          </span>
        </div>
        <div key={step} className="wizard-body">
          {step === 0 && (
            <>
              <p>{t('tutorial.q0household')}</p>
              <Toggle
                label={t('household.group')}
                options={[
                  { value: 'one', label: t('household.one') },
                  { value: 'two', label: t('household.two') },
                ]}
                value={size === 1 ? 'one' : 'two'}
                onPick={(v) => setSize(v === 'one' ? 1 : 2)}
              />
              <p>{t('tutorial.q0domicile')}</p>
              <Toggle
                label={t('tutorial.domicile')}
                options={['US', 'China'].map((v) => ({
                  value: v,
                  label: enumLabel(lang, v, v),
                }))}
                value={draft.people?.domicile}
                onPick={(v) =>
                  onChange(assign(draft, ['people', 'domicile'], v))
                }
              />
              <p className="muted">{t('tutorial.domicileNote')}</p>
            </>
          )}
          {step === 1 && (
            <>
              <p>{t('tutorial.q1')}</p>
              {person(
                'A',
                size === 1 ? t('tutorial.you') : t('tutorial.personA'),
              )}
              {size === 2 && person('B', t('tutorial.personB'))}
            </>
          )}
          {step === 2 && (
            <>
              <p>{t('tutorial.q2')}</p>
              <label>
                {t('tutorial.annualSpending', { ccy })}
                <NumberInput
                  aria-label={t('tutorial.annualSpendingAria', { ccy })}
                  autoFocus
                  value={annual}
                  onChange={(v) =>
                    onChange(assign(draft, ['budget', 'annual'], v))
                  }
                />
              </label>
              <label>
                {t('tutorial.medicalSpending', { ccy })}
                <NumberInput
                  aria-label={t('tutorial.medicalSpendingAria', { ccy })}
                  value={medical}
                  onChange={(v) =>
                    onChange(assign(draft, ['budget', 'included_health'], v))
                  }
                />
              </label>
              <label className="wizard-check">
                <input
                  type="checkbox"
                  checked={shockOn}
                  onChange={(e) =>
                    onChange(
                      assign(
                        draft,
                        ['medical', 'shock_enabled'],
                        e.target.checked,
                      ),
                    )
                  }
                />
                {t('tutorial.shockCheck')}
              </label>
              {shockOn && (
                <div className="wizard-sub">
                  <label>
                    {t('tutorial.shockAmount', { ccy })}
                    <NumberInput
                      aria-label={t('tutorial.shockAmountAria', { ccy })}
                      value={shockMedian}
                      onChange={(v) =>
                        onChange(assign(draft, ['medical', 'shock_median'], v))
                      }
                    />
                  </label>
                </div>
              )}
              <label className="wizard-check">
                <input
                  type="checkbox"
                  checked={careOn}
                  onChange={(e) =>
                    onChange(
                      assign(
                        draft,
                        ['medical', 'late_life_care', 'enabled'],
                        e.target.checked,
                      ),
                    )
                  }
                />
                {t('tutorial.careCheck')}
              </label>
              {careOn && (
                <div className="wizard-sub">
                  <label>
                    {t('tutorial.careStartAge')}
                    <NumberInput
                      aria-label={t('tutorial.careStartAge')}
                      value={careAge}
                      onChange={(v) =>
                        onChange(
                          assign(
                            draft,
                            ['medical', 'late_life_care', 'start_age'],
                            v,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    {t('tutorial.careMonthly', { ccy })}
                    <NumberInput
                      aria-label={t('tutorial.careMonthlyAria', { ccy })}
                      value={careMonthly}
                      onChange={(v) =>
                        onChange(
                          assign(
                            draft,
                            ['medical', 'late_life_care', 'monthly'],
                            v,
                          ),
                        )
                      }
                    />
                  </label>
                </div>
              )}
            </>
          )}
          {step === 3 && (
            <>
              <p>{t('tutorial.q3')}</p>
              <label>
                {t('tutorial.investmentSavings')}
                <NumberInput
                  aria-label={t('tutorial.investmentSavingsAria')}
                  autoFocus
                  value={balance}
                  onChange={setBalance}
                />
              </label>
              <p className="muted">{t('tutorial.savingsNote')}</p>
            </>
          )}
          {step === 4 && (
            <>
              <p>{t('tutorial.q4')}</p>
              <label>
                {t('tutorial.preTax')}
                <NumberInput
                  aria-label={t('tutorial.preTaxAria')}
                  autoFocus
                  value={preTax}
                  onChange={(v) => setRetirement('pre_tax', v)}
                />
              </label>
              <label>
                {t('tutorial.afterTax')}
                <NumberInput
                  aria-label={t('tutorial.afterTaxAria')}
                  value={afterTax}
                  onChange={(v) => setRetirement('after_tax', v)}
                />
              </label>
              <p className="muted">{t('tutorial.retirementNote')}</p>
            </>
          )}
          {step === 5 && (
            <>
              <p>{t('tutorial.q5')}</p>
              <label>
                {t('tutorial.startYear')}
                <NumberInput
                  aria-label={t('tutorial.startYear')}
                  autoFocus
                  value={draft.simulation?.start_year}
                  onChange={(v) =>
                    onChange(assign(draft, ['simulation', 'start_year'], v))
                  }
                />
              </label>
              <label>
                {t('tutorial.throughAge')}
                <NumberInput
                  aria-label={t('tutorial.throughAge')}
                  value={maxAge}
                  onChange={(v) =>
                    onChange(assign(draft, ['simulation', 'max_age'], v))
                  }
                />
              </label>
              <p className="muted">{t('tutorial.horizonNote')}</p>
            </>
          )}
          {step === 6 && (
            <ul className="wizard-review">
              <li>
                {t('tutorial.reviewHousehold', {
                  household: t(size === 1 ? 'household.one' : 'household.two'),
                  domicile: enumLabel(
                    lang,
                    draft.people?.domicile ?? '',
                    draft.people?.domicile ?? '',
                  ),
                })}
              </li>
              <li>
                {t('tutorial.reviewSpending', {
                  amount: (annual ?? 0).toLocaleString(intlLocale),
                  ccy,
                  medical:
                    (medical ?? 0) > 0
                      ? t('tutorial.reviewMedical', {
                          amount: medical!.toLocaleString(intlLocale),
                          ccy,
                        })
                      : '',
                })}
              </li>
              {shockOn && (
                <li>
                  {t('tutorial.reviewShock', {
                    amount: (shockMedian ?? 0).toLocaleString(intlLocale),
                    ccy,
                  })}
                </li>
              )}
              {careOn && (
                <li>
                  {t('tutorial.reviewCare', {
                    age: careAge ?? 0,
                    amount: (careMonthly ?? 0).toLocaleString(intlLocale),
                    ccy,
                  })}
                </li>
              )}
              <li>
                {t('tutorial.reviewSavings', {
                  balance: (balance ?? 0).toLocaleString(intlLocale),
                  pre: (preTax ?? 0).toLocaleString(intlLocale),
                  after: (afterTax ?? 0).toLocaleString(intlLocale),
                })}
              </li>
              <li>
                {t('tutorial.reviewHorizon', {
                  start: startYear,
                  age: maxAge ?? 0,
                })}
              </li>
            </ul>
          )}
        </div>
        {confirmExit && <p className="danger">{t('tutorial.confirmExit')}</p>}
        <div className="toolbar">
          {confirmExit ? (
            <>
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
            </>
          ) : (
            <>
              <button
                className="secondary"
                disabled={step === 0}
                onClick={() => onStep(step - 1)}
              >
                {t('tutorial.back')}
              </button>
              {step < STEP_KEYS.length - 1 ? (
                <button
                  className="primary"
                  disabled={!valid}
                  onClick={() => onStep(step + 1)}
                >
                  {t('tutorial.next')} <span>→</span>
                </button>
              ) : (
                <button className="primary" onClick={onFinish}>
                  {t('tutorial.finish')}
                </button>
              )}
              {step < 6 ? (
                <button
                  className="secondary push-right"
                  onClick={() => setConfirmExit(true)}
                >
                  {t('tutorial.exit')}
                </button>
              ) : null}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
