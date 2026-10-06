import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { generateEquipmentItem } from "../equipment/generation.js";
import { WEAPON_FAMILY_UNLOCK_LADDER } from "../building/forge/weapons.js";
import { resolveWeaponLoadoutProfile, WEAPON_ATTACK_PROFILES } from "../combat/weaponProfiles.js";
import type { GameState } from "../game/state.js";

function withWeapons(main?: string, off?: string): GameState {
  const state = createInitialGameState();
  const items = [];
  if (main) items.push(generateEquipmentItem({ id: "main", baseItemId: main, slot: main === "shield" || main === "grimoire" ? "off_hand" : "main_hand", itemLevel: 1 }));
  if (off) items.push(generateEquipmentItem({ id: "off", baseItemId: off, slot: "off_hand", itemLevel: 1 }));
  return {
    ...state,
    inventory: { items: [...state.inventory.items, ...items] },
    equipment: {
      equipped: { ...state.equipment.equipped, main_hand: main ? "main" : null, off_hand: off ? "off" : null },
    },
  };
}

test("every weapon family of the Forge ladder has distinct primary and secondary actions", () => {
  for (const family of WEAPON_FAMILY_UNLOCK_LADDER) {
    const profile = WEAPON_ATTACK_PROFILES[family];
    assert.ok(profile, family);
    assert.notDeepEqual(profile.primary, profile.secondary);
  }
});

test("unarmed players still have both actions", () => {
  const profile = resolveWeaponLoadoutProfile(createInitialGameState());
  assert.equal(profile.mainFamily, "unarmed");
  assert.ok(profile.primary.damageCoefficient > 0 && profile.secondary.damageCoefficient > 0);
});

test("equipped weapon family drives the attack profile", () => {
  assert.equal(resolveWeaponLoadoutProfile(withWeapons("bow")).primary.shape, "projectile");
  assert.equal(resolveWeaponLoadoutProfile(withWeapons("axe")).secondary.shape, "burst");
  assert.equal(resolveWeaponLoadoutProfile(withWeapons("spear")).primary.shape, "thrust");
});

test("one-handed weapons take their secondary from a shield or grimoire off-hand", () => {
  const swordShield = resolveWeaponLoadoutProfile(withWeapons("sword", "shield"));
  assert.equal(swordShield.primary.label, WEAPON_ATTACK_PROFILES.sword.primary.label);
  assert.equal(swordShield.secondary.label, WEAPON_ATTACK_PROFILES.shield.secondary.label);

  const greatswordShield = resolveWeaponLoadoutProfile(withWeapons("greatsword", "shield"));
  assert.equal(greatswordShield.secondary.label, WEAPON_ATTACK_PROFILES.greatsword.secondary.label);
});
