import example from './example-template.json' with { type: 'json' };
import control from './control-template.json' with { type: 'json' };
import type { DraftScenario, AccountConfig } from '../model/types';
import { normalizeScenario } from './config';

function normalized(value: unknown): DraftScenario {
  const result = normalizeScenario(value as DraftScenario);
  if (!result.ok) throw new Error(JSON.stringify(result.issues));
  return result.value;
}
export function createEmptyDraft(): DraftScenario {
  return {
    schema_version: 1,
    simulation: {},
    people: { A: {}, B: {} },
    one_time: [],
    accounts: [],
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
  d.people!.B!.us_income_tax_status = 'unresolved';
  const startingAccount = d.accounts![0];
  if (startingAccount.type !== 'brokerage')
    throw new Error('Expected a brokerage account in the planning example');
  const basic = () => ({ allocation: { usd_cash: 1 } });
  d.accounts = [
    {
      name: 'cash_equivalents',
      type: 'brokerage',
      owner: 'joint',
      share_A: 0.5,
      balance: 1700000,
      ...basic(),
    },
    {
      name: 'other_investments',
      type: 'brokerage',
      owner: 'joint',
      share_A: 0.5,
      balance: 2000000,
      ...basic(),
    },
    {
      name: 'retirement_unallocated',
      type: 'pre_tax',
      owner: 'A',
      balance: 1600000,
      ...basic(),
    },
  ] as DraftScenario['accounts'];
  d.withdrawals = {
    surplus_account: 'cash_equivalents',
    last_resort_property_sale: false,
  };
  d.properties = [
    {
      id: 'household_property_unresolved',
      share_A: 0.5,
      value: 2000000,
      mortgage_balance: 731000,
      strategy: 'hold',
      proceeds_account: 'cash_equivalents',
    },
  ];
  return d;
}
export function accountTemplate(
  type: AccountConfig['type'] = 'brokerage',
): AccountConfig {
  if (type === 'cash_cny')
    return {
      name: 'new_account',
      type,
      owner: 'joint',
      share_A: 0.5,
      balance: 0,
    };
  if (type === 'cash_usd')
    return {
      name: 'new_account',
      type,
      owner: 'A' as const,
      share_A: 1,
      balance: 0,
    };
  const basic = {
    name: 'new_account',
    owner: 'A' as const,
    share_A: 1,
    balance: 0,
    allocation: { usd_cash: 1 },
  };
  return type === 'brokerage'
    ? { ...basic, type }
    : { ...basic, type, ...(type === 'pre_tax' ? { rule_of_55: false } : {}) };
}
