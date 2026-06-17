/**
 * Cinematic scripts (data-driven). Text is canon, sourced from
 * docs/30_new_direction/01_lore/SCRIPTS.md ("Prologue — Le Réveil"). The MVP
 * opening skips the cosmology and starts at the old king's awakening.
 *
 * `imageKey` is a logical key; the web layer maps it to a concrete asset path.
 */
export type CinematicSlide = Readonly<{
  id: string;
  text: string;
  imageKey?: string;
  speaker?: string;
}>;

export type CinematicScript = Readonly<{
  id: string;
  slides: readonly CinematicSlide[];
}>;

export const PROLOGUE_AWAKENING: CinematicScript = {
  id: "prologue_awakening",
  slides: [
    {
      id: "awaken",
      imageKey: "wastelands_dawn",
      text:
        "Un vieux roi s'éveille d'un rêve qu'il avait l'impression d'avoir déjà fait. " +
        "Il ne se souvient ni de son nom, ni de son royaume, ni de la raison pour laquelle " +
        "son cœur porte le poids d'un deuil qu'il ne comprend pas.",
    },
    {
      id: "wastelands",
      imageKey: "wastelands_ruins",
      text:
        "Autour de lui s'étendent les Terres Désolées. Des ruines noircies percent le sable. " +
        "Des colonnes brisées s'élèvent comme les doigts d'un mort oublié. Le vent soulève une " +
        "poussière pâle, mais rien ne vit. Aucune voix. Aucun chant. Aucun pas.",
    },
    {
      id: "memory",
      imageKey: "fragmented_vision",
      text:
        "Les murs effondrés lui semblent familiers, comme les fragments d'une mémoire qui ne " +
        "veut pas revenir. Par instants, une image traverse son esprit : une lumière blanche, " +
        "un fleuve morcelé, une chute sans fin. Puis plus rien.",
    },
    {
      id: "onward",
      imageKey: "wastelands_path",
      text:
        "Le vieux roi avance. Il observe les vestiges d'un ancien royaume et se demande, sans " +
        "savoir pourquoi, si ce monde lui appartint un jour.",
    },
  ],
} as const;

export const CINEMATIC_REGISTRY: Readonly<Record<string, CinematicScript>> = {
  [PROLOGUE_AWAKENING.id]: PROLOGUE_AWAKENING,
} as const;

export function getCinematicScript(id: string): CinematicScript | undefined {
  return CINEMATIC_REGISTRY[id];
}
