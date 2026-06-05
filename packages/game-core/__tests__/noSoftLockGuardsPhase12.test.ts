import assert from "node:assert/strict";
import test from "node:test";

import { getBuildCost } from "../building/buildCosts.js";
import { craftEquipmentFromRecipe } from "../building/forge/craft.js";
import { forgeRecycleEquipment } from "../building/forge/recycle.js";
import { getForgeUpgradeMaxLevel } from "../building/forge/rules.js";
import { forgeUpgradeEquipment } from "../building/forge/upgrade.js";
import {
  applyDamageToPlayer,
  applyDashCost,
  applySprintCost,
  createCombatRuntimeState,
  handlePlayerDeathAtCheckpoint,
  regenerateResources,
  spendMana,
  spendStamina,
} from "../combat/runtime/index.js";
import { assertMvpNoSoftLockGuards } from "../content/index.js";
import { createDefaultWalletState, grantCurrency, getCurrencyBalance } from "../currencies/index.js";
import { generateEquipmentItem } from "../equipment/index.js";
import { buildBuilding } from "../game/buildingBuildActions.js";
import { createInitialGameState, type GameState } from "../game/state.js";
import { saveGame, loadGameWithReport } from "../game/save.js";
import { addResourceToStock, canSpendResources, getCanonicalResourceQuantity, spendResources } from "../resources/index.js";
import { createSeededRng } from "../random/index.js";
import {
  ERA_REGISTRY,
  isEraPlayable,
  isEraUnlocked,
  unlockEraAtTimeGate,
} from "../specialItems/index.js";
import { canEnterDungeon, completeDungeon } from "../story/progressionMvp.js";
import {
  applyWorldResourceRegenForElapsed,
  maxWorldEnergy,
} from "../world/worldResources.js";

function runtimeState() {
  return createCombatRuntimeState({
    player: {
      hpMax: 100,
      manaMax: 50,
      staminaMax: 50,
      manaRegenPerSecond: 5,
      staminaRegenPerSecond: 10,
      attack: 10,
    },
    enemy: { hpMax: 100 },
  });
}

function withMockLocalStorage<T>(run: () => T): T {
  const store = new Map<string, string>();
  const previousLocalStorage = globalThis.localStorage;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      clear: () => store.clear(),
      getItem: (key: string) => store.get(key) ?? null,
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      get length() {
        return store.size;
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    },
  });

  try {
    return run();
  } finally {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: previousLocalStorage,
    });
  }
}

function buildTimeGate(state: GameState): GameState {
  const cost = getBuildCost("TIME_GATE");
  const built = buildBuilding({ ...state, resources: { ...state.resources, ...cost } }, "TIME_GATE");
  assert.equal(built.ok, true);
  return built.next;
}

function completeFirstClear(state: GameState, dungeonId: string): GameState {
  assert.equal(canEnterDungeon(state, dungeonId), true);
  const result = completeDungeon(state, dungeonId);
  assert.equal(result.ok, true);
  if (!result.ok) return state;
  assert.equal(result.firstClear, true);
  return result.next;
}

function runPlaythrough(state: GameState): GameState {
  let next = buildTimeGate(state);
  next = completeFirstClear(next, "prologue_wastelands");
  next = completeFirstClear(next, "funeral_mausoleum");
  next = completeFirstClear(next, "ashen_peak");
  next = { ...next, progression: { ...next.progression, worldLevel: 5 } };
  const era = unlockEraAtTimeGate(next, "era_glaciaire");
  assert.equal(era.ok, true);
  if (!era.ok) return next;
  next = era.next;
  for (const dungeonId of ["frozen_river", "reflection_cavern", "royal_abyss", "arathas_academy", "frost_source"] as const) {
    next = completeFirstClear(next, dungeonId);
  }
  return next;
}

test("assertMvpNoSoftLockGuards passes", () => {
  assert.doesNotThrow(() => assertMvpNoSoftLockGuards());
});

test("Mana and Stamina recover after spending, dash failure, and sprint", () => {
  const spent = spendStamina(spendMana(runtimeState(), 999), 999);
  assert.equal(spent.player.manaCurrent, 0);
  assert.equal(spent.player.staminaCurrent, 0);
  const dash = applyDashCost(spent);
  assert.equal(dash.ok, false);
  if (dash.ok) return;
  assert.equal(dash.reason, "NOT_ENOUGH_STAMINA");

  const sprinted = applySprintCost({ ...runtimeState(), player: { ...runtimeState().player, staminaCurrent: 1 } }, 999);
  assert.equal(sprinted.player.staminaCurrent, 0);

  const regened = regenerateResources(spent, 1);
  assert.ok(regened.player.manaCurrent > 0);
  assert.ok(regened.player.staminaCurrent > 0);
});

