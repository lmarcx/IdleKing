"use client";

import { useCallback, useMemo, useState } from "react";

import { AvailableEquipmentPanel } from "@/components/game/character/available-equipment-panel";
import { CharacterStatsPanel } from "@/components/game/character/character-stats-panel";
import { EquipmentDoll } from "@/components/game/character/equipment-doll";
import { calculateCharacterStats, FAKE_EQUIPMENT } from "@/components/game/character/fake-equipment";
import type { CharacterEquipment, CharacterStat, EquipmentSlotId, EquippedItems } from "@/components/game/character/types";
import { useGameStore } from "@/store/game-store";

export default function CharacterPage() {
  const progression = useGameStore((s) => s.state.progression);
  const [equippedItems, setEquippedItems] = useState<EquippedItems>({});
  const characterStats = useMemo(() => calculateCharacterStats(equippedItems), [equippedItems]);

  const stats = useMemo<CharacterStat[]>(
    () => [
      { label: "Player Level", value: progression.playerLevel },
      { label: "Player XP", value: progression.playerXp },
      { label: "POWER", value: characterStats.power },
      { label: "HP", value: characterStats.hp },
      { label: "ATK", value: characterStats.atk },
      { label: "DEF", value: characterStats.def },
    ],
    [characterStats.atk, characterStats.def, characterStats.hp, characterStats.power, progression.playerLevel, progression.playerXp]
  );

  const handleEquip = useCallback((item: CharacterEquipment) => {
    setEquippedItems((current) => ({
      ...current,
      [item.slot]: item,
    }));
  }, []);

  const handleUnequip = useCallback((slot: EquipmentSlotId) => {
    setEquippedItems((current) => {
      const next = { ...current };
      delete next[slot];
      return next;
    });
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="font-ik-title text-2xl font-semibold">Character</h1>

      <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)_320px]">
        <CharacterStatsPanel stats={stats} />
        <EquipmentDoll equippedItems={equippedItems} onUnequip={handleUnequip} />
        <AvailableEquipmentPanel
          equippedItems={equippedItems}
          items={FAKE_EQUIPMENT}
          onEquip={handleEquip}
          onUnequip={handleUnequip}
        />
      </div>
    </div>
  );
}
