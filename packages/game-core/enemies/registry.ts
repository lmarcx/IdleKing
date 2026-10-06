import type { CanonicalResourceId } from "../resources/types.js";

/**
 * Enemy archetypes — single source of truth for Story enemies (ENEMIES_DATABASE_V2).
 *
 * Families, variants, elites, roles and drops come from the database. Numbers (HP, damage, speed,
 * drop chances) are DEFERRED balancing placeholders derived from role × tier × chapter, so a
 * whole chapter can be retuned from the three tables below instead of per placement.
 *
 * Maps and dungeon rosters reference archetypes by id; they never carry their own stats.
 */

export type EnemyChapter = "prologue" | "chapter_i" | "chapter_ii";
export type EnemyTier = "standard" | "elite" | "boss";
export type EnemyRole =
  | "melee"
  | "aggressive"
  | "ranged"
  | "caster"
  | "tank"
  | "support"
  | "assassin"
  | "control"
  | "illusionist";

/** How an archetype attacks. Ranged kinds keep their distance and fire telegraphed projectiles. */
export type EnemyAttackKind = "melee" | "ranged";

/** Geometric silhouette used by the B&W renderer (drawn in code, no textures). */
export type EnemySilhouette =
  | "shade"
  | "wisp"
  | "soul"
  | "skeleton"
  | "drake"
  | "frost_wisp"
  | "mage"
  | "siren"
  | "fish"
  | "crab"
  | "aberration"
  | "amalgam"
  | "dragon"
  | "archmage"
  | "rain_lord"
  | "queen";

export type EnemyFamilyId =
  | "ombres_de_guerre"
  | "spectres_des_tenebres"
  | "ames_perdues"
  | "squelettes_funeraires"
  | "dragonoides_corrompus"
  | "spectres_du_froid"
  | "mages_geles"
  | "sirenes"
  | "creatures_marines_gelees"
  | "aberrations_d_arathas"
  | "amalgames"
  | "boss";

export type EnemyFamily = Readonly<{
  id: EnemyFamilyId;
  name: string;
  chapter: EnemyChapter;
  silhouette: EnemySilhouette;
}>;

export type EnemyStats = Readonly<{
  hp: number;
  contactDamage: number;
  moveSpeed: number;
  radius: number;
  aggroRadius: number;
  attackCooldownMs: number;
}>;

export type EnemyArchetype = Readonly<{
  id: string;
  name: string;
  familyId: EnemyFamilyId;
  tier: EnemyTier;
  role: EnemyRole;
  attack: EnemyAttackKind;
  silhouette: EnemySilhouette;
  stats: EnemyStats;
  lootTableId: string;
  /** Story boss id (STORY_BOSS_REGISTRY) for tier "boss". */
  bossId?: string;
}>;

export type EnemyDropDefinition = Readonly<{
  resourceId: CanonicalResourceId;
  chance: number;
  minAmount: number;
  maxAmount: number;
}>;

export type EnemyArchetypeLootTable = Readonly<{
  id: string;
  drops: readonly EnemyDropDefinition[];
}>;

// ---------------------------------------------------------------------------------------------
// DEFERRED balancing tables
// ---------------------------------------------------------------------------------------------

const ROLE_PROFILE: Readonly<Record<EnemyRole, { hp: number; damage: number; speed: number; attack: EnemyAttackKind }>> = {
  melee: { hp: 1, damage: 1, speed: 1, attack: "melee" },
  aggressive: { hp: 0.9, damage: 1.25, speed: 1.25, attack: "melee" },
  ranged: { hp: 0.7, damage: 0.9, speed: 0.85, attack: "ranged" },
  caster: { hp: 0.75, damage: 1.1, speed: 0.8, attack: "ranged" },
  tank: { hp: 1.9, damage: 1.2, speed: 0.65, attack: "melee" },
  support: { hp: 0.9, damage: 0.7, speed: 0.9, attack: "ranged" },
  assassin: { hp: 0.7, damage: 1.4, speed: 1.45, attack: "melee" },
  control: { hp: 0.85, damage: 0.9, speed: 0.8, attack: "ranged" },
  illusionist: { hp: 0.8, damage: 1, speed: 0.95, attack: "ranged" },
};

