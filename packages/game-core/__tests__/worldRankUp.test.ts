import test from "node:test";
import assert from "node:assert/strict";

import { wxpNext, addWorldWxp, canRankUpWorld, rankUpWorldOnce, WORLD_MAX_LEVEL } from "../progression/worldXp.js";

test("World WXP accumulates without leveling up", () => {
  const need = wxpNext(1);
  const added = addWorldWxp(1, 0, need + 10);

  assert.equal(added.newWorldLevel, 1);
  assert.equal(added.newWorldWxp, need + 10);
  assert.equal(canRankUpWorld(added.newWorldLevel, added.newWorldWxp), true);
});

test("rankUpWorldOnce consumes WXP and increases level by 1", () => {
  const need = wxpNext(1);
  const s = addWorldWxp(1, 0, need);

  const r = rankUpWorldOnce(s.newWorldLevel, s.newWorldWxp);
  assert.equal(r.rankedUp, true);
  assert.equal(r.newWorldLevel, 2);
  assert.equal(r.newWorldWxp, 0);
});

test("cannot rank up past max level", () => {
  const r = rankUpWorldOnce(WORLD_MAX_LEVEL, 999999999);
  assert.equal(r.rankedUp, false);
  assert.equal(r.newWorldLevel, WORLD_MAX_LEVEL);
});