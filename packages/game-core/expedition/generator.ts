import type { Biome } from "../loot/itemGenerator.js";
import type { ExpeditionConfig, ExpeditionRoom, ExpeditionLevel, EnemyInstance, EnemyArchetypeId, EnemyKind, ChoiceOption } from "./types.js";
import { mulberry32, hashSeed } from "./rng.js";
import {
  ROOM_SEQUENCE,
  EXPEDITION_BOSS_BY_LEVEL,
  ENEMY_POOL_BY_BIOME,
  CHOICE_POOL,
  expeditionDifficultyCoeff,
  EXPEDITIONS_UNLOCK_WORLD_LEVEL,
} from "./tables.js";

function makeRunId(cfg: ExpeditionConfig) {
  return `exp_${cfg.expeditionLevel}_${cfg.worldLevel}_${cfg.seed}_${cfg.biome}`;
}

function archetypeToKind(a: EnemyArchetypeId): EnemyKind {
  if (a.startsWith("DEMON")) return "DEMON";
  if (a.startsWith("ALIEN")) return "ALIEN";
  if (a.startsWith("HUMANOID")) return "HUMANOID";
  return "DIVINE";
}

function pick3Distinct<T>(rng: ReturnType<typeof mulberry32>, pool: readonly T[]): [T, T, T] {
  if (pool.length < 3) throw new Error("Pool must contain at least 3 entries");
  const a = rng.pick(pool);
  let b = rng.pick(pool);
  while (b === a) b = rng.pick(pool);
  let c = rng.pick(pool);
  while (c === a || c === b) c = rng.pick(pool);
  return [a, b, c];
}

export type GeneratedExpedition = {
  id: string;
  rooms: ExpeditionRoom[];
  requiresWorldLevel: number; // gate (50)
  difficultyCoeff: number;
};

export function generateExpedition(cfg: ExpeditionConfig): GeneratedExpedition {
  const requiresWorldLevel = EXPEDITIONS_UNLOCK_WORLD_LEVEL;
  const difficultyCoeff = expeditionDifficultyCoeff(cfg.expeditionLevel);

  const rooms: ExpeditionRoom[] = [];
  const rootRng = mulberry32(cfg.seed);

  for (let i = 0; i < ROOM_SEQUENCE.length; i++) {
    const index = (i + 1) as 1|2|3|4|5|6|7;
    const type = ROOM_SEQUENCE[i];
    const seed = hashSeed(cfg.seed, 1000 + index * 97);

    if (type === "ENCOUNTER") {
      rooms.push({
        index,
        type,
        seed,
        enemies: generateEncounter({
          biome: cfg.biome,
          expeditionLevel: cfg.expeditionLevel,
          seed,
          difficultyCoeff,
        }),
      });
    } else if (type === "CHOICE") {
      rooms.push({
        index,
        type,
        seed,
        options: generateChoice(seed, cfg.expeditionLevel),
      });
    } else {
      rooms.push({
        index,
        type,
        seed,
        bossId: EXPEDITION_BOSS_BY_LEVEL[cfg.expeditionLevel],
      });
    }

    // consume a bit of rng so id isn't trivial
    rootRng.next();
  }

  return {
    id: makeRunId(cfg),
    rooms,
    requiresWorldLevel,
    difficultyCoeff,
  };
}

export function generateEncounter(params: {
  biome: Biome;
  expeditionLevel: ExpeditionLevel;
  seed: number;
  difficultyCoeff: number;
}): EnemyInstance[] {
  const rng = mulberry32(params.seed);

  const pool = ENEMY_POOL_BY_BIOME[params.biome] ?? ENEMY_POOL_BY_BIOME["VOLCANIC"];
  const packSize = rng.int(2, 4); // MVP: 2-4 enemies per pack

  const out: EnemyInstance[] = [];

  for (let i = 0; i < packSize; i++) {
    const archetype = rng.pick(pool);
    const kind = archetypeToKind(archetype);

    // Tier scaling: expeditionLevel increases chance of higher tiers
    const baseTier = Math.min(4, 1 + Math.floor((params.expeditionLevel - 1) / 3)) as 1|2|3|4;
    const roll = rng.next();
    const tier =
      roll < 0.55 ? baseTier :
      roll < 0.85 ? (Math.min(4, baseTier + 1) as 1|2|3|4) :
      (Math.min(4, baseTier + 2) as 1|2|3|4);

    // statsCoeff increases difficulty; used later when we turn enemies into CombatStats
    const tierCoeff = 1 + (tier - 1) * 0.35;
    const statsCoeff = params.difficultyCoeff * tierCoeff;

    out.push({
      id: `e_${params.seed}_${i}`,
      archetype,
      kind,
      tier,
      statsCoeff,
    });
  }

  return out;
}

export function generateChoice(seed: number, expeditionLevel: ExpeditionLevel): [ChoiceOption, ChoiceOption, ChoiceOption] {
  const rng = mulberry32(seed);

  // later we can weight by expeditionLevel; for now just pick 3 distinct
  const [a, b, c] = pick3Distinct(rng, CHOICE_POOL);

  // Optional small scaling: resource amounts grow slightly with expeditionLevel
  const scale = 1 + (expeditionLevel - 1) * 0.08;

  function scaleOption(o: ChoiceOption): ChoiceOption {
    if (o.kind !== "RESOURCE") return o;
    return {
      ...o,
      resource: { ...o.resource, amount: Math.round(o.resource.amount * scale) },
    };
  }

  return [scaleOption(a), scaleOption(b), scaleOption(c)];
}
