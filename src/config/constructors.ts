import example from './example-template.json' with { type: 'json' };
import control from './control-template.json' with { type: 'json' };
import type { DraftScenario, AccountConfig } from '../model/types';
import { normalizeScenario } from './config';

function normalized(value: unknown): DraftScenario {
  const result = normalizeScenario(value as DraftScenario);
  if (!result.ok) throw new Error(JSON.stringify(result.issues));
  return result.value;
}
// The fixed three accounts in withdraw order. Balances are blank (0) and cash
// is the neutral starting allocation; the user adjusts balances and splits.
export function fixedAccounts(): AccountConfig[] {
  const basic = { balance: 0, allocation: { usd_cash: 1 } };
  return [
    { name: 'brokerage', type: 'brokerage', ...basic },
    { name: 'after_tax', type: 'after_tax', ...basic },
    { name: 'pre_tax', type: 'pre_tax', ...basic },
  ];
}
export function createEmptyDraft(): DraftScenario {
  return {
    schema_version: 1,
    simulation: {},
    people: { A: {}, B: {} },
    one_time: [],
    // Fixed identities only; balances and allocations stay blank until answered.
    accounts: [
      { name: 'brokerage', type: 'brokerage' },
      { name: 'after_tax', type: 'after_tax' },
      { name: 'pre_tax', type: 'pre_tax' },
    ] as DraftScenario['accounts'],
    properties: [],
    withdrawals: {},
  };
}
export function createExampleDraft(): DraftScenario {
  return normalized(structuredClone(example));
}
export function createControlDraft(): DraftScenario {
  return normalized(structuredClone(control));
}
export function createHouseholdDraft(): DraftScenario {
  const d = createControlDraft();
  d.simulation = { ...d.simulation, n_paths: 2000, max_age: 110 };
  delete d.people!.B!.us_income_tax_status;
  const basic = () => ({ allocation: { usd_cash: 1 } });
  d.accounts = [
    { name: 'brokerage', type: 'brokerage', balance: 3700000, ...basic() },
    { name: 'after_tax', type: 'after_tax', balance: 0, ...basic() },
    { name: 'pre_tax', type: 'pre_tax', balance: 1600000, ...basic() },
  ] as DraftScenario['accounts'];
  d.withdrawals = {
    last_resort_property_sale: false,
  };
  d.properties = [
    {
      id: 'household_property_unresolved',
      share_A: 0.5,
      value: 2000000,
      mortgage_balance: 731000,
      strategy: 'hold',
    },
  ];
  return d;
}
