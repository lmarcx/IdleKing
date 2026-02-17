import type { KingamasWallet } from "./kingamas.js";
import { grantKingamas } from "./kingamas.js";

export type QuestId =
  | "UNLOCK_KINGAMAS"
  | "REPEATABLE_RESOURCE_CONVERSION"
  | "REPEATABLE_BOSS_CHRONO_DAMAGE";

export type QuestType = "ONE_TIME" | "REPEATABLE";

export type QuestStatus = "LOCKED" | "AVAILABLE" | "COMPLETED" | "COOLDOWN";

export type QuestDefinition = {
  id: QuestId;
  type: QuestType;
  title: string;
  description: string;

  // Basic gating
  minWorldLevel?: number;

  // Rewards (MVP)
  kingamasReward?: number;

  // Repeatable cooldown (seconds)
  cooldownSeconds?: number;
};

export type QuestProgressState = {
  id: QuestId;
  status: QuestStatus;
  lastCompletedAt?: number; // epoch ms
};

export type QuestContext = {
  now: number; // epoch ms (inject for determinism)
  worldLevel: number;

  // Later: buildings state, boss chrono score, resources, etc.
  hasRoyalTreasuryBuilding?: boolean;
  bossChronoBestDamage?: number;
  resourcesConvertedLifetime?: number;
};

export const QUESTS: QuestDefinition[] = [
  {
    id: "UNLOCK_KINGAMAS",
    type: "ONE_TIME",
    title: "La Trésorerie Royale",
    description:
      "Construis la Trésorerie Royale pour débloquer les Kingamas, la monnaie des rois.",
    minWorldLevel: 11,
    kingamasReward: 10, // small starter pack
  },
  {
    id: "REPEATABLE_RESOURCE_CONVERSION",
    type: "REPEATABLE",
    title: "Alchimie Royale",
    description: "Convertis des ressources pour générer des Kingamas.",
    minWorldLevel: 11,
    kingamasReward: 3,
    cooldownSeconds: 6 * 60 * 60, // 6h
  },
  {
    id: "REPEATABLE_BOSS_CHRONO_DAMAGE",
    type: "REPEATABLE",
    title: "Épreuve du Roi Déchu",
    description: "Inflige un certain montant de dégâts en mode chrono (Boss Final).",
    minWorldLevel: 41, // endgame-ish
    kingamasReward: 8,
    cooldownSeconds: 24 * 60 * 60, // 24h
  },
];

export function getQuestDefinition(id: QuestId): QuestDefinition {
  const q = QUESTS.find((x) => x.id === id);
  if (!q) throw new Error(`Unknown quest id: ${id}`);
  return q;
}

function isOnCooldown(def: QuestDefinition, state: QuestProgressState, ctx: QuestContext) {
  if (def.type !== "REPEATABLE") return false;
  if (!def.cooldownSeconds) return false;
  if (!state.lastCompletedAt) return false;

  const elapsed = (ctx.now - state.lastCompletedAt) / 1000;
  return elapsed < def.cooldownSeconds;
}

function passesGating(def: QuestDefinition, ctx: QuestContext) {
  if (def.minWorldLevel != null && ctx.worldLevel < def.minWorldLevel) return false;
  return true;
}

/**
 * Evaluate the quest status given context (MVP stubs).
 * Later we can expand with real requirements (resources, damage thresholds, etc.).
 */
export function evaluateQuestStatus(def: QuestDefinition, state: QuestProgressState, ctx: QuestContext): QuestStatus {
  if (!passesGating(def, ctx)) return "LOCKED";

  if (def.id === "UNLOCK_KINGAMAS") {
    // requires building (world system later). For now, context flag.
    if (!ctx.hasRoyalTreasuryBuilding) return "AVAILABLE";
    return "COMPLETED";
  }

  // Repeatables
  if (isOnCooldown(def, state, ctx)) return "COOLDOWN";
  return "AVAILABLE";
}

/**
 * Complete a quest and apply rewards.
 * Caller is responsible for verifying it's AVAILABLE.
 */
export function completeQuest(params: {
  questId: QuestId;
  def?: QuestDefinition;
  state: QuestProgressState;
  ctx: QuestContext;
  wallet: KingamasWallet;
}): { state: QuestProgressState; wallet: KingamasWallet } {
  const def = params.def ?? getQuestDefinition(params.questId);

  const status = evaluateQuestStatus(def, params.state, params.ctx);
  if (status !== "AVAILABLE") {
    // No-op if not available
    return { state: params.state, wallet: params.wallet };
  }

  const reward = def.kingamasReward ?? 0;
  const wallet = reward > 0 ? grantKingamas(params.wallet, reward) : params.wallet;

  if (def.type === "ONE_TIME") {
    return {
      state: { ...params.state, status: "COMPLETED", lastCompletedAt: params.ctx.now },
      wallet,
    };
  }

  return {
    state: { ...params.state, status: "COOLDOWN", lastCompletedAt: params.ctx.now },
    wallet,
  };
}

/**
 * Helper to initialize quest progress list.
 */
export function initQuestStates(): QuestProgressState[] {
  return QUESTS.map((q) => ({
    id: q.id,
    status: "LOCKED",
  }));
}
