import type { ScriptDef } from "./types.js";
import { CH01_SCRIPTS } from "./ch01.js";
import { CH02_SCRIPTS } from "./ch02.js";
export * from "./registry.js";

// MVP scope: Prologue + Chapter I + Chapter II. Chapters beyond Ch II are part of
// the generic story scaffold and have no scripts yet (resolution is tolerated).
export const SCRIPTS: ScriptDef[] = [
  ...CH01_SCRIPTS,
  ...CH02_SCRIPTS,
];

export function getScript(id: string): ScriptDef | undefined {
  return SCRIPTS.find((s) => s.id === id);
}