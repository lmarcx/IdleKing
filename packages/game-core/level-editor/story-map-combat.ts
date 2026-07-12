import { createCombatRuntimeState, performBasicAttack } from "../combat/runtime/index.js";
import type { EnemyBehavior, MapEnemy } from "./types.js";

export type StoryMapRuntimeEnemy = Readonly<{
  id: string;
  x: number;
  y: number;
  assetId: string;
  name: string;
  behavior: EnemyBehavior;
  aggroRadius: number;
  isBoss: boolean;
  def: number;
  hpMax: number;
  hpCurrent: number;
  isDead: boolean;
}>;

/**
 * Pure adapter: MapEnemy (static level-authoring data) -> initial mutable runtime state for one
 * Story map enemy. Does not mutate the input MapEnemy or the PlayableMap it came from -- a
 * caller re-runs this once per enemy at mount time to get a fresh runtime collection (map stays
 * a static definition; runtime entities are recreated every mount -- see the Story map migration
 * plan, Phase G4). HP/def seed from MapEnemy.stats; actual combat resolution is delegated
 * entirely to packages/game-core/combat/runtime (see attackStoryMapRuntimeEnemy below) -- no
 * combat math is duplicated here.
 */
export function createStoryMapRuntimeEnemy(enemy: MapEnemy): StoryMapRuntimeEnemy {
  const hpMax = Math.max(0, enemy.stats.hp);
  return {
    id: enemy.id,
    x: enemy.x,
    y: enemy.y,
    assetId: enemy.assetId,
    name: enemy.name,
    behavior: enemy.behavior,
    aggroRadius: enemy.aggroRadius,
    isBoss: enemy.isBoss ?? false,
    def: Math.max(0, enemy.stats.defense),
    hpMax,
    hpCurrent: hpMax,
    isDead: hpMax <= 0,
  };
}

/**
 * Minimal placeholder attacker stats for the Story map combat technical proof (G4). Not derived
 * from any real player save/equipment/loadout -- deliberately isolated from real progression,
 * unlike apps/web's story-combat-runtime-adapter.ts (which does derive from the real character
 * for the live Story runtime).
 */
export type StoryMapAttackerStats = Readonly<{
  attack: number;
  critChance?: number;
  critDamage?: number;
}>;

/**
 * Resolves one basic attack from the player against a single Story map runtime enemy, via
 * combat/runtime's existing createCombatRuntimeState()/performBasicAttack() -- the only place
 * damage is calculated. Returns a new StoryMapRuntimeEnemy with hpCurrent/isDead updated; the
 * input is never mutated. A no-op (returns the same enemy) once isDead is already true. Player
 * HP/mana/stamina are not tracked or returned since Story map enemies don't damage the player
 * back yet (out of scope for G4).
 */
export function attackStoryMapRuntimeEnemy(enemy: StoryMapRuntimeEnemy, attacker: StoryMapAttackerStats): StoryMapRuntimeEnemy {
  if (enemy.isDead) return enemy;

  const state = createCombatRuntimeState({
    player: {
      hpMax: 100,
      manaMax: 0,
      staminaMax: 0,
      manaRegenPerSecond: 0,
      staminaRegenPerSecond: 0,
      attack: attacker.attack,
      critChance: attacker.critChance ?? 0,
      critDamage: attacker.critDamage,
    },
    enemy: {
      hpMax: enemy.hpMax,
      hpCurrent: enemy.hpCurrent,
      def: enemy.def,
    },
  });

  const result = performBasicAttack(state);
  if (!result.ok) return enemy;

  return {
    ...enemy,
    hpCurrent: result.next.enemy.hpCurrent,
    isDead: result.next.enemy.isDead,
  };
}