const CHAPTER_SCALE: Readonly<Record<EnemyChapter, { hp: number; damage: number }>> = {
  prologue: { hp: 60, damage: 8 },
  chapter_i: { hp: 110, damage: 12 },
  chapter_ii: { hp: 190, damage: 18 },
};

const TIER_SCALE: Readonly<Record<Exclude<EnemyTier, "boss">, { hp: number; damage: number; radius: number }>> = {
  standard: { hp: 1, damage: 1, radius: 22 },
  elite: { hp: 3.2, damage: 1.5, radius: 30 },
};

const BASE_MOVE_SPEED = 90;
const BASE_AGGRO_RADIUS = 280;

function standardStats(chapter: EnemyChapter, tier: Exclude<EnemyTier, "boss">, role: EnemyRole): EnemyStats {
  const roleProfile = ROLE_PROFILE[role];
  const chapterScale = CHAPTER_SCALE[chapter];
  const tierScale = TIER_SCALE[tier];
  return {
    hp: Math.round(chapterScale.hp * roleProfile.hp * tierScale.hp),
    contactDamage: Math.round(chapterScale.damage * roleProfile.damage * tierScale.damage),
    moveSpeed: Math.round(BASE_MOVE_SPEED * roleProfile.speed),
    radius: role === "tank" ? tierScale.radius + 6 : tierScale.radius,
    aggroRadius: roleProfile.attack === "ranged" ? BASE_AGGRO_RADIUS + 80 : BASE_AGGRO_RADIUS,
    attackCooldownMs: roleProfile.attack === "ranged" ? 1600 : 700,
  };
}

// ---------------------------------------------------------------------------------------------
// Families
// ---------------------------------------------------------------------------------------------

export const ENEMY_FAMILIES: readonly EnemyFamily[] = [
  { id: "ombres_de_guerre", name: "Ombres de Guerre", chapter: "prologue", silhouette: "shade" },
  { id: "spectres_des_tenebres", name: "Spectres des Ténèbres", chapter: "chapter_i", silhouette: "wisp" },
  { id: "ames_perdues", name: "Âmes Perdues", chapter: "chapter_i", silhouette: "soul" },
  { id: "squelettes_funeraires", name: "Squelettes Funéraires", chapter: "chapter_i", silhouette: "skeleton" },
  { id: "dragonoides_corrompus", name: "Dragonoïdes Corrompus", chapter: "chapter_i", silhouette: "drake" },
  { id: "spectres_du_froid", name: "Spectres du Froid", chapter: "chapter_ii", silhouette: "frost_wisp" },
  { id: "mages_geles", name: "Mages Gelés", chapter: "chapter_ii", silhouette: "mage" },
  { id: "sirenes", name: "Sirènes", chapter: "chapter_ii", silhouette: "siren" },
  { id: "creatures_marines_gelees", name: "Créatures Marines Gelées", chapter: "chapter_ii", silhouette: "fish" },
  { id: "aberrations_d_arathas", name: "Aberrations d'Arathas", chapter: "chapter_ii", silhouette: "aberration" },
  { id: "amalgames", name: "Amalgames", chapter: "prologue", silhouette: "amalgam" },
  { id: "boss", name: "Boss", chapter: "chapter_i", silhouette: "dragon" },
] as const;

// ---------------------------------------------------------------------------------------------
// Archetypes (variants + elites from ENEMIES_DATABASE_V2)
// ---------------------------------------------------------------------------------------------

type DropShorthand = readonly [CanonicalResourceId, "primary" | "secondary" | "rare"];

const DROP_PROFILE: Readonly<Record<Exclude<EnemyTier, "boss">, Record<DropShorthand[1], Omit<EnemyDropDefinition, "resourceId">>>> = {
  standard: {
    primary: { chance: 0.6, minAmount: 1, maxAmount: 2 },
    secondary: { chance: 0.25, minAmount: 1, maxAmount: 1 },
    rare: { chance: 0.08, minAmount: 1, maxAmount: 1 },
  },
  elite: {
    primary: { chance: 1, minAmount: 2, maxAmount: 3 },
    secondary: { chance: 0.5, minAmount: 1, maxAmount: 2 },
    rare: { chance: 0.25, minAmount: 1, maxAmount: 1 },
  },
};

