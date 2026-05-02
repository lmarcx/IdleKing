"use client";

import { useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";

import { AvailableEquipmentPanel } from "@/components/game/character/available-equipment-panel";
import { CharacterStatsPanel } from "@/components/game/character/character-stats-panel";
import { EquipmentDoll } from "@/components/game/character/equipment-doll";
import { FAKE_EQUIPMENT } from "@/components/game/character/fake-equipment";
import type { CharacterEquipment, CharacterStat, EquipmentSlotId, EquippedItems } from "@/components/game/character/types";
import { useGameStore } from "@/store/game-store";
import {
  calculateFinalCharacterStats,
  getEquippedItems,
  type EquipmentItem,
  type EquipmentSlot,
} from "@idleking/game-core";
import { normalizeEquipmentItem, type ItemRarity } from "@idleking/game-core/items";

type EquipmentMetadata = {
  description?: string;
  icon?: string;
  value?: number;
};

const CHARACTER_TO_CORE_RARITY: Record<CharacterEquipment["rarity"], ItemRarity> = {
  common: "COMMON",
  uncommon: "COMMON",
  rare: "RARE",
  epic: "EPIC",
  legendary: "LEGENDARY",
};

const CORE_TO_CHARACTER_RARITY: Record<ItemRarity, CharacterEquipment["rarity"]> = {
  COMMON: "common",
  RARE: "rare",
  EPIC: "epic",
  LEGENDARY: "legendary",
};

function getFixturePower(item: CharacterEquipment): number | undefined {
  if (item.stats.power !== undefined) return item.stats.power;

  const attack = item.stats.atk ?? 0;
  const defense = item.stats.def ?? 0;
  const hp = item.stats.hp ?? 0;
  const power = Math.round(attack * 2 + defense * 1.5 + hp * 0.2);

  return power > 0 ? power : undefined;
}

const DEV_EQUIPMENT_FIXTURES: Array<EquipmentItem & EquipmentMetadata> = FAKE_EQUIPMENT.map((item) => ({
  description: item.description,
  icon: item.icon,
  id: item.id,
  ilvl: item.itemLevel,
  itemLevel: item.itemLevel,
  kind: "equipment",
  name: item.name,
  rarity: CHARACTER_TO_CORE_RARITY[item.rarity],
  slot: item.slot,
  stats: {
    hp: item.stats.hp,
    attack: item.stats.atk,
    defense: item.stats.def,
    power: getFixturePower(item),
  },
  value: item.value,
}));

function getCharacterRarity(item: EquipmentItem): CharacterEquipment["rarity"] {
  return item.rarity ? CORE_TO_CHARACTER_RARITY[item.rarity] : "common";
}

function toCharacterEquipment(item: EquipmentItem): CharacterEquipment {
  const metadata = item as EquipmentItem & EquipmentMetadata;
  const itemLevel = item.itemLevel ?? item.ilvl ?? 1;

  return {
    description: metadata.description ?? "Equipment from the current character inventory.",
    icon: metadata.icon ?? `/assets/equipment-slots/${item.slot}.svg`,
    id: item.id,
    itemLevel,
    name: item.name,
    rarity: getCharacterRarity(item),
    slot: item.slot,
    stats: {
      hp: item.stats.hp,
      atk: item.stats.attack,
      def: item.stats.defense,
      power: item.stats.power,
    },
    value: metadata.value ?? itemLevel,
  };
}

function hasEquipmentItems(items: unknown[]) {
  return items.some((item) => normalizeEquipmentItem(item));
}

export default function CharacterPage() {
  const state = useGameStore((s) => s.state);
  const hydrated = useGameStore((s) => s.hydrated);
  const dispatch = useGameStore((s) => s.dispatch);
  const equipPlayerItem = useGameStore((s) => s.equipPlayerItem);
  const unequipPlayerItem = useGameStore((s) => s.unequipPlayerItem);
  const characterStats = useMemo(() => calculateFinalCharacterStats(state), [state]);
  const availableEquipment = useMemo(
    () =>
      state.inventory.items
        .map((item) => normalizeEquipmentItem(item))
        .filter((item): item is EquipmentItem => item !== null)
        .map(toCharacterEquipment),
    [state.inventory.items]
  );
  const equippedItems = useMemo<EquippedItems>(() => {
    const entries = getEquippedItems(state).map((item) => [item.slot, toCharacterEquipment(item)] as const);
    return Object.fromEntries(entries) as EquippedItems;
  }, [state]);

  useEffect(() => {
    if (!hydrated || process.env.NODE_ENV === "production") return;
    if (hasEquipmentItems(state.inventory.items)) return;

    dispatch((current) => {
      if (hasEquipmentItems(current.inventory.items)) return current;

      return {
        ...current,
        inventory: {
          items: [...current.inventory.items, ...DEV_EQUIPMENT_FIXTURES],
        },
      };
    });
  }, [dispatch, hydrated, state.inventory.items]);

  const stats = useMemo<CharacterStat[]>(
    () => [
      { label: "Player Level", value: state.progression.playerLevel },
      { label: "Player XP", value: state.progression.playerXp },
      { label: "POWER", value: characterStats.power },
      { label: "HP", value: characterStats.hp },
      { label: "ATK", value: characterStats.attack },
      { label: "DEF", value: characterStats.defense },
    ],
    [
      characterStats.attack,
      characterStats.defense,
      characterStats.hp,
      characterStats.power,
      state.progression.playerLevel,
      state.progression.playerXp,
    ]
  );

  const handleEquip = useCallback((item: CharacterEquipment) => {
    const result = equipPlayerItem(item.id);
    if (!result.ok) {
      toast.error(`Unable to equip item: ${result.reason}`);
    }
  }, [equipPlayerItem]);

  const handleUnequip = useCallback((slot: EquipmentSlotId) => {
    unequipPlayerItem(slot as EquipmentSlot);
  }, [unequipPlayerItem]);

  return (
    <div className="space-y-4">
      <h1 className="font-ik-title text-2xl font-semibold">Character</h1>

      <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)_320px]">
        <CharacterStatsPanel stats={stats} />
        <EquipmentDoll equippedItems={equippedItems} onUnequip={handleUnequip} />
        <AvailableEquipmentPanel
          equippedItems={equippedItems}
          items={availableEquipment}
          onEquip={handleEquip}
          onUnequip={handleUnequip}
        />
      </div>
    </div>
  );
}
