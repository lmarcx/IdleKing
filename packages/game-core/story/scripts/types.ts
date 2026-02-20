export type ScriptLine =
  | { type: "NARRATION"; text: string }
  | { type: "SPEAKER"; name: string; text: string };

export type ScriptDef = {
  id: string; // ex: "ch01.intro"
  lines: ScriptLine[];
};