type ArchetypeSeed = Readonly<{
  id: string;
  name: string;
  familyId: EnemyFamilyId;
  tier: Exclude<EnemyTier, "boss">;
  role: EnemyRole;
  drops: readonly DropShorthand[];
}>;

const STANDARD_SEEDS: readonly ArchetypeSeed[] = [
  // Prologue — Ombres de Guerre
  { id: "ombre_errante", name: "Ombre Errante", familyId: "ombres_de_guerre", tier: "standard", role: "melee", drops: [["shadow_residue", "secondary"], ["iron_ore", "primary"]] },
  { id: "ombre_archer", name: "Ombre Archer", familyId: "ombres_de_guerre", tier: "standard", role: "ranged", drops: [["shadow_residue", "secondary"], ["iron_ore", "primary"]] },
  { id: "ombre_brisee", name: "Ombre Brisée", familyId: "ombres_de_guerre", tier: "standard", role: "tank", drops: [["shadow_residue", "primary"], ["iron_ore", "secondary"]] },
  // Chapter I — Spectres des Ténèbres
  { id: "spectre_vagabond", name: "Spectre Vagabond", familyId: "spectres_des_tenebres", tier: "standard", role: "melee", drops: [["spectral_dust", "primary"], ["shadow_residue", "secondary"]] },
  { id: "spectre_hurleur", name: "Spectre Hurleur", familyId: "spectres_des_tenebres", tier: "standard", role: "caster", drops: [["spectral_dust", "primary"]] },
  { id: "spectre_veilleur", name: "Spectre Veilleur", familyId: "spectres_des_tenebres", tier: "standard", role: "tank", drops: [["spectral_dust", "primary"]] },
  { id: "spectre_du_fleuve_noir", name: "Spectre du Fleuve Noir", familyId: "spectres_des_tenebres", tier: "elite", role: "caster", drops: [["spectral_dust", "primary"], ["shadow_residue", "rare"]] },
  // Chapter I — Âmes Perdues
  { id: "ame_egaree", name: "Âme Égarée", familyId: "ames_perdues", tier: "standard", role: "support", drops: [["spectral_dust", "primary"]] },
  { id: "ame_tourmentee", name: "Âme Tourmentée", familyId: "ames_perdues", tier: "standard", role: "caster", drops: [["shadow_residue", "primary"]] },
  // Chapter I — Squelettes Funéraires
  { id: "squelette_guerrier", name: "Squelette Guerrier", familyId: "squelettes_funeraires", tier: "standard", role: "melee", drops: [["bone_fragment", "primary"], ["iron_ore", "secondary"]] },
  { id: "squelette_archer", name: "Squelette Archer", familyId: "squelettes_funeraires", tier: "standard", role: "ranged", drops: [["bone_fragment", "primary"]] },
  { id: "champion_funeraire", name: "Champion Funéraire", familyId: "squelettes_funeraires", tier: "elite", role: "tank", drops: [["bone_fragment", "primary"], ["silver_ore", "secondary"]] },
  // Chapter I — Dragonoïdes Corrompus
  { id: "dragonoide_dechu", name: "Dragonoïde Déchu", familyId: "dragonoides_corrompus", tier: "standard", role: "melee", drops: [["ashwood", "primary"], ["dragon_scale_fragment", "secondary"]] },
  { id: "dragonoide_fanatique", name: "Dragonoïde Fanatique", familyId: "dragonoides_corrompus", tier: "standard", role: "aggressive", drops: [["ashwood", "primary"]] },
  { id: "gardien_des_cendres", name: "Gardien des Cendres", familyId: "dragonoides_corrompus", tier: "elite", role: "tank", drops: [["dragon_scale_fragment", "primary"], ["ashwood", "rare"]] },
  // Chapter II — Spectres du Froid
  { id: "spectre_gele", name: "Spectre Gelé", familyId: "spectres_du_froid", tier: "standard", role: "melee", drops: [["frozen_echo", "primary"]] },
  { id: "spectre_cristallise", name: "Spectre Cristallisé", familyId: "spectres_du_froid", tier: "standard", role: "tank", drops: [["frozen_echo", "primary"]] },
  { id: "spectre_blizzard", name: "Spectre Blizzard", familyId: "spectres_du_froid", tier: "standard", role: "caster", drops: [["frozen_echo", "primary"]] },
  { id: "spectre_du_blizzard_blanc", name: "Spectre du Blizzard Blanc", familyId: "spectres_du_froid", tier: "elite", role: "caster", drops: [["frozen_echo", "primary"], ["sapphire", "secondary"]] },
  // Chapter II — Mages Gelés
  { id: "apprenti_gele", name: "Apprenti Gelé", familyId: "mages_geles", tier: "standard", role: "caster", drops: [["frozen_echo", "primary"], ["silver_ore", "secondary"]] },
  { id: "archiviste_gele", name: "Archiviste Gelé", familyId: "mages_geles", tier: "standard", role: "support", drops: [["frozen_echo", "primary"]] },
  { id: "professeur_d_arathas", name: "Professeur d'Arathas", familyId: "mages_geles", tier: "elite", role: "caster", drops: [["archival_fragment", "primary"], ["sapphire", "secondary"]] },
  // Chapter II — Sirènes
  { id: "sirene_errante", name: "Sirène Errante", familyId: "sirenes", tier: "standard", role: "caster", drops: [["frozen_fish", "primary"], ["frozen_echo", "secondary"]] },
  { id: "sirene_des_reflets", name: "Sirène des Reflets", familyId: "sirenes", tier: "standard", role: "illusionist", drops: [["frozen_echo", "primary"], ["pearlescent_scale", "rare"]] },
  { id: "sirene_des_chants", name: "Sirène des Chants", familyId: "sirenes", tier: "standard", role: "control", drops: [["pearlescent_scale", "secondary"]] },
  { id: "sirene_cryogenique", name: "Sirène Cryogénique", familyId: "sirenes", tier: "elite", role: "caster", drops: [["pearlescent_scale", "primary"], ["sapphire", "secondary"]] },
  // Chapter II — Créatures Marines Gelées
  { id: "poisson_abyssal_gele", name: "Poisson-Abyssal Gelé", familyId: "creatures_marines_gelees", tier: "standard", role: "melee", drops: [["frozen_fish", "primary"]] },
  { id: "crabe_de_givre", name: "Crabe de Givre", familyId: "creatures_marines_gelees", tier: "standard", role: "tank", drops: [["frozen_fish", "primary"], ["cold_shell_fragment", "secondary"]] },
  { id: "leviathan_juvenile_gele", name: "Léviathan Juvénile Gelé", familyId: "creatures_marines_gelees", tier: "elite", role: "tank", drops: [["cold_shell_fragment", "primary"], ["frozen_fish", "secondary"]] },
  // Chapter II — Aberrations d'Arathas
  { id: "sujet_a01", name: "Sujet A-01", familyId: "aberrations_d_arathas", tier: "standard", role: "melee", drops: [["frozen_echo", "primary"], ["experimental_tissue", "secondary"]] },
  { id: "sujet_a07", name: "Sujet A-07", familyId: "aberrations_d_arathas", tier: "standard", role: "assassin", drops: [["experimental_tissue", "primary"]] },
  { id: "prototype_alpha", name: "Prototype Alpha", familyId: "aberrations_d_arathas", tier: "elite", role: "tank", drops: [["experimental_tissue", "primary"], ["archival_fragment", "secondary"]] },
];

