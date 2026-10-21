import type { ModelError } from './types';
export class SimulationError extends Error {
  readonly detail: ModelError;
  constructor(detail: ModelError) {
    super(detail.message);
    this.name = 'SimulationError';
    this.detail = detail;
  }
}
export function requireFactor(
  value: number,
  positive: boolean,
  context: Partial<ModelError>,
) {
  if (!Number.isFinite(value) || (positive ? value <= 0 : value < 0))
    throw new SimulationError({
      code: 'INVALID_FACTOR',
      message: `Invalid ${context.series ?? 'model'} gross factor ${value}`,
      factor: value,
      ...context,
    });
}
export const NUMERICAL_ZERO = 1e-6;
export function cleanResidual(value: number) {
  return Math.abs(value) <= NUMERICAL_ZERO ? 0 : value;
}
