import type { BuildingModule } from "./types.js";

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

// MVP: regen fixe (1 stamina/minute). Tu pourras le scaler par level plus tard.
function cornucopiaRegenPerMin(level: number) {
  return 1 + Math.floor((level - 1) * 0.25); // lvl1=1, lvl5=2, etc (doux)
}

export const CORNUCOPIA_BUILDING: BuildingModule = {
  id: "CORNUCOPIA",

  isUnlocked(state) {
    return state.buildings.cornucopia.unlocked;
  },

  isActive(state) {
    return state.buildings.cornucopia.active;
  },

  tick(state, ctx) {
    const b = state.buildings.cornucopia;

    // Si pas actif, on peut décider de regen quand même.
    // Ici: regen seulement si construit (built) + unlocked, même si inactive.
    if (!b.unlocked || !b.built) return { next: state };

    const regen = cornucopiaRegenPerMin(b.level) * Math.max(0, Math.floor(ctx.minutes));
    if (regen <= 0) return { next: state };

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