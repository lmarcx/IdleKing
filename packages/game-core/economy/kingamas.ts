import type { ResourceId, ResourceReward } from "../loot/lootTables.js";

/**
 * Kingamas are a premium progression currency:
 * - never lost in expeditions (MVP)
 * - used for gear upgrades + special merchants
 * - leaderboard #3: total kingamas held
 *
 * Unlock: Tier II via quest + building (handled in quests.ts, building system later)
 */

export type KingamasWallet = {
  balance: number; // current held
  lifetimeEarned: number; // useful for analytics/anti-cheat later
};

export function createWallet(balance = 0): KingamasWallet {
  return { balance, lifetimeEarned: balance };
}

export type KingamasConfig = {
  // Conversion from resources to kingamas (MVP)
  // Example: 1000 bronze -> 1 kingama
  conversionRates: Record<ResourceId, number>; // resources per 1 kingama

  // Unlock world level threshold (Tier II starts at 11)
  unlockWorldLevel: number;

  // Optional: minimum kingamas granted per conversion batch
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

/**
 * Convert a set of resources into kingamas.
 * - deterministic
 * - never negative
 * - does NOT mutate inputs
 */
export function convertResourcesToKingamas(params: {
  worldLevel: number;
  wallet: KingamasWallet;
  resources: ResourceReward[]; // what player wants to spend
  cfg?: KingamasConfig;
}): { wallet: KingamasWallet; spent: ResourceReward[]; gained: number } {
  const cfg = params.cfg ?? DEFAULT_KINGAMAS_CONFIG;

  // Locked before unlockWorldLevel
  if (params.worldLevel < cfg.unlockWorldLevel) {
    return { wallet: params.wallet, spent: [], gained: 0 };
  }

  // Aggregate spend
  const spendMap: Partial<Record<ResourceId, number>> = {};
  for (const r of params.resources) {
    if (!r || r.amount <= 0) continue;
    spendMap[r.id] = (spendMap[r.id] ?? 0) + r.amount;
  }

  let gained = 0;
  const spent: ResourceReward[] = [];

  for (const [id, amount] of Object.entries(spendMap) as Array<[ResourceId, number]>) {
    const rate = cfg.conversionRates[id];
    if (!rate || rate <= 0) continue;

    const k = Math.floor(amount / rate);
    if (k <= 0) continue;

    gained += k;

    const used = k * rate;
    spent.push({ id, amount: used });
  }

  if (gained < cfg.minGrant) gained = 0;

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

  return {
    wallet: { ...wallet, balance: wallet.balance - a },
    ok: true,
  };
}

/**
 * Reward kingamas (quests, events). Always succeeds.
 */
export function grantKingamas(wallet: KingamasWallet, amount: number): KingamasWallet {
  const a = Math.floor(amount);
  if (a <= 0) return wallet;
  return {
    balance: wallet.balance + a,
    lifetimeEarned: wallet.lifetimeEarned + a,
  };
}