test("HP clamps and checkpoint restores combat resources", () => {
  const dead = applyDamageToPlayer(runtimeState(), 999);
  assert.equal(dead.player.hpCurrent, 0);
  assert.equal(dead.player.respawnRequired, true);

  const respawned = handlePlayerDeathAtCheckpoint(dead);
  assert.ok(respawned.player.hpCurrent > 0);
  assert.ok(respawned.player.manaCurrent > 0);
  assert.ok(respawned.player.staminaCurrent > 0);
});

test("World Energy regen and refill paths exist", () => {
  const state = createInitialGameState({ nowMs: 1_000 });
  const regened = applyWorldResourceRegenForElapsed(
    { ...state.world, energy: { ...state.world.energy, current: 0 } },
    state.progression.worldLevel,
    10 * 60_000,
  );

  assert.ok(regened.energy.current > 0);
  assert.equal(regened.energy.max, maxWorldEnergy(1));
});

test("economy helpers and Forge fail cleanly instead of soft-locking", () => {
  assert.equal(canSpendResources({}, { iron_ore: 1 }), false);
  assert.throws(() => spendResources({}, { iron_ore: 1 }), /Not enough/);
  assert.equal(getCanonicalResourceQuantity(addResourceToStock({}, "iron_ore", 10_000), "iron_ore"), 999);

  const craft = craftEquipmentFromRecipe({
    recipeId: "weapon_sword",
    resourceStock: {},
    forgeLevel: 1,
    itemLevel: 1,
    rng: createSeededRng(12_012),
  });
  assert.equal(craft.ok, false);
  if (craft.ok) return;
  assert.equal(craft.reason, "NOT_ENOUGH_RESOURCES");

  const item = generateEquipmentItem({ slot: "main_hand", itemLevel: 1, rarity: "COMMON", seed: "cap" });
  const upgrade = forgeUpgradeEquipment({
    item: { ...item, upgradeLevel: getForgeUpgradeMaxLevel("COMMON") },
    resourceStock: { iron_ore: 999 },
    wallet: grantCurrency(createDefaultWalletState(), "ECU", 999),
  });
  assert.equal(upgrade.ok, false);
  if (upgrade.ok) return;
  assert.equal(upgrade.reason, "MAX_UPGRADE_LEVEL");

  const recycle = forgeRecycleEquipment({
    item,
    inventory: { items: [item] },
    wallet: createDefaultWalletState(),
    rng: { nextFloat: () => 1 },
  });
  assert.equal(recycle.ok, true);
  if (!recycle.ok) return;
  assert.equal(recycle.itemDestroyed, true);
  assert.deepEqual(recycle.recipeMaterials, []);
  assert.equal(recycle.updatedInventory?.items.some((entry) => entry.id === item.id), false);
});

test("Time Gate consumes Fragment without blocking Chapter II and replay does not duplicate uniques", () => {
  let state = buildTimeGate(createInitialGameState());
  state = completeFirstClear(state, "prologue_wastelands");
  const replay = completeDungeon(state, "prologue_wastelands");
  assert.equal(replay.ok, true);
  if (!replay.ok) return;
  assert.equal(replay.firstClear, false);
  assert.equal(getCurrencyBalance(replay.next.wallet, "BOSS_TOKEN"), 1);
  state = replay.next;

  state = completeFirstClear(state, "funeral_mausoleum");
  state = completeFirstClear(state, "ashen_peak");
  assert.equal(state.specialItems.fragmentDuTemps, 1);
  state = { ...state, progression: { ...state.progression, worldLevel: 5 } };

  const unlocked = unlockEraAtTimeGate(state, "era_glaciaire");
  assert.equal(unlocked.ok, true);
  if (!unlocked.ok) return;
  assert.equal(unlocked.next.specialItems.fragmentDuTemps, 0);
  assert.equal(isEraUnlocked(unlocked.next, "era_glaciaire"), true);

  state = unlocked.next;
  for (const dungeonId of ["frozen_river", "reflection_cavern", "royal_abyss", "arathas_academy", "frost_source"] as const) {
    state = completeFirstClear(state, dungeonId);
  }
  assert.equal(state.story.completedEvents.has("chapter_ii_complete"), true);
  assert.equal(ERA_REGISTRY.find((era) => era.id === "era_deluge")?.teaser, true);
  assert.equal(isEraPlayable("era_deluge"), false);
});

test("playthrough still succeeds after save/load normalization", () => {
  withMockLocalStorage(() => {
    const state = createInitialGameState({ nowMs: 1_000 });
    saveGame({
      ...state,
      totalResonance: 999,
      effectSlots: 9,
      aggregatedStats: { dps: 999 },
    } as unknown as GameState);
    const loaded = loadGameWithReport();
    assert.ok(loaded);
    if (!loaded) return;
    const finalState = runPlaythrough(loaded.state);
    assert.equal(finalState.story.completedEvents.has("chapter_ii_complete"), true);
  });
});
