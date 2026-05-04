import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { completeChapterAction } from "../game/actions.js";
import { FORGE_RECIPES } from "../building/forge/recipes.js";
import { forgeCraft, forgeUpgrade, forgeRecycle } from "../game/forgeActions.js";
import { isEquipmentItem } from "../items/types.js";
import { addQty, getQty } from "../resources/types.js";
import { expectedIlvl } from "../progression/expectedIlvl.js";

function progressToChapter4AndBuildForge(s: ReturnType<typeof createInitialGameState>) {
  // Chapter progression is linear in MVP: chapters must be completed in order.
  for (const ch of [1, 2, 3, 4] as const) {
    s = completeChapterAction(s, ch).next;
  }

  // Forge must be built to allow manual crafting actions.
  s = {
    ...s,
    buildings: {
      ...s.buildings,
      forge: { ...s.buildings.forge, built: true, active: true },
    },
  };

  return s;
}

test("Forge craft creates item, spends resources, drains stamina", () => {
  let s = createInitialGameState();
  s = progressToChapter4AndBuildForge(s);

  // Give resources
  s = { ...s, resources: addQty(s.resources, "COPPER", 10) };

  const vId = s.villagers.list[0].id;
  const staminaBefore = s.villagers.list[0].stamina;

  const r = forgeCraft(s, "BASIC_SWORD", vId);
  assert.equal(r.ok, true);
  assert.ok(r.createdItemId);

  assert.ok(r.next.inventory.items.length === 1);
  const item = r.next.inventory.items[0];
  assert.ok(isEquipmentItem(item));
  assert.equal(item.slot, "weapon");
  assert.ok((item.stats.attack ?? 0) > 0);
  assert.ok((item.stats.power ?? 0) > 0);
  assert.ok(r.next.villagers.list[0].stamina < staminaBefore);
});

test("Forge has MVP recipes that create real equipment items", () => {
  const recipeIds = FORGE_RECIPES.map((recipe) => recipe.id);
  assert.ok(recipeIds.includes("iron_sword"));
  assert.ok(recipeIds.includes("iron_helmet"));
  assert.ok(recipeIds.includes("copper_ring"));
  assert.ok(recipeIds.includes("BASIC_SWORD"));
  assert.ok(recipeIds.includes("BASIC_ARMOR"));
  assert.ok(recipeIds.includes("BASIC_CAPE"));
  assert.ok(recipeIds.includes("BASIC_ARTIFACT"));

  let s = createInitialGameState();
  s = progressToChapter4AndBuildForge(s);
  s = { ...s, resources: addQty(addQty(addQty(addQty(s.resources, "COPPER", 20), "STONE", 20), "WOOD", 20), "GOLD", 20) };

  const vId = s.villagers.list[0].id;
  const crafted = forgeCraft(s, "BASIC_CAPE", vId);
  assert.equal(crafted.ok, true);

  const item = crafted.next.inventory.items[0];
  assert.ok(isEquipmentItem(item));
  assert.equal(item.slot, "cape");
  assert.ok((item.stats.hp ?? 0) > 0);
  assert.ok((item.stats.defense ?? 0) > 0);
  assert.ok((item.stats.power ?? 0) > 0);
});

test("Forge craft consumes ore resources", () => {
  let s = createInitialGameState();
  s = progressToChapter4AndBuildForge(s);
  s = { ...s, resources: addQty(s.resources, "IRON", 4) };

  const result = forgeCraft(s, "iron_sword", s.villagers.list[0].id);

  assert.equal(result.ok, true);
  assert.equal(getQty(result.next.resources, "IRON"), 0);
});

test("Forge craft adds equipment to inventory", () => {
  let s = createInitialGameState();
  s = progressToChapter4AndBuildForge(s);
  s = { ...s, resources: addQty(s.resources, "IRON", 3) };

  const result = forgeCraft(s, "iron_helmet", s.villagers.list[0].id);

  assert.equal(result.ok, true);
  assert.equal(result.next.inventory.items.length, 1);
  const item = result.next.inventory.items[0];
  assert.ok(isEquipmentItem(item));
  assert.equal(item.slot, "helmet");
  assert.equal(item.rarity, "UNCOMMON");
  assert.ok((item.stats.defense ?? 0) > 0);
  assert.ok((item.stats.hp ?? 0) > 0);
});

test("Forge craft refuses when resources are insufficient", () => {
  let s = createInitialGameState();
  s = progressToChapter4AndBuildForge(s);
  s = { ...s, resources: addQty(s.resources, "COPPER", 2) };

  const result = forgeCraft(s, "copper_ring", s.villagers.list[0].id);

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, "NOT_ENOUGH_RESOURCES");
  assert.equal(result.next.inventory.items.length, 0);
});

test("Forge crafted itemLevel depends on worldLevel", () => {
  let s = createInitialGameState();
  s = progressToChapter4AndBuildForge(s);
  s = {
    ...s,
    progression: { ...s.progression, worldLevel: 7 },
    resources: addQty(s.resources, "COPPER", 3),
  };

  const result = forgeCraft(s, "copper_ring", s.villagers.list[0].id);

  assert.equal(result.ok, true);
  const item = result.next.inventory.items[0];
  assert.ok(isEquipmentItem(item));
  assert.equal(item.slot, "ring");
  assert.equal(item.itemLevel, expectedIlvl(7));
});

test("Forge upgrade increases ilvl and spends gold", () => {
  let s = createInitialGameState();
  s = progressToChapter4AndBuildForge(s);

  // Craft first
  s = { ...s, resources: addQty(s.resources, "COPPER", 10) };
  const vId = s.villagers.list[0].id;

  const crafted = forgeCraft(s, "BASIC_SWORD", vId);
  assert.equal(crafted.ok, true);

  const itemId = crafted.createdItemId!;
  const craftedItem = crafted.next.inventory.items[0];
  assert.ok(isEquipmentItem(craftedItem));
  const ilvlBefore = craftedItem.ilvl ?? craftedItem.itemLevel ?? 0;

  // Give gold for upgrade
  const s2 = { ...crafted.next, resources: addQty(crafted.next.resources, "GOLD", 10) };

  const u = forgeUpgrade(s2, itemId, vId);
  assert.equal(u.ok, true);

  const upgraded = u.next.inventory.items.find((it) => it.id === itemId)!;
  assert.ok(isEquipmentItem(upgraded));
  assert.equal(upgraded.ilvl ?? upgraded.itemLevel, ilvlBefore + 10);
  assert.ok((upgraded.stats.attack ?? 0) >= (craftedItem.stats.attack ?? 0));
  assert.ok((upgraded.stats.power ?? 0) >= (craftedItem.stats.power ?? 0));
});

test("Forge recycle removes item and gives copper", () => {
  let s = createInitialGameState();
  s = progressToChapter4AndBuildForge(s);

  s = { ...s, resources: addQty(s.resources, "COPPER", 10) };
  const vId = s.villagers.list[0].id;

  const crafted = forgeCraft(s, "BASIC_SWORD", vId);
  assert.equal(crafted.ok, true);

  const itemId = crafted.createdItemId!;
  const copperBefore = getQty(crafted.next.resources, "COPPER");

  const rec = forgeRecycle(crafted.next, itemId);
  assert.equal(rec.ok, true);
  assert.equal(rec.next.inventory.items.length, 0);

  const copperAfter = getQty(rec.next.resources, "COPPER");
  assert.ok(copperAfter > copperBefore);
});
