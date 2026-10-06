import { getBossArchetype, getEnemyArchetypeOrThrow, type EnemyArchetype } from "./registry.js";

/**
 * Per-dungeon enemy rosters (ENEMIES_DATABASE_V2 locations + DUNGEON_DATABASE enemy families).
 *
 * A roster is ordered: `groups` are the regular fights in the order the level should present
 * them (first group near the entrance), `boss` is the encounter that ends the level. Maps place
 * these encounters spatially; the legacy explorer spreads them over its spawn points.
 *
 * Deviations from DUNGEON_DATABASE (which lists "Enemy Families: None" for narrative dungeons):
 * - Mausolée gets Squelettes Funéraires + Âmes Perdues (lore-consistent, and every replayable
 *   dungeon needs combat, otherwise replays would grant rewards for free).
 * - Source du Givre stays boss-only (Allaeva's frozen prison).
 */
export type EncounterGroup = Readonly<{
  archetypeId: string;
  count: number;
}>;

export type DungeonEncounter = Readonly<{
  dungeonId: string;
  groups: readonly EncounterGroup[];
  bossArchetypeId?: string;
  /** Equipment item level rolled by this dungeon's boss (DEFERRED balancing). */
  itemLevel: number;
}>;

export const DUNGEON_ENCOUNTERS: readonly DungeonEncounter[] = [
  {
    dungeonId: "prologue_wastelands",
    groups: [
      { archetypeId: "ombre_errante", count: 3 },
      { archetypeId: "ombre_archer", count: 1 },
      { archetypeId: "ombre_brisee", count: 1 },
    ],
    bossArchetypeId: "boss_dark_amalgam",
    itemLevel: 1,
  },
  {
    dungeonId: "funeral_mausoleum",
    groups: [
      { archetypeId: "ame_egaree", count: 2 },
      { archetypeId: "squelette_guerrier", count: 2 },
      { archetypeId: "squelette_archer", count: 1 },
      { archetypeId: "ame_tourmentee", count: 1 },
    ],
    itemLevel: 3,
  },
  {
    dungeonId: "frozen_river",
    groups: [
      { archetypeId: "spectre_vagabond", count: 3 },
      { archetypeId: "spectre_hurleur", count: 1 },
      { archetypeId: "spectre_veilleur", count: 1 },
    ],
    itemLevel: 4,
  },
  {
    dungeonId: "time_vestige",
    groups: [
      { archetypeId: "spectre_vagabond", count: 2 },
      { archetypeId: "ame_tourmentee", count: 2 },
      { archetypeId: "spectre_hurleur", count: 1 },
      { archetypeId: "spectre_du_fleuve_noir", count: 1 },
    ],
    itemLevel: 5,
  },
  {
    dungeonId: "ashen_peak",
    groups: [
      { archetypeId: "squelette_guerrier", count: 2 },
      { archetypeId: "dragonoide_dechu", count: 2 },
      { archetypeId: "squelette_archer", count: 1 },
      { archetypeId: "dragonoide_fanatique", count: 2 },
      { archetypeId: "gardien_des_cendres", count: 1 },
    ],
    bossArchetypeId: "boss_dragon_shadow",
    itemLevel: 6,
  },
  {
    dungeonId: "silent_retreat_camp",
    groups: [
      { archetypeId: "spectre_gele", count: 3 },
      { archetypeId: "spectre_blizzard", count: 1 },
      { archetypeId: "spectre_cristallise", count: 1 },
    ],
    itemLevel: 8,
  },
  {
    dungeonId: "white_fall_tower",
    groups: [
      { archetypeId: "spectre_gele", count: 2 },
      { archetypeId: "apprenti_gele", count: 2 },
      { archetypeId: "archiviste_gele", count: 1 },
      { archetypeId: "professeur_d_arathas", count: 1 },
    ],
    itemLevel: 9,
  },
  {
    dungeonId: "reflection_cavern",
    groups: [
      { archetypeId: "spectre_gele", count: 2 },
      { archetypeId: "sirene_des_reflets", count: 2 },
      { archetypeId: "spectre_blizzard", count: 1 },
      { archetypeId: "spectre_du_blizzard_blanc", count: 1 },
    ],
    bossArchetypeId: "boss_frost_amalgam",
    itemLevel: 10,
  },
  {
    dungeonId: "arathas_academy",
    groups: [
      { archetypeId: "apprenti_gele", count: 2 },
      { archetypeId: "sujet_a01", count: 2 },
      { archetypeId: "archiviste_gele", count: 1 },
      { archetypeId: "sujet_a07", count: 1 },
      { archetypeId: "prototype_alpha", count: 1 },
    ],
    bossArchetypeId: "boss_corrupted_archmage",
    itemLevel: 12,
  },
  {
    dungeonId: "royal_abyss",
    groups: [
      { archetypeId: "poisson_abyssal_gele", count: 2 },
      { archetypeId: "sirene_errante", count: 2 },
      { archetypeId: "crabe_de_givre", count: 1 },
      { archetypeId: "sirene_des_chants", count: 1 },
      { archetypeId: "leviathan_juvenile_gele", count: 1 },
    ],
    bossArchetypeId: "boss_fallen_rain_lord",
    itemLevel: 13,
  },
  {
    dungeonId: "frost_source",
    groups: [],
    bossArchetypeId: "boss_allaeva",
    itemLevel: 15,
  },
];

