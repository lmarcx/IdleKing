import type { QuestDef } from "./types.js";

export const QUESTS: readonly QuestDef[] = [
  {
    id: "Q_REPEAT_CONVERT_1",
    type: "REPEATABLE",
    name: "Alchimie Royale",
    desc: "Convertir des ressources pour gagner des Kingamas.",
    objective: { kind: "CONVERT_RESOURCES", amount: 1000 },
    rewards: { kingamas: 25 },
  },
  {
    id: "Q_REPEAT_EXPEDITION_1",
    type: "REPEATABLE",
    name: "Chroniques d’Expédition",
    desc: "Réussir une expédition (niveau 1+).",
    objective: { kind: "CLEAR_EXPEDITION", level: 1, times: 1 },
    rewards: { kingamas: 20 },
  },
] as const;
