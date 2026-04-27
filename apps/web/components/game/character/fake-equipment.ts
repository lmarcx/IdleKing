import type { CharacterEquipment, CharacterStats, EquippedItems } from "./types";

export const FAKE_EQUIPMENT: CharacterEquipment[] = [
  {
    description: "A crown-forged helm carrying a faint royal ward.",
    icon: "/assets/equipment-slots/helmet.svg",
    id: "fake-helmet-royal-guard",
    itemLevel: 18,
    name: "Royal Guard Helm",
    rarity: "rare",
    slot: "helmet",
    stats: { def: 8, hp: 42 },
    value: 120,
  },
  {
    description: "Heavy chest armor etched with oath marks.",
    icon: "/assets/equipment-slots/chest.svg",
    id: "fake-chest-oathplate",
    itemLevel: 21,
    name: "Oathplate Cuirass",
    rarity: "epic",
    slot: "chest",
    stats: { def: 14, hp: 68 },
    value: 210,
  },
  {
    description: "Steel gauntlets worn by palace sentinels.",
    icon: "/assets/equipment-slots/gloves.svg",
    id: "fake-gloves-sentinel",
    itemLevel: 14,
    name: "Sentinel Grips",
    rarity: "uncommon",
    slot: "gloves",
    stats: { atk: 5, def: 4 },
    value: 75,
  },
  {
    description: "A reinforced belt with a dark brass buckle.",
    icon: "/assets/equipment-slots/belt.svg",
    id: "fake-belt-brassbound",
    itemLevel: 12,
    name: "Brassbound Belt",
    rarity: "common",
    slot: "belt",
    stats: { def: 3, hp: 20 },
    value: 48,
  },
  {
    description: "Boots made for long marches through cursed soil.",
    icon: "/assets/equipment-slots/boots.svg",
    id: "fake-boots-nightmarch",
    itemLevel: 16,
    name: "Nightmarch Boots",
    rarity: "rare",
    slot: "boots",
    stats: { def: 5 },
    value: 110,
  },
  {
    description: "A kingly blade with a cold cyan line in the fuller.",
    icon: "/assets/equipment-slots/weapon.svg",
    id: "fake-weapon-crownblade",
    itemLevel: 25,
    name: "Crownblade",
    rarity: "legendary",
    slot: "weapon",
    stats: { atk: 32 },
    value: 360,
  },
  {
    description: "A compact shield from the old royal armory.",
    icon: "/assets/equipment-slots/offhand.svg",
    id: "fake-offhand-wardshield",
    itemLevel: 19,
    name: "Wardshield",
    rarity: "epic",
    slot: "offhand",
    stats: { def: 16 },
    value: 190,
  },
  {
    description: "A necklace pulsing with soft rift light.",
    icon: "/assets/equipment-slots/necklace.svg",
    id: "fake-necklace-riftchain",
    itemLevel: 20,
    name: "Riftchain",
    rarity: "rare",
    slot: "necklace",
    stats: { power: 18 },
    value: 145,
  },
  {
    description: "A signet ring stamped with the lost kingdom seal.",
    icon: "/assets/equipment-slots/ring.svg",
    id: "fake-ring-ashen-signet",
    itemLevel: 17,
    name: "Ashen Signet",
    rarity: "uncommon",
    slot: "ring",
    stats: { atk: 7, hp: 18 },
    value: 92,
  },
  {
    description: "A strange relic that hums near royal blood.",
    icon: "/assets/equipment-slots/artifact.svg",
    id: "fake-artifact-star-reliquary",
    itemLevel: 24,
    name: "Star Reliquary",
    rarity: "legendary",
    slot: "artifact",
    stats: { power: 44 },
    value: 420,
  },
];

export function calculateCharacterStats(equippedItems: EquippedItems): CharacterStats {
  const totals = Object.values(equippedItems).reduce<CharacterStats>(
    (acc, item) => {
      if (!item) return acc;

      return {
        atk: acc.atk + (item.stats.atk ?? 0),
        def: acc.def + (item.stats.def ?? 0),
        hp: acc.hp + (item.stats.hp ?? 0),
        power: acc.power + (item.stats.power ?? 0),
      };
    },
    { atk: 0, def: 0, hp: 0, power: 0 }
  );

  if (totals.power > 0) return totals;

  return {
    ...totals,
    power: Math.round(totals.atk * 2 + totals.def * 1.5 + totals.hp * 0.2),
  };
}
