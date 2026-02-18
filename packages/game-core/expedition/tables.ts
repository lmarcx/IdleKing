import type { Biome } from "../loot/itemGenerator.js";
import type { ChoiceOption, EnemyArchetypeId, ExpeditionLevel, RoomType } from "./types.js";

// End-game gate
export const EXPEDITIONS_UNLOCK_WORLD_LEVEL = 50 as const;

export const EXPEDITION_LEVELS: readonly ExpeditionLevel[] = [1,2,3,4,5,6,7,8,9,10] as const;

export const ROOM_SEQUENCE: readonly RoomType[] = [
  "ENCOUNTER",
  "CHOICE",
  "ENCOUNTER",
  "CHOICE",
  "ENCOUNTER",
  "CHOICE",
  "BOSS",
] as const;

export const EXPEDITION_BOSS_BY_LEVEL: Record<ExpeditionLevel, string> = {
  1: "BOSS_1",
  2: "BOSS_2",
  3: "BOSS_3",
  4: "BOSS_4",
  5: "BOSS_5",
  6: "BOSS_6",
  7: "BOSS_7",
  8: "BOSS_8",
  9: "BOSS_9",
  10: "BOSS_FINAL",
};

export function expeditionDifficultyCoeff(level: ExpeditionLevel) {
  return 1 + (level - 1) * 0.12;
}

export const ENEMY_POOL_BY_BIOME: Record<Biome, readonly EnemyArchetypeId[]> = {
  VOLCANIC: ["DEMON_1", "DEMON_2", "HUMANOID_1"],
  TUNDRA: ["HUMANOID_1", "HUMANOID_2", "DIVINE_1"],
  COSMIC_WRECK: ["ALIEN_1", "ALIEN_2", "ALIEN_3"],
  STORM_CITADEL: ["DIVINE_1", "DIVINE_2", "HUMANOID_3"],
} as const;

export const CHOICE_POOL: readonly ChoiceOption[] = [
  { kind: "BUFF", id: "FORTIFY", label: "Fortifier", desc: "+Armor temporaire", bonus: { armor: 12 } },
  { kind: "BUFF", id: "BLOODLUST", label: "Soif de sang", desc: "+Attack temporaire", bonus: { attack: 10 } },
  { kind: "BUFF", id: "VOID_FOCUS", label: "Focus du Vide", desc: "+Elemental VOID temporaire", bonus: { elemental: { VOID: 18 } } },

  { kind: "RESOURCE", id: "WOOD_CACHE", label: "Stock de Bois", desc: "Gagne du bois (monde)", resource: { id: "WOOD", amount: 250 } },
  { kind: "RESOURCE", id: "STONE_CACHE", label: "Stock de Pierre", desc: "Gagne de la pierre (monde)", resource: { id: "STONE", amount: 250 } },
  { kind: "RESOURCE", id: "GOLD_DUST", label: "Poussière d'Or", desc: "Gagne de l'or (monde)", resource: { id: "GOLD", amount: 120 } },

  { kind: "MALUS", id: "FRAIL", label: "Fragilisé", desc: "-HP temporaire", malus: { hp: -120 } },
  { kind: "MALUS", id: "SAPPED", label: "Épuisé", desc: "-Attack temporaire", malus: { attack: -8 } },
] as const;
