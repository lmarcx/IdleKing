import type { ScriptDef } from "./types.js";
import { SCRIPTS } from "./index.js";
import { CHAPTERS } from "../chapters.js";

export type ScriptResolutionMode = "STRICT" | "PERMISSIVE";

/**
 * Retourne un script par ID.
 */
export function getScriptById(id: string): ScriptDef | undefined {
  return SCRIPTS.find((s) => s.id === id);
}

/**
 * Retourne tous les scripts d’un chapitre.
 *
 * STRICT: throw si un script manque
 * PERMISSIVE: insère un placeholder si manquant
 */
export function getChapterScripts(
  chapterId: number,
  mode: ScriptResolutionMode = "STRICT"
): ScriptDef[] {
  const chapter = CHAPTERS.find((c) => c.id === chapterId);
  if (!chapter) return [];

  const results: ScriptDef[] = [];

  for (const sid of chapter.scriptIds) {
    const script = getScriptById(sid);

    if (!script) {
      if (mode === "STRICT") {
        throw new Error(`Missing script: ${sid} (chapter ${chapterId})`);
      }

      // mode PERMISSIVE → placeholder automatique
      results.push({
        id: sid,
        lines: [
          { type: "NARRATION", text: `[Missing script: ${sid}]` },
        ],
      });

      continue;
    }

    results.push(script);
  }

  return results;
}