import type { ScriptDef } from "./types.js";
import { CH01_SCRIPTS } from "./ch01.js";
import { CH02_SCRIPTS } from "./ch02.js";
import { CH03_SCRIPTS } from "./ch03.js";
export * from "./registry.js";

// Ajoute ici au fur et à mesure : CH03_SCRIPTS, etc.
export const SCRIPTS: ScriptDef[] = [
  ...CH01_SCRIPTS,
  ...CH02_SCRIPTS,
  ...CH03_SCRIPTS,
];

export function getScript(id: string): ScriptDef | undefined {
  return SCRIPTS.find((s) => s.id === id);
}