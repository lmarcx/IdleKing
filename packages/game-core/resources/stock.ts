import { normalizeResourceId, RESOURCE_MAX_STACK } from "./registry.js";
import type { CanonicalResourceId, ResourceStock } from "./types.js";

export type ResourceCosts = Readonly<Record<string, number | undefined>>;
export type ResourceStockInput = Readonly<Record<string, number | undefined>>;

export function clampResourceStack(quantity: number): number {
  if (!Number.isFinite(quantity)) return 0;
  return Math.min(RESOURCE_MAX_STACK, Math.max(0, Math.floor(quantity)));
}

export function getCanonicalResourceQuantity(stock: ResourceStockInput, resourceId: string): number {
  const canonicalId = normalizeResourceId(resourceId);
  return Object.entries(stock).reduce((total, [stockId, quantity]) => {
    if (tryNormalizeResourceId(stockId) !== canonicalId) return total;
    return total + clampResourceStack(quantity ?? 0);
  }, 0);
}

export function addResourceToStock(
  stock: ResourceStockInput,
  resourceId: string,
  amount: number
): ResourceStock {
  const canonicalId = normalizeResourceId(resourceId);
  const safeAmount = normalizeResourceAmount(amount);
  return setCanonicalQuantity(
    stock,
    canonicalId,
    clampResourceStack(getCanonicalResourceQuantity(stock, canonicalId) + safeAmount)
  );
}

export function removeResourceFromStock(
  stock: ResourceStockInput,
  resourceId: string,
  amount: number
): ResourceStock {
  const canonicalId = normalizeResourceId(resourceId);
  const safeAmount = normalizeResourceAmount(amount);
  const available = getCanonicalResourceQuantity(stock, canonicalId);
  if (available < safeAmount) {
    throw new Error(`Not enough resource ${canonicalId}: required ${safeAmount}, available ${available}`);
  }
  return setCanonicalQuantity(stock, canonicalId, available - safeAmount);
}

export function canSpendResources(stock: ResourceStockInput, costs: ResourceCosts): boolean {
  return Object.entries(costs).every(([resourceId, amount]) => {
    const safeAmount = normalizeResourceAmount(amount ?? 0);
    return getCanonicalResourceQuantity(stock, resourceId) >= safeAmount;
  });
}

export function spendResources(stock: ResourceStockInput, costs: ResourceCosts): ResourceStock {
  if (!canSpendResources(stock, costs)) {
    throw new Error("Not enough resources for requested costs");
  }

  return Object.entries(costs).reduce(
    (next, [resourceId, amount]) => removeResourceFromStock(next, resourceId, amount ?? 0),
    stock
  );
}

function setCanonicalQuantity(
  stock: ResourceStockInput,
  canonicalId: CanonicalResourceId,
  quantity: number
): ResourceStock {
  const next: ResourceStock = {};
  for (const [stockId, amount] of Object.entries(stock)) {
    if (tryNormalizeResourceId(stockId) === canonicalId) continue;
    next[stockId as keyof ResourceStock] = amount;
  }
  next[canonicalId] = clampResourceStack(quantity);
  return next;
}

function normalizeResourceAmount(amount: number): number {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new RangeError(`Resource amount must be a non-negative finite number: ${amount}`);
  }
  return Math.floor(amount);
}

function tryNormalizeResourceId(resourceId: string): CanonicalResourceId | null {
  try {
    return normalizeResourceId(resourceId);
  } catch {
    return null;
  }
}
