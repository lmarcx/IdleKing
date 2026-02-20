import type { ScriptDef } from "./types.js";

export const CH03_SCRIPTS: ScriptDef[] = [
  {
    id: "ch03.intro",
    lines: [
      { type: "NARRATION", text: "Le royaume se réveille dans un silence étrange." },
      { type: "SPEAKER", name: "Héraut", text: "Majesté… tout le monde vous attend." },
      { type: "NARRATION", text: "À écrire : mise en place du contexte, objectif du chapitre." },
    ],
  },
  // plus tard tu peux ajouter :
  // { id: "ch03.outro", lines: [...] }
];