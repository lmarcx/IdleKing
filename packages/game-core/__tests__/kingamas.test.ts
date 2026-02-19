import test from "node:test";
import assert from "node:assert/strict";

import { createWallet, convertResourcesToKingamas } from "../economy/kingamas.js";
import { initQuestStates, completeQuest } from "../economy/quests.js";
import { rollKingamasForExpedition } from "../economy/kingamas.js";

test("kingamas conversion locked before world level 11", () => {
  const wallet = createWallet(0);
  const out = convertResourcesToKingamas({
    worldLevel: 10,
    wallet,
    resources: [{ id: "BRONZE", amount: 100000 }],
  });

  assert.equal(out.gained, 0);
  assert.equal(out.wallet.balance, 0);
});

test("kingamas conversion works at world level 11+", () => {
  const wallet = createWallet(0);
  const out = convertResourcesToKingamas({
    worldLevel: 11,
    wallet,
    resources: [{ id: "BRONZE", amount: 3000 }],
  });

  assert.equal(out.gained, 3);
  assert.equal(out.wallet.balance, 3);
});

test("unlock quest gives starter kingamas when available", () => {
  const states = initQuestStates();
  const q0 = states.find((q) => q.id === "UNLOCK_KINGAMAS")!;
  const wallet = createWallet(0);

  const now = Date.now();

  const { wallet: wallet2 } = completeQuest({
    questId: "UNLOCK_KINGAMAS",
    state: { ...q0, status: "AVAILABLE" },
    ctx: { now, worldLevel: 11, hasRoyalTreasuryBuilding: false },
    wallet,
  });

  // Available -> gives reward
  assert.ok(wallet2.balance > 0);
});

test("kingamas reward is deterministic for same seed/level", () => {
  const a = rollKingamasForExpedition({ seed: 123, expeditionLevel: 5, win: true });
  const b = rollKingamasForExpedition({ seed: 123, expeditionLevel: 5, win: true });
  assert.equal(a, b);
});

test("kingamas reward is zero on lose", () => {
  const a = rollKingamasForExpedition({ seed: 123, expeditionLevel: 5, win: false });
  assert.equal(a, 0);
});