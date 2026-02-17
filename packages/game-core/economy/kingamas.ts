import type { ResourceId, ResourceReward } from "../loot/lootTables.js";

/**
 * Kingamas are a premium progression currency:
 * - never lost in expeditions (MVP)
 * - used for gear upgrades + special merchants
 * - leaderboard #3: total kingamas held
 *
 * Unlock: Tier II via quest + building (handled in quests.ts later)
 */

export type KingamasWallet = {
  balance: number; // current held
  lifetimeEarned: number; // useful for analytics/anti-cheat later
};

export function createWallet(balance = 0): KingamasWallet {
  return { balance, lifetimeEarned: balance };
}

export type KingamasConfig = {
  conversionRates: Record<ResourceId, number>; // resources per 1 kingama
  unlockWorldLevel: number;
  minGrant: number;
};

export const DEFAULT_KINGAMAS_CONFIG: KingamasConfig = {
  unlockWorldLevel: 11,
  minGrant: 0,
  conversionRates: {
    BRONZE: 1000,
    COPPER: 700,
    SILVER: 450,
    GOLD: 250,

    WOOD: 1200,
    STONE: 1200,
    WATER: 1600,
    MEAT: 1600,
  },
};

function aggregate(resources: ResourceReward[]) {
  const spendMap: Partial<Record<ResourceId, number>> = {};
  for (const r of resources) {
    if (!r || r.amount <= 0) continue;
    spendMap[r.id] = (spendMap[r.id] ?? 0) + r.amount;
  }
  return spendMap;
}

/**
 * Manual conversion preview:
 * - what would be spent
 * - how many kingamas gained
 *
 * Useful for UI confirmations.
 */
export function previewResourceConversion(params: {
  worldLevel: number;
  resourcesToSpend: ResourceReward[];
  cfg?: KingamasConfig;
}): { gained: number; spent: ResourceReward[] } {
  const cfg = params.cfg ?? DEFAULT_KINGAMAS_CONFIG;

  if (params.worldLevel < cfg.unlockWorldLevel) {
    return { gained: 0, spent: [] };
  }

  const spendMap = aggregate(params.resourcesToSpend);

  let gained = 0;
  const spent: ResourceReward[] = [];

  for (const [id, amount] of Object.entries(spendMap) as Array<[ResourceId, number]>) {
    const rate = cfg.conversionRates[id];
    if (!rate || rate <= 0) continue;

    const k = Math.floor(amount / rate);
    if (k <= 0) continue;

    gained += k;
    spent.push({ id, amount: k * rate });
  }

  if (gained < cfg.minGrant) gained = 0;
  if (gained <= 0) return { gained: 0, spent: [] };

  return { gained, spent };
}

/**
 * Convert a set of resources into kingamas.
 * - deterministic
 * - never negative
 */
export function convertResourcesToKingamas(params: {
  worldLevel: number;
  wallet: KingamasWallet;
  resources: ResourceReward[]; // what player wants to spend
  cfg?: KingamasConfig;
}): { wallet: KingamasWallet; spent: ResourceReward[]; gained: number } {
  const { gained, spent } = previewResourceConversion({
    worldLevel: params.worldLevel,
    resourcesToSpend: params.resources,
    cfg: params.cfg,
  });

  if (gained <= 0) {
    return { wallet: params.wallet, spent: [], gained: 0 };
  }

  const wallet: KingamasWallet = {
    balance: params.wallet.balance + gained,
    lifetimeEarned: params.wallet.lifetimeEarned + gained,
  };

  return { wallet, spent, gained };
}

/**
 * Spend kingamas (upgrades, merchants). Returns false if insufficient.
 */
export function spendKingamas(wallet: KingamasWallet, amount: number): { wallet: KingamasWallet; ok: boolean } {
  const a = Math.floor(amount);
  if (a <= 0) return { wallet, ok: true };
  if (wallet.balance < a) return { wallet, ok: false };

  return { wallet: { ...wallet, balance: wallet.balance - a }, ok: true };
}

/**
 * Reward kingamas (quests). Always succeeds.
 */
export function grantKingamas(wallet: KingamasWallet, amount: number): KingamasWallet {
  const a = Math.floor(amount);
  if (a <= 0) return wallet;
  return { balance: wallet.balance + a, lifetimeEarned: wallet.lifetimeEarned + a };
}
