import type { BuildingModule } from "./types.js";

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

function staminaMaxForLevel(level: number): number {
  return 100 + (level - 1) * 25;
}

function cornucopiaRegenPerMin(level: number) {
  return 1 + Math.floor((level - 1) * 0.25);
}

export const CORNUCOPIA_BUILDING: BuildingModule = {
  id: "CORNUCOPIA",

  isUnlocked() {
    return true;
  },

  isActive() {
    return true;
  },

  tick(state, ctx) {
    const b = state.buildings.cornucopia;

    const minutes = Math.max(0, Math.floor(ctx.minutes));
    if (minutes <= 0) return { next: state };

    const staminaMax = staminaMaxForLevel(b.level);
    const regen = cornucopiaRegenPerMin(b.level) * minutes;

    const nextStamina = clamp(b.stamina + regen, 0, staminaMax);

    if (nextStamina === b.stamina) return { next: state };

    return {
      next: {
        ...state,
        buildings: {
          ...state.buildings,
          cornucopia: {
            ...b,
            stamina: nextStamina,
            staminaMax,
          },
        },
      },
    };
  },
};