import assert from "node:assert/strict";
import test from "node:test";

import {
  MVP_BOSS_ROSTER,
  assertValidMvpContentGraph,
  validateMvpContentGraph,
} from "../content/index.js";
import { RINGS_SKILLS_MAP } from "../equipment/index.js";
import { EFFECT_SET_REGISTRY } from "../effectSets/index.js";
import { FORGE_RECIPES } from "../building/forge/recipes.js";
import { getResourceDefinition, RESOURCE_DEFINITIONS } from "../resources/index.js";
import {
  STORY_BOSS_REGISTRY,
  STORY_DUNGEON_REGISTRY,
} from "../story/progressionMvp.js";
import { EQUIPMENT_SLOTS } from "../items/types.js";
import { SKILL_IDS, SKILL_REGISTRY } from "../skills/index.js";

test("assertValidMvpContentGraph does not throw for the current MVP graph", () => {
  assert.doesNotThrow(() => assertValidMvpContentGraph());
  assert.deepEqual(validateMvpContentGraph(), { ok: true, errors: [] });
});

test("removing a referenced resource from an injected graph makes validation throw", () => {
  const resourcesWithoutIron = RESOURCE_DEFINITIONS.filter((resource) => resource.id !== "iron_ore");

  assert.throws(
    () => assertValidMvpContentGraph({ resources: resourcesWithoutIron }),
    /iron_ore/
  );
});

test("MVP boss roster is exact and core dungeon links are locked", () => {
  assert.deepEqual([...MVP_BOSS_ROSTER].sort(), [
    "allaeva",
    "corrupted_archmage",
    "dark_amalgam",
    "dragon_shadow",
    "fallen_rain_lord",
    "frost_amalgam",
  ]);
  assert.deepEqual(STORY_BOSS_REGISTRY.map((boss) => boss.id).sort(), [...MVP_BOSS_ROSTER].sort());
  assert.equal(STORY_DUNGEON_REGISTRY.find((dungeon) => dungeon.id === "royal_abyss")?.bossId, "fallen_rain_lord");
  assert.equal(STORY_DUNGEON_REGISTRY.find((dungeon) => dungeon.id === "frost_source")?.bossId, "allaeva");
  assert.equal(STORY_DUNGEON_REGISTRY.find((dungeon) => dungeon.id === "arathas_academy")?.bossId, "corrupted_archmage");
});

test("Allaeva and Archimage Corrompu have two phases", () => {
  assert.equal(STORY_BOSS_REGISTRY.find((boss) => boss.id === "allaeva")?.phases, 2);
  assert.equal(STORY_BOSS_REGISTRY.find((boss) => boss.id === "corrupted_archmage")?.phases, 2);
});

test("no active Chapter III content exists in the MVP story graph", () => {
  assert.equal(STORY_DUNGEON_REGISTRY.some((dungeon) => String(dungeon.chapterId).includes("iii")), false);
  assert.equal(STORY_BOSS_REGISTRY.some((boss) => String(boss.chapterId).includes("iii")), false);
});

test("Fragment du Temps and Kaleidoscope remain absent from resources, equipment, skills, and Effect Sets", () => {
  assert.equal(getResourceDefinition("fragment_du_temps"), undefined);
  assert.equal(getResourceDefinition("kaleidoscope"), undefined);
  assert.equal(EQUIPMENT_SLOTS.includes("kaleidoscope" as any), false);
  assert.equal("fragment_du_temps" in SKILL_REGISTRY, false);
  assert.equal("kaleidoscope" in SKILL_REGISTRY, false);
  assert.equal(EFFECT_SET_REGISTRY.some((set) => set.id === ("kaleidoscope" as any) || set.id === ("fragment_du_temps" as any)), false);
});

test("rings map references only SK-001 through SK-016", () => {
  for (const skillId of Object.values(RINGS_SKILLS_MAP)) {
    assert.ok(SKILL_IDS.includes(skillId));
    assert.match(skillId, /^SK-(?:00[1-9]|01[0-6])$/);
  }
});

test("boss recipes use Resource Registry ids", () => {
  const bossRecipes = FORGE_RECIPES.filter((recipe) => String(recipe.id).startsWith("boss_"));
  assert.ok(bossRecipes.length > 0);
  for (const recipe of bossRecipes) {
    for (const resourceId of Object.keys(recipe.ingredients)) {
      assert.ok(getResourceDefinition(resourceId), `${recipe.id} uses unknown resource ${resourceId}`);
    }
  }
});

test("Effect Set narrative sources are valid boss ids or produced story events", () => {
  const result = validateMvpContentGraph();
  assert.equal(result.ok, true);
  for (const effectSet of EFFECT_SET_REGISTRY) {
    assert.equal(effectSet.availability, "narrative");
    assert.ok(effectSet.source.id.length > 0);
  }
});

test("content graph validation rejects non-MVP bosses and broken Effect Set sources", () => {
  assert.equal(validateMvpContentGraph({
    bosses: [
      ...STORY_BOSS_REGISTRY,
      {
        id: "chapter_iii_intruder",
        name: "Chapter III Intruder",
        chapterId: "chapter_ii_glaciaire",
        dungeonId: "frost_source",
        phases: 1,
        storyFlagsProduced: [],
      },
    ],
  }).ok, false);

  assert.throws(
    () => assertValidMvpContentGraph({
      effectSets: [
        ...EFFECT_SET_REGISTRY.slice(0, 4),
        {
          ...EFFECT_SET_REGISTRY[4],
          source: { kind: "boss_first_clear", id: "missing_boss", label: "Missing Boss" },
        },
      ],
    }),
    /missing_boss/
  );
});
