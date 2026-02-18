import type {
  CombatEntity,
  CombatResult,
  CombatTickInput,
  SkillCooldowns,
  StaminaState,
  BossDef,
  CombatLogEvent,
  SkillId,
} from "./types.js";
import type { CombatStats, Element } from "../power/types.js";
import { computeCritMultiplier } from "../power/crit.js";
import { SKILLS } from "./skills.js";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function copyEntity(name: string, stats: CombatStats): CombatEntity {
  return {
    name,
    stats,
    hpMax: Math.max(1, Math.round(stats.hp)),
    hp: Math.max(1, Math.round(stats.hp)),
  };
}

function armorMitigation(armor: number) {
  return armor / (armor + 180);
}

function resistMitigation(resist: number) {
  return resist / (resist + 180);
}

function pierceFraction(pierceRating: number) {
  return pierceRating / (pierceRating + 180);
}

function getResist(stats: CombatStats, element?: Element) {
  if (!element) return 0;
  return stats.resists[element] ?? 0;
}

function elementBonus(stats: CombatStats, element?: Element) {
  if (!element) return 0;
  return stats.elemental[element] ?? 0;
}

function rollCrit(critChance: number) {
  if (critChance <= 0) return false;
  if (critChance >= 1) return true; // uncapped -> always crit at 100%+
  return Math.random() < critChance;
}

function computeHitDamage(params: {
  attacker: CombatEntity;
  defender: CombatEntity;
  baseMultiplier: number;
  flatBonus?: number;
  element?: Element;
  pierceBonus?: number;
}): { damage: number; crit: boolean } {
  const a = params.attacker.stats;
  const d = params.defender.stats;

  const critMult = computeCritMultiplier(a.critChance, a.critDmg);
  const crit = rollCrit(a.critChance);
  const critFactor = crit ? critMult : 1;

  const pierce = pierceFraction(a.pierceRating + (params.pierceBonus ?? 0));

  const armorMit = armorMitigation(d.armor);
  const resist = getResist(d, params.element);
  const resistMit = resistMitigation(resist);

  // Pierce reduces both mitigations partially
  const effectiveArmorMit = armorMit * (1 - 0.7 * pierce);
  const effectiveResistMit = resistMit * (1 - 0.7 * pierce);

  const elem = elementBonus(a, params.element);
  const elemFactor = 1 + elem / 200;

  const raw = (a.attack * params.baseMultiplier + (params.flatBonus ?? 0)) * elemFactor;
  const mitigated = raw * (1 - effectiveArmorMit) * (1 - effectiveResistMit);
  const dmg = Math.max(0, mitigated) * critFactor;

  return { damage: Math.round(dmg), crit };
}

export type CombatSimConfig = {
  boss: BossDef;
  durationCapSec: number;
  playerStamina: StaminaState;
  playerAutoAttackIntervalSec: number;
};

