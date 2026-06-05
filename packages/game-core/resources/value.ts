import { getResourceDefinitionOrThrow } from "./registry.js";
import type { ResourceCosts } from "./stock.js";

export function calculateResourceValue(resourceId: string, quantity: number): number {
  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new RangeError(`Resource quantity must be a non-negative finite number: ${quantity}`);
  }
  return getResourceDefinitionOrThrow(resourceId).value * Math.floor(quantity);
}

export function calculateResourceBundleValue(costs: ResourceCosts): number {
  return Object.entries(costs).reduce(
    (total, [resourceId, quantity]) => total + calculateResourceValue(resourceId, quantity ?? 0),
    0
  );
}

export const calculateItemValueFromRecipeResources = calculateResourceBundleValue;
