import type { BuildingDefinition } from "./types.js";

export const BUILDINGS: BuildingDefinition[] = [
  {
    id: "TOWN_HALL",
    name: "Hôtel de Ville",
    description: "Le cœur du royaume. Débloque de nouveaux bâtiments et augmente la puissance structurelle.",
    bonus: { hp: 50, armor: 5 },
    flags: ["UNLOCK_BUILD_MENU"],
  },
  {
    id: "ROYAL_TREASURY",
    name: "Trésorerie Royale",
    description: "Débloque les Kingamas et améliore l'efficacité du royaume.",
    minWorldLevel: 11, // Tier II
    bonus: { attack: 3, critChance: 0.02 },
    flags: ["UNLOCK_KINGAMAS"],
  },
  {
    id: "FORGE",
    name: "Forge",
    description: "Améliore le combat et prépare le futur crafting.",
    bonus: { attack: 6, pierceRating: 8 },
  },
  {
    id: "BARRACKS",
    name: "Caserne",
    description: "Prépare l'armée (hors MVP) et renforce les fondations du royaume.",
    bonus: { hp: 80, armor: 10 },
  },
  {
    id: "ARCANE_TOWER",
    name: "Tour Arcanique",
    description: "Amplifie les forces élémentaires du royaume.",
    bonus: { elemental: { FIRE: 12, ICE: 12, LIGHTNING: 12, VOID: 12 } },
  },
  {
    id: "TIME_GATE",
    name: "Time Gate",
    description: "Batiment canonique de transition d'eres et d'acces futur aux modes du monde.",
    role: "era_unlock",
    actions: ["world_modes", "open_modal"],
    minWorldLevel: 1,
    flags: ["ERA_UNLOCK", "WORLD_MODES"],
  },
  {
    id: "WELL",
    name: "Puits",
    description: "Production d'eau (online).",
    production: [{ id: "WATER", perSecond: 0.12 }],
  },
  {
    id: "HUNTERS_LODGE",
    name: "Pavillon des Chasseurs",
    description: "Production de viande (online).",
    production: [{ id: "MEAT", perSecond: 0.08 }],
  },
  {
    id: "STONEQUARRY",
    name: "Carrière",
    description: "Production de pierre (online).",
    production: [{ id: "STONE", perSecond: 0.15 }],
  },
  {
    id: "LUMBERMILL",
    name: "Scierie",
    description: "Production de bois (online).",
    production: [{ id: "WOOD", perSecond: 0.18 }],
  },
];

export function getBuildingDef(id: BuildingDefinition["id"]) {
  const b = BUILDINGS.find((x) => x.id === id);
  if (!b) throw new Error(`Unknown building id: ${id}`);
  return b;
}
