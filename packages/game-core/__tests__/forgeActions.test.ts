import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { forgeCraft, forgeUpgrade, forgeRecycle } from "../game/forgeActions.js";
import { addQty, getQty } from "../resources/types.js";

test("Forge craft creates item, spends resources, drains stamina", () => {
  let s = createInitialGameState();

  // unlock forge for test (MVP)
  s = {
    ...s,
    story: {
      ...s.story,
      unlocked: new Set([...s.story.unlocked, "FORGE"]),
    },
  };

  // give resources
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
  s = {
    ...s,
    story: {
      ...s.story,
      unlocked: new Set([...s.story.unlocked, "FORGE"]),
    },
  };

  // craft first
  s = { ...s, resources: addQty(s.resources, "COPPER", 10) };
  const vId = s.villagers.list[0].id;

  const crafted = forgeCraft(s, "BASIC_SWORD", vId);
  assert.equal(crafted.ok, true);

  const itemId = crafted.createdItemId!;
  const ilvlBefore = crafted.next.inventory.items[0].ilvl;

  // give gold for upgrade
  let s2 = { ...crafted.next, resources: addQty(crafted.next.resources, "GOLD", 10) };

  const u = forgeUpgrade(s2, itemId, vId);
  assert.equal(u.ok, true);

  const upgraded = u.next.inventory.items.find((it) => it.id === itemId)!;
  assert.equal(upgraded.ilvl, ilvlBefore + 10);
});

test("Forge recycle removes item and gives copper", () => {
  let s = createInitialGameState();
  s = {
    ...s,
    story: {
      ...s.story,
      unlocked: new Set([...s.story.unlocked, "FORGE"]),
    },
  };

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