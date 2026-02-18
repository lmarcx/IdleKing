import type { ItemSlot } from "../loot/budget.js";
import type { Biome } from "../loot/itemGenerator.js";
import type { ExpeditionLoot, ExpeditionResult, ResourceReward } from "../loot/lootTables.js";
import type { CombatStats, Element } from "../power/types.js";

export type ExpeditionId = string;
export type ExpeditionLevel = 1|2|3|4|5|6|7|8|9|10;

export type ExpeditionConfig = {
  biome: Biome;
  worldLevel: number; // gate + later scaling
  expeditionLevel: ExpeditionLevel;
  seed: number; // deterministic rooms/choices/encounters/loot
};

export type ExpeditionLoadout = Partial<Record<ItemSlot, string>>; // slot -> itemId

export type ExpeditionRunState = {
  id: ExpeditionId;
  config: ExpeditionConfig;

  loadout: ExpeditionLoadout;
  riskedItemIds: string[];

  rooms: ExpeditionRoom[];

  startedAt: number;
  finishedAt?: number;
  result?: ExpeditionResult;

  loot?: ExpeditionLoot;
};

// ---------------- Rooms ----------------

export type RoomType = "ENCOUNTER" | "CHOICE" | "BOSS";

export type EnemyKind = "DEMON" | "ALIEN" | "HUMANOID" | "DIVINE";

export type EnemyArchetypeId =
  | "DEMON_1" | "DEMON_2" | "DEMON_3" | "DEMON_4"
  | "ALIEN_1" | "ALIEN_2" | "ALIEN_3" | "ALIEN_4"
  | "HUMANOID_1" | "HUMANOID_2" | "HUMANOID_3" | "HUMANOID_4"
  | "DIVINE_1" | "DIVINE_2" | "DIVINE_3" | "DIVINE_4";

export type EnemyInstance = {
  id: string;
  archetype: EnemyArchetypeId;
  tier: 1|2|3|4;
  kind: EnemyKind;

  statsCoeff: number; // difficulty knob
};

// Choice effects are TEMPORARY for the run (rooms 2/4/6).
// We keep this "partial-friendly": no need to specify all elements.
export type TempStatDelta = {
  hp?: number;
  attack?: number;
  armor?: number;

  critChance?: number;
  critDmg?: number;

  speedRating?: number;
  pierceRating?: number;

  resists?: Partial<Record<Element, number>>;
  elemental?: Partial<Record<Element, number>>;
};


export type ChoiceOption =
  | { kind: "BUFF"; id: string; label: string; desc: string; bonus: TempStatDelta }
  | { kind: "RESOURCE"; id: string; label: string; desc: string; resource: ResourceReward }
  | { kind: "MALUS"; id: string; label: string; desc: string; malus: TempStatDelta };

export type ExpeditionRoom =
  | { index: 1|2|3|4|5|6|7; type: "ENCOUNTER"; seed: number; enemies: EnemyInstance[] }
  | { index: 1|2|3|4|5|6|7; type: "CHOICE"; seed: number; options: [ChoiceOption, ChoiceOption, ChoiceOption] }
  | { index: 1|2|3|4|5|6|7; type: "BOSS"; seed: number; bossId: string };
