import type { GeneratedItem } from "../loot/itemGenerator.js";
import { applyUpgrade, getUpgradeCost, canUpgrade } from "../loot/upgradeEngine.js";
import type { KingamasWallet } from "./kingamas.js";
import { spendKingamas } from "./kingamas.js";

export type MaterialStore = Record<string, number>;

export type UpgradeAttemptResult =
  | {
      ok: true;
      item: GeneratedItem;
      wallet: KingamasWallet;
      materials: MaterialStore;
      paid: { kingamas: number; materials: Array<{ id: string; amount: number }> };
    }
  | {
      ok: false;
      reason: "MAX_LEVEL" | "INSUFFICIENT_KINGAMAS" | "INSUFFICIENT_MATERIALS";
      item: GeneratedItem;
      wallet: KingamasWallet;
      materials: MaterialStore;
      required?: { kingamas: number; materials: Array<{ id: string; amount: number }> };
    };

function hasMaterials(store: MaterialStore, req: Array<{ id: string; amount: number }>) {
  for (const r of req) {
    if ((store[r.id] ?? 0) < r.amount) return false;
  }
  return true;
}

function spendMaterials(store: MaterialStore, req: Array<{ id: string; amount: number }>): MaterialStore {
  const next = { ...store };
  for (const r of req) {
    next[r.id] = (next[r.id] ?? 0) - r.amount;
  }
  return next;
}

/**
 * One-stop upgrade purchase:
 * - checks max
 * - checks materials (stub store)
 * - checks kingamas
 * - applies upgrade
 */
export function tryUpgradeItem(params: {
  item: GeneratedItem;
  worldLevel: number;
  wallet: KingamasWallet;
  materials: MaterialStore;
}): UpgradeAttemptResult {
  const { item, worldLevel, wallet, materials } = params;

  if (!canUpgrade(item)) {
    return { ok: false, reason: "MAX_LEVEL", item, wallet, materials };
  }

  const cost = getUpgradeCost(item, worldLevel);

  if (!hasMaterials(materials, cost.materials)) {
    return {
      ok: false,
      reason: "INSUFFICIENT_MATERIALS",
      item,
      wallet,
      materials,
      required: { kingamas: cost.kingamas, materials: cost.materials },
    };
  }

  const spend = spendKingamas(wallet, cost.kingamas);
  if (!spend.ok) {
    return {
      ok: false,
      reason: "INSUFFICIENT_KINGAMAS",
      item,
      wallet,
      materials,
      required: { kingamas: cost.kingamas, materials: cost.materials },
    };
  }

  const nextMaterials = spendMaterials(materials, cost.materials);
  const nextItem = applyUpgrade(item, worldLevel);

  return {
    ok: true,
    item: nextItem,
    wallet: spend.wallet,
    materials: nextMaterials,
    paid: { kingamas: cost.kingamas, materials: cost.materials },
  };
}
