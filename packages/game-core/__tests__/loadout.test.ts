import test from "node:test";
import assert from "node:assert/strict";

import { generateItem } from "../loot/itemGenerator.js";
import { createInventory, addItem } from "../player/inventory.js";
import { equipItem, computeLoadoutComputed, sanitizeLoadout } from "../player/loadout.js";

function hasAnyContribution(stats: {
  hp: number;
  attack: number;
  armor: number;
  critChance: number;
  speedRating: number;
  pierceRating: number;
  resists: Record<string, number>;
  elemental: Record<string, number>;
}) {
  const resistSum = Object.values(stats.resists).reduce((a, b) => a + b, 0);
  const elemSum = Object.values(stats.elemental).reduce((a, b) => a + b, 0);

  return (
    stats.hp > 0 ||
    stats.attack > 0 ||
    stats.armor > 0 ||
    stats.critChance > 0 ||
    stats.speedRating > 0 ||
    stats.pierceRating > 0 ||
    resistSum > 0 ||
    elemSum > 0
  );
}

test("equipping an item affects loadout stats (jewelry)", () => {
  let inv = createInventory();

  const item = generateItem({
    seed: 10,
    worldLevel: 30,
    biome: "VOLCANIC",
    ilvl: 600,
    biasSlot: "NECKLACE",
  });

  inv = addItem(inv, item);

  const { loadout } = equipItem({ inventory: inv, loadout: {}, itemId: item.id });
  const computed = computeLoadoutComputed(inv, loadout);

  assert.equal(computed.equippedItems.length, 1);

  // Robust: jewelry may not roll attack, but must contribute something.
  assert.ok(
    hasAnyContribution(computed.loadoutStats),
    "Equipped item should contribute at least one stat to the loadout"
  );
});

test("legacy ring loadout slots are ignored", () => {
  const loadout = sanitizeLoadout({ NECKLACE: "necklace-item", RING: "legacy-ring" } as any);

  assert.equal(loadout.NECKLACE, "necklace-item");
  assert.equal((loadout as any).RING, undefined);
});