const ENCOUNTER_BY_DUNGEON = new Map(DUNGEON_ENCOUNTERS.map((encounter) => [encounter.dungeonId, encounter]));

export function getDungeonEncounter(dungeonId: string): DungeonEncounter | undefined {
  return ENCOUNTER_BY_DUNGEON.get(dungeonId);
}

/** Flattened, ordered list of the archetypes spawned by a dungeon (boss last). */
export function getDungeonEncounterArchetypes(dungeonId: string): EnemyArchetype[] {
  const encounter = getDungeonEncounter(dungeonId);
  if (!encounter) return [];
  const regulars = encounter.groups.flatMap((group) =>
    Array.from({ length: group.count }, () => getEnemyArchetypeOrThrow(group.archetypeId)),
  );
  return encounter.bossArchetypeId ? [...regulars, getEnemyArchetypeOrThrow(encounter.bossArchetypeId)] : regulars;
}

export function validateDungeonEncounters(
  dungeons: readonly { id: string; bossId: string | null }[],
  encounters: readonly DungeonEncounter[] = DUNGEON_ENCOUNTERS,
): void {
  const seen = new Set<string>();
  for (const encounter of encounters) {
    if (seen.has(encounter.dungeonId)) throw new Error(`Duplicate dungeon encounter: ${encounter.dungeonId}`);
    seen.add(encounter.dungeonId);
    for (const group of encounter.groups) {
      const archetype = getEnemyArchetypeOrThrow(group.archetypeId);
      if (archetype.tier === "boss") throw new Error(`Boss ${group.archetypeId} must be the encounter boss, not a group`);
      if (!Number.isInteger(group.count) || group.count <= 0) {
        throw new Error(`Invalid enemy count for ${encounter.dungeonId}/${group.archetypeId}`);
      }
    }
    if (encounter.groups.length === 0 && !encounter.bossArchetypeId) {
      throw new Error(`Dungeon ${encounter.dungeonId} has no enemies`);
    }
  }
  for (const dungeon of dungeons) {
    const encounter = encounters.find((candidate) => candidate.dungeonId === dungeon.id);
    if (!encounter) throw new Error(`Dungeon ${dungeon.id} has no encounter roster`);
    const expectedBoss = dungeon.bossId ? getBossArchetype(dungeon.bossId)?.id : undefined;
    if (encounter.bossArchetypeId !== expectedBoss) {
      throw new Error(`Dungeon ${dungeon.id} boss roster (${encounter.bossArchetypeId}) does not match story boss (${dungeon.bossId})`);
    }
  }
}
