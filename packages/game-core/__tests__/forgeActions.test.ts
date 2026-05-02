import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { completeChapterAction } from "../game/actions.js";
import { forgeCraft, forgeUpgrade, forgeRecycle } from "../game/forgeActions.js";
import { isEquipmentItem } from "../items/types.js";
import { addQty, getQty } from "../resources/types.js";

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
  assert.ok(r.next.villagers.list[0].stamina < staminaBefore);
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
