import test from "node:test";
import assert from "node:assert/strict";

import { generateExpedition } from "../expedition/generator.js";

test("generateExpedition is deterministic for same seed/config", () => {
  const cfg = {
    biome: "COSMIC_WRECK",
    worldLevel: 50,
    expeditionLevel: 7,
    seed: 12345,
  } as const;

  const a = generateExpedition(cfg);
  const b = generateExpedition(cfg);

  assert.deepEqual(a, b);
});

test("generateExpedition changes when seed changes", () => {
  const cfg1 = {
    biome: "COSMIC_WRECK",
    worldLevel: 50,
    expeditionLevel: 7,
    seed: 111,
  } as const;

  const cfg2 = { ...cfg1, seed: 112 } as const;

  const a = generateExpedition(cfg1);
  const b = generateExpedition(cfg2);

  // likely different room seeds/enemies
  assert.notDeepEqual(a.rooms, b.rooms);
});
