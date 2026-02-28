import type { BuildingModule } from "./types.js";

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

// MVP: regen fixe (1 stamina/minute) + léger scaling par level
function cornucopiaRegenPerMin(level: number) {
  return 1 + Math.floor((level - 1) * 0.25); // lvl1=1, lvl5=2, etc
}

export const CORNUCOPIA_BUILDING: BuildingModule = {
  id: "CORNUCOPIA",

  // Game design: toujours dispo
  isUnlocked() {
    return true;
  },

  // Game design: toujours active
  isActive() {
    return true;
  },

  // Regen de stamina via tick (pas de cooldown)
  tick(state, ctx) {
    const b = state.buildings.cornucopia;

    const minutes = Math.max(0, Math.floor(ctx.minutes));
    if (minutes <= 0) return { next: state };

    const regen = cornucopiaRegenPerMin(b.level) * minutes;
    const nextStamina = clamp(b.stamina + regen, 0, b.staminaMax);

    if (nextStamina === b.stamina) return { next: state };

    return {
      next: {
        ...state,
        buildings: {
          ...state.buildings,
          cornucopia: { ...b, stamina: nextStamina },
        },
      },
    };
  },
};