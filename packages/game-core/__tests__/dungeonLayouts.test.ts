import test from "node:test";
import assert from "node:assert/strict";

import { getDungeonLayout, validateDungeonLayouts } from "../story/dungeonLayouts.js";
import { STORY_DUNGEON_REGISTRY } from "../story/progressionMvp.js";

test("every story dungeon has a valid layout placing exactly its roster", () => {
  assert.doesNotThrow(() => validateDungeonLayouts());
});

test("boss dungeons lock their arena behind a gate", () => {
  for (const dungeon of STORY_DUNGEON_REGISTRY.filter((candidate) => candidate.bossId)) {
    const layout = getDungeonLayout(dungeon.id)!;
    const arena = layout.zones.at(-1)!;
    assert.ok(arena.enemies.some((enemy) => enemy.archetypeId.startsWith("boss_")), `${dungeon.id} boss in last zone`);
    if (layout.zones.length > 1) assert.ok(layout.gates.length >= 1, `${dungeon.id} needs a gate before the boss`);
  }
});

test("the Prologue follows its script: dog before ambush, ambush before boss", () => {
  const layout = getDungeonLayout("prologue_wastelands")!;
  assert.deepEqual(
    layout.gates.map((gate) => gate.opensWhen),
    [
      { kind: "beat_done", beatId: "feed" },
      { kind: "zone_cleared", zoneId: "ambush" },
    ],
  );
  assert.equal(layout.zones.find((zone) => zone.id === "ambush")?.spawnOnBeat, "shadows");
  assert.equal(layout.beats.find((beat) => beat.beatId === "drop_of_darkness")?.requires?.bossDefeated, true);
  // The boss sits far from the spawn, behind two gates.
  const boss = layout.zones.find((zone) => zone.id === "arena")!.enemies[0];
  assert.ok(boss.x - layout.playerSpawn.x > 2000);
});

test("template layouts are deterministic", () => {
  assert.deepEqual(getDungeonLayout("ashen_peak"), getDungeonLayout("ashen_peak"));
});