export function simulateCombat(params: {
  config: CombatSimConfig;
  playerStats: CombatStats;
  bossStatsOverride?: Partial<CombatStats>;
  script: Array<CombatTickInput>;
}): CombatResult {
  const bossStats: CombatStats = {
    ...params.config.boss.baseStats,
    ...(params.bossStatsOverride ?? {}),
  };

  const player = copyEntity("PLAYER", params.playerStats);
  const boss = copyEntity("BOSS", bossStats);

  let t = 0;
  let playerDamageTotal = 0;
  let bossDamageTotal = 0;

  const log: CombatLogEvent[] = [];

  const cd: SkillCooldowns = {};
  let stamina: StaminaState = { ...params.config.playerStamina };

  let playerAutoTimer = 0;

  let phaseIdx = 0;
  let bossBasicTimer = 0;
  let bossSpecialTimer = 0;

  function currentPhase() {
    const phases = params.config.boss.phases;
    const hpPct = boss.hp / boss.hpMax;

    while (phaseIdx + 1 < phases.length && hpPct <= phases[phaseIdx + 1].hpThresholdPct) {
      phaseIdx++;
      log.push({ t, type: "PHASE", phaseId: phases[phaseIdx].id });
      bossBasicTimer = 0;
      bossSpecialTimer = 0;
    }
    return phases[phaseIdx];
  }

  function tickCooldowns(dt: number) {
    for (const k of Object.keys(cd) as SkillId[]) {
      cd[k] = Math.max(0, (cd[k] ?? 0) - dt);
    }
  }

  for (const step of params.script) {
    const dt = step.dt;
    t += dt;

    stamina.value = clamp(stamina.value + stamina.regenPerSec * dt, 0, stamina.max);

    tickCooldowns(dt);

    if (step.useSkill) {
      const def = SKILLS[step.useSkill];
      const rem = cd[def.id] ?? 0;

      if (rem > 0) {
        log.push({ t, type: "SKILL", id: def.id, ok: false, reason: "COOLDOWN" });
      } else if (stamina.value < def.staminaCost) {
        log.push({ t, type: "SKILL", id: def.id, ok: false, reason: "STAMINA" });
      } else {
        stamina.value -= def.staminaCost;
        cd[def.id] = def.cooldownSec;
        log.push({ t, type: "SKILL", id: def.id, ok: true });

        const hit = computeHitDamage({
          attacker: player,
          defender: boss,
          baseMultiplier: def.baseDamageMultiplier,
          flatBonus: def.flatBonus,
          element: def.element,
          pierceBonus: def.pierceBonus,
        });

        boss.hp = Math.max(0, boss.hp - hit.damage);
        playerDamageTotal += hit.damage;
        log.push({ t, type: "HIT", source: "PLAYER", amount: hit.damage, crit: hit.crit, element: def.element });

        if (boss.hp <= 0) break;
      }
    }

    // player auto-attack
    playerAutoTimer += dt;
    while (playerAutoTimer >= params.config.playerAutoAttackIntervalSec) {
      playerAutoTimer -= params.config.playerAutoAttackIntervalSec;

      const hit = computeHitDamage({
        attacker: player,
        defender: boss,
        baseMultiplier: 1.0,
      });

      boss.hp = Math.max(0, boss.hp - hit.damage);
      playerDamageTotal += hit.damage;
      log.push({ t, type: "HIT", source: "PLAYER", amount: hit.damage, crit: hit.crit });

      if (boss.hp <= 0) break;
    }
    if (boss.hp <= 0) break;

    // boss actions
    const phase = currentPhase();
    bossBasicTimer += dt;
    bossSpecialTimer += dt;

    while (bossSpecialTimer >= phase.pattern.specialIntervalSec) {
      bossSpecialTimer -= phase.pattern.specialIntervalSec;

      const hit = computeHitDamage({
        attacker: boss,
        defender: player,
        baseMultiplier: phase.pattern.special.multiplier,
        element: phase.pattern.special.element,
      });

      player.hp = Math.max(0, player.hp - hit.damage);
      bossDamageTotal += hit.damage;
      log.push({ t, type: "HIT", source: "BOSS", amount: hit.damage, crit: hit.crit, element: phase.pattern.special.element });

      if (player.hp <= 0) break;
    }
    if (player.hp <= 0) break;

    while (bossBasicTimer >= phase.pattern.basicIntervalSec) {
      bossBasicTimer -= phase.pattern.basicIntervalSec;

      const hit = computeHitDamage({
        attacker: boss,
        defender: player,
        baseMultiplier: 1.0,
      });

      player.hp = Math.max(0, player.hp - hit.damage);
      bossDamageTotal += hit.damage;
      log.push({ t, type: "HIT", source: "BOSS", amount: hit.damage, crit: hit.crit });

      if (player.hp <= 0) break;
    }
    if (player.hp <= 0) break;

    if (t >= params.config.durationCapSec) break;
  }

  const winner =
    boss.hp <= 0 ? "PLAYER" : player.hp <= 0 ? "BOSS" : player.hp > boss.hp ? "PLAYER" : "BOSS";

  return {
    winner,
    durationSec: t,
    playerDamageTotal,
    bossDamageTotal,
    log,
  };
}
