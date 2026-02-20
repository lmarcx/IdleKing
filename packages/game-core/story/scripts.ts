export type ScriptLine =
  | { type: "NARRATION"; text: string }
  | { type: "SPEAKER"; name: string; text: string };

export type ScriptDef = {
  id: string;
  lines: ScriptLine[];
};

// MVP: placeholders pour les scripts, à remplacer par de vrais contenus plus tard
export const SCRIPTS: ScriptDef[] = Array.from({ length: 20 }, (_, i) => {
  const ch = i + 1;
  return {
    id: `ch${ch}.intro`,
    lines: [
      { type: "NARRATION", text: `Début du chapitre ${ch}.` },
      { type: "NARRATION", text: `À écrire : scénario + dialogues.` },
    ],
  };
});

export function getScript(id: string): ScriptDef | undefined {
  return SCRIPTS.find((s) => s.id === id);
}