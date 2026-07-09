// Balancing baseline. The MVP damage structure is locked, these values stay tunable.
export const ATTACK_DAMAGE_PER_POINT = 0.01;
// Per-point bonus applied to status modifiers when an effect carries Debuff Power.
// No MVP source feeds Debuff Power yet, so this stays neutral in practice; the
// baseline keeps the locked scaling structure ready instead of a hard 0.
export const DEBUFF_POWER_SCALING_PER_POINT = 0.02;

// Locked MVP base status values from DESIGN_FREEZE_V1.md.
export const SHOCK_BASE_VULNERABILITY = 0.1;
export const BLEED_BASE_WEAKEN = 0.1;
