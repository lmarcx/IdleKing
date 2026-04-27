import { GamePanel } from "@/components/ui/game-panel";

import { EquipmentSlot } from "./equipment-slot";
import { EQUIPMENT_SLOTS, type EquippedItems, type EquipmentSlotDefinition, type EquipmentSlotId } from "./types";

const SLOT_LAYOUT: Record<EquipmentSlotId, string> = {
  artifact: "col-start-2 row-start-1",
  helmet: "col-start-3 row-start-1",
  necklace: "col-start-4 row-start-1",
  weapon: "col-start-1 row-start-2",
  chest: "col-start-3 row-start-2",
  offhand: "col-start-5 row-start-2",
  gloves: "col-start-1 row-start-3",
  belt: "col-start-3 row-start-3",
  ring: "col-start-5 row-start-3",
  boots: "col-start-3 row-start-4",
};

function getSlotDefinition(slotId: EquipmentSlotId): EquipmentSlotDefinition {
  const slot = EQUIPMENT_SLOTS.find((entry) => entry.id === slotId);
  if (!slot) throw new Error(`Unknown equipment slot: ${slotId}`);
  return slot;
}

export function EquipmentDoll({ equippedItems }: { equippedItems: EquippedItems }) {
  const orderedSlotIds = Object.keys(SLOT_LAYOUT) as EquipmentSlotId[];

  return (
    <GamePanel variant="ornate" className="min-h-[34rem] p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-ik-title text-lg font-semibold tracking-wide">Equipment Doll</h2>
        <span className="font-ik-menu text-[11px] uppercase tracking-wide text-muted-foreground">Loadout preview</span>
      </div>

      <div className="relative mt-6 grid min-h-[28rem] grid-cols-[4.5rem_1fr_6rem_1fr_4.5rem] grid-rows-[4.5rem_1fr_4.5rem_4.5rem] gap-3">
        <div className="pointer-events-none absolute inset-x-[26%] bottom-20 top-16 rounded-full bg-cyan-300/5 blur-2xl" />

        <div className="col-start-2 col-end-5 row-start-2 row-end-4 grid place-items-center">
          <div className="relative grid h-full min-h-72 w-full max-w-72 place-items-center rounded-full border border-amber-300/20 bg-black/20 shadow-[0_0_40px_rgba(56,189,248,0.08),inset_0_0_24px_rgba(201,166,84,0.06)]">
            <img
              alt="Silhouette de personnage dark fantasy"
              className="h-[82%] w-[82%] object-contain drop-shadow-[0_0_18px_rgba(201,166,84,0.16)]"
              src="/assets/character/character-placeholder.svg"
            />
          </div>
        </div>

        {orderedSlotIds.map((slotId) => (
          <div className={SLOT_LAYOUT[slotId]} key={slotId}>
            <EquipmentSlot item={equippedItems[slotId]} slot={getSlotDefinition(slotId)} />
          </div>
        ))}
      </div>
    </GamePanel>
  );
}