type BossSeed = Readonly<{
  id: string;
  bossId: string;
  name: string;
  silhouette: EnemySilhouette;
  role: EnemyRole;
  hp: number;
  contactDamage: number;
  moveSpeed: number;
  radius: number;
}>;

/** DEFERRED balancing — boss HP / damage placeholders. Patterns live in BOSS_PATTERNS. */
const BOSS_SEEDS: readonly BossSeed[] = [
  { id: "boss_dark_amalgam", bossId: "dark_amalgam", name: "Amalgame des Ténèbres", silhouette: "amalgam", role: "melee", hp: 520, contactDamage: 16, moveSpeed: 72, radius: 46 },
  { id: "boss_dragon_shadow", bossId: "dragon_shadow", name: "Ombre du Dragon", silhouette: "dragon", role: "aggressive", hp: 1600, contactDamage: 26, moveSpeed: 80, radius: 58 },
  { id: "boss_frost_amalgam", bossId: "frost_amalgam", name: "Amalgame du Givre", silhouette: "amalgam", role: "tank", hp: 2200, contactDamage: 32, moveSpeed: 66, radius: 54 },
  { id: "boss_corrupted_archmage", bossId: "corrupted_archmage", name: "Archimage Corrompu", silhouette: "archmage", role: "caster", hp: 2800, contactDamage: 36, moveSpeed: 70, radius: 44 },
  { id: "boss_fallen_rain_lord", bossId: "fallen_rain_lord", name: "Seigneur de la Pluie Déchu", silhouette: "rain_lord", role: "melee", hp: 3200, contactDamage: 40, moveSpeed: 92, radius: 44 },
  { id: "boss_allaeva", bossId: "allaeva", name: "Allaeva, Reine de Glace", silhouette: "queen", role: "caster", hp: 4200, contactDamage: 46, moveSpeed: 76, radius: 50 },
];

