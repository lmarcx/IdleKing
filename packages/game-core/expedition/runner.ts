import type { CombatStats } from "../power/types.js";
import { emptyCombatStats, sumStats } from "../power/statHelpers.js";
import { applyRunModifiers, createRunModifiers, type RunModifiers } from "./runModifiers.js";
import { resolveChoiceRoom } from "./choiceResolver.js";
import type { ExpeditionRoom, ExpeditionRunState, ExpeditionConfig } from "./types.js";
import { generateExpedition } from "./generator.js";
import { simulateCombat } from "../combat/simulator.js";
import { BOSSES } from "../combat/bosses.js";

export type EncounterOutcome = {
  win: boolean;
  durationSec: number;
};

export type ExpeditionProgress = {
  roomsCleared: number;
  finished: boolean;
  result?: "WIN" | "LOSE";

  // for expedition 1-9: total time to clear level
  totalTimeSec: number;

  // for expedition 10 chrono: damage score
  bossDamageScore?: number;

  modifiers: RunModifiers;
};

export type RunEncounterFn = (params: {
  room: Extract<ExpeditionRoom, { type: "ENCOUNTER" }>;
  playerStats: CombatStats; // already includes world+loadout+modifiers
}) => EncounterOutcome;

export function defaultEncounterStub(): RunEncounterFn {
  // MVP placeholder: always win, time depends on enemy count & coeff
  return ({ room, playerStats }) => {
    const difficulty = room.enemies.reduce((s, e) => s + e.statsCoeff, 0);
    const power = Math.max(1, playerStats.attack + playerStats.hp / 100);
    const seconds = Math.max(3, Math.round((12 * difficulty) / power));
    return { win: true, durationSec: seconds };
  };
}

/**
 * Runs a full expedition "level" (7 rooms).
 * - Rooms 1/3/5: encounter (stub for now, injectable)
 * - Rooms 2/4/6: choice (persistent modifiers)
 * - Room 7: boss fight (normal for 1-9, chrono invincible for 10)
 *
 * Chrono rules:
 * - Level 1-9: totalTimeSec accumulates all room durations (encounters + boss fight duration)
 * - Level 10: boss fight is CHRONO 90s invincible, score = playerDamageTotal (even if player dies early)
 */
export function runExpeditionLevel(params: {
  config: ExpeditionConfig;
  // base stats inputs (you already have computeTotalPower elsewhere; here we just need stats)
  worldStats: CombatStats;
  loadoutStats: CombatStats;

  // choices: map roomIndex->optionId. If missing, auto-pick first.
  picks?: Partial<Record<2 | 4 | 6, string>>;

  encounterFn?: RunEncounterFn;

  // For boss fight script (player actions). If not provided, simple loop.
  bossScript?: Array<{ dt: number; useSkill?: "STRIKE" | "VOID_SPIKE" | "GUARD_BREAK" | null }>;
}): ExpeditionProgress {
  const gen = generateExpedition(params.config);
  const rooms = gen.rooms;

  const encounterFn = params.encounterFn ?? defaultEncounterStub();

  let mods = createRunModifiers();
  let totalTimeSec = 0;

  // Helper: compute player stats for current room (world+loadout then apply run mods)
  function playerRoomStats(): CombatStats {
    const base = sumStats(params.worldStats, params.loadoutStats);
    return applyRunModifiers(base, mods);
  }

  // 1..7 rooms
  for (const room of rooms) {
    if (room.type === "ENCOUNTER") {
      const out = encounterFn({ room, playerStats: playerRoomStats() });
      totalTimeSec += out.durationSec;
      if (!out.win) {
        return {
          roomsCleared: room.index - 1,
          finished: true,
          result: "LOSE",
          totalTimeSec,
          modifiers: mods,
        };
      }
    }

    if (room.type === "CHOICE") {
      const pickId = (params.picks?.[room.index as 2 | 4 | 6]) ?? room.options[0].id;
      const r = resolveChoiceRoom({ room, pickId, modifiers: mods });
      mods = r.nextModifiers;
      // choice room takes negligible time in MVP
    }

    if (room.type === "BOSS") {
      const bossId = room.bossId;
      const boss = (BOSSES as any)[bossId];
      if (!boss) throw new Error(`Unknown bossId ${bossId}. Add it to combat/bosses.ts`);

      const isSpecial = params.config.expeditionLevel === 10;

      const script =
        params.bossScript ??
        Array.from({ length: (isSpecial ? 900 : 600) }, (_, i) => ({
          dt: 0.1,
          useSkill: i % 60 === 0 ? ("VOID_SPIKE" as const) : null,
        }));

      const sim = simulateCombat({
        config: {
          mode: isSpecial ? "CHRONO" : "NORMAL",
          boss,
          durationCapSec: isSpecial ? 90 : 120, // cap for normal boss rooms
          bossInvincible: isSpecial,
          playerStamina: { max: 120, value: 120, regenPerSec: 14 },
          playerAutoAttackIntervalSec: 1.0,
        },
        playerStats: playerRoomStats(),
        script,
      });

      // For 1-9, add duration; for 10, it's 90s max but still measured
      totalTimeSec += sim.durationSec;

      if (isSpecial) {
        // score = damage until death (run valid). even if player dies early.
        return {
          roomsCleared: 7,
          finished: true,
          result: "WIN", // special is "completed" after chrono; reward claim handled elsewhere
          totalTimeSec,
          bossDamageScore: sim.playerDamageTotal,
          modifiers: mods,
        };
      }

      if (sim.winner !== "PLAYER") {
        return {
          roomsCleared: 6,
          finished: true,
          result: "LOSE",
          totalTimeSec,
          modifiers: mods,
        };
      }

      return {
        roomsCleared: 7,
        finished: true,
        result: "WIN",
        totalTimeSec,
        modifiers: mods,
      };
    }
  }

  // should never reach (room 7 returns)
  return {
    roomsCleared: 7,
    finished: true,
    result: "WIN",
    totalTimeSec,
    modifiers: mods,
  };
}
