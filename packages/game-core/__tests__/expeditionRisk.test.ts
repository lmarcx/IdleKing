import test from "node:test";
import assert from "node:assert/strict";

import { generateItem } from "../loot/itemGenerator.js";
import { createInventory, addItem } from "../player/inventory.js";
import {
  createExpeditionLoadout,
  startExpeditionRun,
  resolveExpeditionRun,
} from "../expedition/riskLoadout.js";

test("LOSE removes risked items and clears expedition loadout", () => {
  let inv = createInventory();

  const a = generateItem({ seed: 1, worldLevel: 20, biome: "VOLCANIC", ilvl: 400 });
  const b = Array.from({ length: 100 }, (_, index) =>
    generateItem({ seed: index + 2, worldLevel: 20, biome: "VOLCANIC", ilvl: 400 }),
  ).find((item) => item.slot !== a.slot);
  assert.ok(b, "fixture should find a second random item with another slot");

  inv = addItem(inv, a);
  inv = addItem(inv, b);

  const loadout = createExpeditionLoadout({
    inventory: inv,
    selections: [
      { slot: a.slot, itemId: a.id },
      { slot: b.slot, itemId: b.id },
    ],
  });

  const run = startExpeditionRun({
    config: { biome: "VOLCANIC", worldLevel: 50, expeditionLevel: 1, seed: 999 },
    loadout,
    now: 1000,
  });

  const out = resolveExpeditionRun({ run, inventory: inv, result: "LOSE", now: 2000 });

  assert.ok(!out.inventory.items[a.id]);
  assert.ok(!out.inventory.items[b.id]);

  assert.equal(Object.keys(out.nextExpeditionLoadout).length, 0, "loadout should be cleared on LOSE");
});

test("WIN keeps risked items, keeps expedition loadout, and grants loot items", () => {
  let inv = createInventory();

  const a = generateItem({ seed: 3, worldLevel: 20, biome: "TUNDRA", ilvl: 400, biasSlot: "NECKLACE" });
  inv = addItem(inv, a);

  const loadout = createExpeditionLoadout({
    inventory: inv,
    selections: [{ slot: a.slot, itemId: a.id }],
  });

  const run = startExpeditionRun({
    config: { biome: "TUNDRA", worldLevel: 50, expeditionLevel: 1, seed: 123 },
    loadout,
    now: 1000,
  });

  const out = resolveExpeditionRun({ run, inventory: inv, result: "WIN", now: 2000 });

  assert.ok(!!out.inventory.items[a.id], "risked item should remain");

  assert.equal(
    out.nextExpeditionLoadout[a.slot],
    a.id,
    "expedition loadout should be kept on WIN"
  );

  assert.ok(Object.keys(out.inventory.items).length >= 2);
});
