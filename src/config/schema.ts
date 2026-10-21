import { z } from 'zod';
import inventory from './fields.json' with { type: 'json' };
import type { DraftScenario, FieldIssue, Result } from '../model/types';

export interface FieldDefinition {
  path: string;
  type: string;
  unit: string;
  omission: string;
  default: unknown;
  default_kind: string;
  builder_section: string;
  constraints: string;
  description: string;
}
export const fields = inventory as FieldDefinition[];
export interface SchemaNode {
  children: Record<string, SchemaNode>;
  wildcard?: SchemaNode;
  item?: SchemaNode;
  field?: FieldDefinition;
}
export const fieldTree: SchemaNode = { children: {} };
for (const field of fields) {
  let node = fieldTree;
  for (const raw of field.path.split('.')) {
    if (raw === '*') {
      node.wildcard ??= { children: {} };
      node = node.wildcard;
      continue;
    }
    const array = raw.endsWith('[]'),
      key = raw.replace(/\[\]$/, '');
    node.children[key] ??= { children: {} };
    node = node.children[key];
    if (array) {
      node.item ??= { children: {} };
      node = node.item;
    }
  }
  node.field = field;
}
function leaf(type: string): z.ZodType {
  if (type.startsWith('enum '))
    return z.enum(type.slice(5).split('|') as [string, ...string[]]);
  if (type === 'boolean') return z.boolean();
  if (type === 'string') return z.string();
  if (type === 'integer')
    return z
      .number()
      .finite()
      .int()
      .refine(Number.isSafeInteger, 'Must be a safe integer');
  if (type === 'string[]') return z.array(z.string());
  if (type === 'number[]') return z.array(z.number().finite());
  if (type === '[number,number][]')
    return z.array(z.tuple([z.number().finite(), z.number().finite()]));
  return z.number().finite();
}
function build(node: SchemaNode): z.ZodType {
  if (node.item) return z.array(build(node.item));
  if (node.wildcard) return z.record(z.string(), build(node.wildcard));
  if (Object.keys(node.children).length)
    return z.strictObject(
      Object.fromEntries(
        Object.entries(node.children).map(([key, n]) => [
          key,
          build(n).optional(),
        ]),
      ),
    );
  if (node.field) return leaf(node.field.type);
  return z.strictObject({});
}
export const draftSchema = build(fieldTree);
export function checkDraft(value: unknown): Result<DraftScenario> {
  const result = draftSchema.safeParse(value);
  if (result.success) return { ok: true, value: result.data as DraftScenario };
  const issues: FieldIssue[] = result.error.issues.flatMap<FieldIssue>((i) =>
    i.code === 'unrecognized_keys'
      ? i.keys.map((key) => ({
          code: 'unknown_key' as const,
          path: [...i.path, key].join('.'),
          message: 'Unknown configuration key',
        }))
      : [
          {
            code: 'range' as const,
            path: i.path.join('.'),
            message: i.message,
          },
        ],
  );
  return { ok: false, issues };
}
