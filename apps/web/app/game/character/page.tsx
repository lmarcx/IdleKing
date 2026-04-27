"use client";

import { useMemo } from "react";

import { AvailableEquipmentPanel } from "@/components/game/character/available-equipment-panel";
import { CharacterStatsPanel } from "@/components/game/character/character-stats-panel";
import { EquipmentDoll } from "@/components/game/character/equipment-doll";
import type { CharacterStat, EquippedItems } from "@/components/game/character/types";
import { useGameStore } from "@/store/game-store";

export default function CharacterPage() {
  const progression = useGameStore((s) => s.state.progression);
  const availableEquipment = useGameStore((s) => s.state.inventory.items);

  const stats = useMemo<CharacterStat[]>(
    () => [
      { label: "Player Level", value: progression.playerLevel },
      { label: "Player XP", value: progression.playerXp },
      {
        helper: "Combat power will use equipped items when loadout is wired.",
        label: "POWER",
        placeholder: true,
        value: "TBD",
      },
      {
        helper: "Placeholder until character combat stats are exposed by game-core.",
        label: "HP",
        placeholder: true,
        value: "TBD",
      },
      {
        helper: "Placeholder until character combat stats are exposed by game-core.",
        label: "ATK",
        placeholder: true,
        value: "TBD",
      },
      {
        helper: "Placeholder until character combat stats are exposed by game-core.",
        label: "DEF",
        placeholder: true,
        value: "TBD",
      },
    ],
    [progression.playerLevel, progression.playerXp]
  );

  const equippedItems = useMemo<EquippedItems>(() => ({}), []);

  return (
    <div className="space-y-4">
      <h1 className="font-ik-title text-2xl font-semibold">Character</h1>

      <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)_320px]">
        <CharacterStatsPanel stats={stats} />
        <EquipmentDoll equippedItems={equippedItems} />
        <AvailableEquipmentPanel items={availableEquipment} />
      </div>
    </div>
  );
}
