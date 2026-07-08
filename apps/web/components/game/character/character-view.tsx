"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AvailableEquipmentPanel } from "@/components/game/character/available-equipment-panel";
import { CharacterStatsPanel } from "@/components/game/character/character-stats-panel";
import { EquipmentDoll } from "@/components/game/character/equipment-doll";
import { FAKE_EQUIPMENT } from "@/components/game/character/fake-equipment";
import type {
  CharacterEquipment,
  CharacterStat,
  EquipmentDragPayload,
  EquipmentSlotId,
  EquippedItems,
} from "@/components/game/character/types";
import { ItemDeleteConfirmDialog } from "@/components/game/item-delete-dialog";
import { EffectSetsPanel } from "@/components/game/worlds/effect-sets-panel";
import { ResonancePanel } from "@/components/game/worlds/resonance-panel";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import {
  calculateFinalCharacterStats,
  getEquippedItems,
  normalizePlayerEquipmentState,
  type EquipmentItem,
  type EquipmentSlot,
} from "@idleking/game-core";
import { normalizeEquipmentItem, type ItemRarity } from "@idleking/game-core/items";

type CharacterTab = "equipment" | "resonance" | "effects";

const CHARACTER_TABS: { id: CharacterTab; label: string }[] = [
  { id: "equipment", label: "Equipment" },
  { id: "resonance", label: "Resonance" },
  { id: "effects", label: "Effect Sets" },
];

type EquipmentMetadata = {
  description?: string;
  icon?: string;
  value?: number;
};

const CHARACTER_TO_CORE_RARITY: Record<CharacterEquipment["rarity"], ItemRarity> = {
  common: "COMMON",
  uncommon: "UNCOMMON",
  rare: "RARE",
  epic: "EPIC",
  legendary: "LEGENDARY",
};