const FAMILY_BY_ID = new Map(ENEMY_FAMILIES.map((family) => [family.id, family]));

function lootTableIdFor(archetypeId: string): string {
  return `loot_${archetypeId}`;
}

export const ENEMY_ARCHETYPES: readonly EnemyArchetype[] = [
  ...STANDARD_SEEDS.map((seed): EnemyArchetype => {
    const family = FAMILY_BY_ID.get(seed.familyId)!;
    return {
      id: seed.id,
      name: seed.name,
      familyId: seed.familyId,
      tier: seed.tier,
      role: seed.role,
      attack: ROLE_PROFILE[seed.role].attack,
      silhouette: family.silhouette,
      stats: standardStats(family.chapter, seed.tier, seed.role),
      lootTableId: lootTableIdFor(seed.id),
    };
  }),
  ...BOSS_SEEDS.map((seed): EnemyArchetype => ({
    id: seed.id,
    name: seed.name,
    familyId: seed.bossId === "dark_amalgam" || seed.bossId === "frost_amalgam" ? "amalgames" : "boss",
    tier: "boss",
    role: seed.role,
    attack: ROLE_PROFILE[seed.role].attack,
    silhouette: seed.silhouette,
    stats: {
      hp: seed.hp,
      contactDamage: seed.contactDamage,
      moveSpeed: seed.moveSpeed,
      radius: seed.radius,
      aggroRadius: BASE_AGGRO_RADIUS + 120,
      attackCooldownMs: 900,
    },
    lootTableId: lootTableIdFor(seed.id),
    bossId: seed.bossId,
  })),
];

/**
 * Material loot tables generated from the archetype drops. Bosses have an empty material table:
 * their unique cores come from the dungeon first-clear rewards, their equipment from the boss roll.
 */
export const ENEMY_ARCHETYPE_LOOT_TABLES: readonly EnemyArchetypeLootTable[] = [
  ...STANDARD_SEEDS.map((seed) => ({
    id: lootTableIdFor(seed.id),
    drops: seed.drops.map(([resourceId, kind]) => ({ resourceId, ...DROP_PROFILE[seed.tier][kind] })),
  })),
  ...BOSS_SEEDS.map((seed) => ({ id: lootTableIdFor(seed.id), drops: [] })),
];

const ARCHETYPE_BY_ID = new Map(ENEMY_ARCHETYPES.map((archetype) => [archetype.id, archetype]));

export function getEnemyArchetype(archetypeId: string): EnemyArchetype | undefined {
  return ARCHETYPE_BY_ID.get(archetypeId);
}

export function getEnemyArchetypeOrThrow(archetypeId: string): EnemyArchetype {
  const archetype = getEnemyArchetype(archetypeId);
  if (!archetype) throw new Error(`Unknown enemy archetype: ${archetypeId}`);
  return archetype;
}

export function getBossArchetype(bossId: string): EnemyArchetype | undefined {
  return ENEMY_ARCHETYPES.find((archetype) => archetype.bossId === bossId);
}

export function getEnemyFamily(familyId: EnemyFamilyId): EnemyFamily | undefined {
  return FAMILY_BY_ID.get(familyId);
}
