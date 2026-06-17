import { getStoryDungeonDefinition } from "./progressionMvp.js";

/**
 * Data-driven narrative beats played inside a story level. The web explorer
 * turns each beat into a point of interest / dialogue / encounter. Text is
 * canon, condensed from docs/30_new_direction/01_lore/SCRIPTS.md.
 *
 * Beats are pure content — they never grant rewards (that stays in
 * `completeDungeon`); `itemId`/`companionId` are narrative labels.
 */
export type LevelBeatKind =
  | "dialogue"
  | "spawn_wave"
  | "boss"
  | "acquire_item"
  | "companion_join";

export type LevelBeat = Readonly<{
  id: string;
  kind: LevelBeatKind;
  /** Narrative line shown to the player when the beat is reached. */
  text: string;
  speaker?: string;
  /** Boss to fight for `kind: "boss"` (must be an MVP boss id). */
  bossId?: string;
  /** Narrative item label for `kind: "acquire_item"`. */
  itemId?: string;
  /** Companion label for `kind: "companion_join"`. */
  companionId?: string;
}>;

export type LevelScript = Readonly<{
  dungeonId: string;
  beats: readonly LevelBeat[];
}>;

export const PROLOGUE_WASTELANDS_SCRIPT: LevelScript = {
  dungeonId: "prologue_wastelands",
  beats: [
    {
      id: "ruins",
      kind: "dialogue",
      text:
        "Les Terres Désolées s'étendent à perte de vue. Des colonnes brisées s'élèvent comme " +
        "les doigts d'un mort oublié. Le vieux roi avance entre les ruines d'un royaume qu'il " +
        "ne reconnaît pas.",
    },
    {
      id: "find_dog",
      kind: "dialogue",
      speaker: "Le vieux roi",
      text:
        "Au milieu du désert gît un chien, maigre et assoiffé, tremblant dans la poussière. " +
        "Ses yeux implorent sans comprendre.",
    },
    {
      id: "feed",
      kind: "acquire_item",
      itemId: "kings_blood",
      speaker: "Le vieux roi",
      text:
        "Sans eau ni nourriture, le roi tranche sa propre main et laisse son sang couler entre " +
        "les babines de la bête. Le chien boit — d'abord faiblement, puis avec avidité.",
    },
    {
      id: "shadows",
      kind: "spawn_wave",
      text:
        "Le corps de la bête enfle et masque le soleil. Lorsque la lumière disparaît, les Ombres " +
        "jaillissent. Le premier combat commence — le corps du roi se souvient de la guerre.",
    },
    {
      id: "amalgam",
      kind: "boss",
      bossId: "dark_amalgam",
      text:
        "Ce qu'il reste des Ombres se rassemble en une masse difforme et rugissante. " +
        "L'Amalgame des Ténèbres se dresse devant lui.",
    },
    {
      id: "drop_of_darkness",
      kind: "acquire_item",
      itemId: "drop_of_darkness",
      text:
        "Lorsque l'Amalgame s'effondre, il ne reste qu'une seule goutte, sombre et presque " +
        "vivante. Le roi la recueille dans une fiole : la Goutte de Ténèbres.",
    },
    {
      id: "billy_joins",
      kind: "companion_join",
      companionId: "billy",
      speaker: "Billy",
      text:
        "Le chien, vidé du vice qui l'avait consumé, retrouve sa forme. Ses blessures se " +
        "referment. Il remue la queue et se tient auprès du roi. Il ne le quitte plus : Billy.",
    },
    {
      id: "kingdom_found",
      kind: "dialogue",
      text:
        "Le vieux roi reprend sa route, accompagné de Billy. Au loin, parmi les ruines, une " +
        "ancienne place royale semble attendre qu'on lui rende un nom. Le Royaume est découvert.",
    },
  ],
} as const;

export const LEVEL_SCRIPT_REGISTRY: Readonly<Record<string, LevelScript>> = {
  [PROLOGUE_WASTELANDS_SCRIPT.dungeonId]: PROLOGUE_WASTELANDS_SCRIPT,
} as const;

export function getLevelScript(dungeonId: string): LevelScript | undefined {
  return LEVEL_SCRIPT_REGISTRY[dungeonId];
}

/** Convenience: the boss fought in a level script, if any. */
export function getLevelScriptBossId(dungeonId: string): string | undefined {
  return getLevelScript(dungeonId)?.beats.find((beat) => beat.kind === "boss")?.bossId;
}

const ALLOWED_BOSS_IDS = new Set([
  "dark_amalgam",
  "dragon_shadow",
  "frost_amalgam",
  "fallen_rain_lord",
  "corrupted_archmage",
  "allaeva",
]);

/** Boot-time validation: level scripts must reference real dungeons + MVP bosses. */
export function validateLevelScriptRegistry(
  registry: Readonly<Record<string, LevelScript>> = LEVEL_SCRIPT_REGISTRY,
): void {
  for (const [dungeonId, script] of Object.entries(registry)) {
    if (script.dungeonId !== dungeonId) {
      throw new Error(`Level script key/dungeonId mismatch: ${dungeonId} vs ${script.dungeonId}`);
    }
    if (!getStoryDungeonDefinition(dungeonId)) {
      throw new Error(`Level script references unknown dungeon: ${dungeonId}`);
    }
    if (script.beats.length === 0) {
      throw new Error(`Level script has no beats: ${dungeonId}`);
    }
    const ids = new Set<string>();
    for (const beat of script.beats) {
      if (ids.has(beat.id)) throw new Error(`Duplicate beat id in ${dungeonId}: ${beat.id}`);
      ids.add(beat.id);
      if (beat.kind === "boss" && (!beat.bossId || !ALLOWED_BOSS_IDS.has(beat.bossId))) {
        throw new Error(`Level script ${dungeonId} boss beat has invalid bossId: ${beat.bossId}`);
      }
    }
  }
}

validateLevelScriptRegistry();