const CORE_TO_CHARACTER_RARITY: Record<ItemRarity, CharacterEquipment["rarity"]> = {
  COMMON: "common",
  UNCOMMON: "uncommon",
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

function toCoreEquipmentSlot(slot: CharacterEquipment["slot"]): EquipmentSlot {
  if (slot === "weapon") return "main_hand";
  if (slot === "offhand") return "off_hand";
  return slot as EquipmentSlot;
}

function toCharacterEquipmentSlot(slot: EquipmentSlot): EquipmentSlotId {
  if (slot === "main_hand") return "weapon";
  if (slot === "off_hand") return "offhand";
  return slot as EquipmentSlotId;
}

const DEV_EQUIPMENT_FIXTURES: Array<EquipmentItem & EquipmentMetadata> = FAKE_EQUIPMENT.map((item) => ({
  affixes: [],
  baseItemId: item.id,
  baseStats: {
    hp: item.stats.hp,
    attack: item.stats.atk,
    defense: item.stats.def,
    power: getFixturePower(item),
  },
  description: item.description,
  icon: item.icon,
  id: item.id,
  ilvl: item.itemLevel,
  instanceId: item.id,
  itemLevel: item.itemLevel,
  kind: "equipment",
  name: item.name,
  rarity: CHARACTER_TO_CORE_RARITY[item.rarity],
  rolledStats: {
    hp: item.stats.hp,
    attack: item.stats.atk,
    defense: item.stats.def,
    power: getFixturePower(item),
  },
  slot: toCoreEquipmentSlot(item.slot),
  upgradeLevel: 0,
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
    affixes: item.affixes,
    description: metadata.description ?? "Equipment from the current character inventory.",
    icon: metadata.icon ?? `/assets/equipment-slots/${item.slot}.svg`,
    id: item.id,
    itemLevel,
    name: item.name,
    rarity: getCharacterRarity(item),
    setId: item.setId,
    skillId: item.skillId,
    slot: toCharacterEquipmentSlot(item.slot),
    stats: {
      hp: item.stats.hp,
      atk: item.stats.attack,
      def: item.stats.defense,
      power: item.stats.power,
    },
    upgradeLevel: item.upgradeLevel,
    value: metadata.value ?? itemLevel,
  };
}

function hasEquipmentItems(items: unknown[]) {
  return items.some((item) => normalizeEquipmentItem(item));
}

export function CharacterView() {
  const state = useGameStore((s) => s.state);
  const hydrated = useGameStore((s) => s.hydrated);
  const dispatch = useGameStore((s) => s.dispatch);
  const equipPlayerItem = useGameStore((s) => s.equipPlayerItem);
  const equipPlayerRing = useGameStore((s) => s.equipPlayerRing);
  const unequipPlayerItem = useGameStore((s) => s.unequipPlayerItem);
  const unequipPlayerRing = useGameStore((s) => s.unequipPlayerRing);
  const removePlayerItem = useGameStore((s) => s.removePlayerItem);
  const [pendingDelete, setPendingDelete] = useState<CharacterEquipment | null>(null);
  const characterStats = useMemo(() => calculateFinalCharacterStats(state), [state]);
  const availableEquipment = useMemo(
    () =>
      state.inventory.items
        .map((item) => normalizeEquipmentItem(item))
        .filter((item): item is EquipmentItem => item !== null)
        .map(toCharacterEquipment),
    [state.inventory.items]
  );
  const equippedCoreItems = useMemo(() => getEquippedItems(state), [state]);
  const equippedById = useMemo(
    () => new Map(equippedCoreItems.map((item) => [item.id, toCharacterEquipment(item)] as const)),
    [equippedCoreItems],
  );
  const equippedItemIds = useMemo(() => new Set(equippedCoreItems.map((item) => item.id)), [equippedCoreItems]);
  const equippedItems = useMemo<EquippedItems>(() => {
    const entries = equippedCoreItems
      .filter((item) => item.slot !== "ring")
      .map((item) => [toCharacterEquipmentSlot(item.slot), equippedById.get(item.id)!] as const);
    return Object.fromEntries(entries) as EquippedItems;
  }, [equippedCoreItems, equippedById]);
  const ringSlotIds = useMemo(
    () => normalizePlayerEquipmentState(state.equipment).equipped.rings,
    [state.equipment],
  );
  const equippedRings = useMemo<(CharacterEquipment | null)[]>(
    () => ringSlotIds.map((itemId) => (itemId ? equippedById.get(itemId) ?? null : null)),
    [equippedById, ringSlotIds],
  );

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

  const handleUnequipItem = useCallback((item: CharacterEquipment) => {
    unequipPlayerItem(toCoreEquipmentSlot(item.slot));
  }, [unequipPlayerItem]);

  const handleUnequipRing = useCallback((slotIndex: number) => {
    unequipPlayerRing(slotIndex);
  }, [unequipPlayerRing]);

  const handleDropOnSlot = useCallback((slotId: EquipmentSlotId, payload: EquipmentDragPayload) => {
    if (payload.slot !== slotId) {
      toast.error("Cet objet ne correspond pas a cet emplacement.");
      return;
    }
    const result = equipPlayerItem(payload.id);
    if (!result.ok) {
      toast.error(`Unable to equip item: ${result.reason}`);
    }
  }, [equipPlayerItem]);

  const handleDropOnRing = useCallback((slotIndex: number, payload: EquipmentDragPayload) => {
    if (payload.slot !== "ring") {
      toast.error("Seuls les anneaux vont dans cet emplacement.");
      return;
    }
    const result = equipPlayerRing(payload.id, slotIndex);
    if (!result.ok) {
      toast.error(`Unable to equip ring: ${result.reason}`);
    }
  }, [equipPlayerRing]);

  const handleRequestDelete = useCallback((item: CharacterEquipment) => {
    setPendingDelete(item);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!pendingDelete) return;
    const result = removePlayerItem(pendingDelete.id);
    if (!result.ok) {
      toast.error(`Unable to delete item: ${result.reason}`);
    } else {
      toast.success(`${pendingDelete.name} deleted`);
    }
    setPendingDelete(null);
  }, [pendingDelete, removePlayerItem]);

  return (
    <div className="space-y-4">
      <h1 className="font-ik-title text-2xl font-semibold">Character</h1>

      <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)_320px]">
        <CharacterStatsPanel stats={stats} />
        <EquipmentDoll
          equippedItems={equippedItems}
          equippedRings={equippedRings}
          onDelete={handleRequestDelete}
          onDropOnRing={handleDropOnRing}
          onDropOnSlot={handleDropOnSlot}
          onUnequip={handleUnequip}
          onUnequipRing={handleUnequipRing}
        />
        <AvailableEquipmentPanel
          equippedItemIds={equippedItemIds}
          items={availableEquipment}
          onDelete={handleRequestDelete}
          onEquip={handleEquip}
          onUnequip={handleUnequipItem}
        />
      </div>

      <ItemDeleteConfirmDialog
        itemName={pendingDelete?.name ?? null}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        open={pendingDelete !== null}
      />
    </div>
  );
}
