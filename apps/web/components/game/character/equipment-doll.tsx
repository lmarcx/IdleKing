import { GamePanel } from "@/components/ui/game-panel";

import { EquipmentSlot } from "./equipment-slot";
import { EQUIPMENT_SLOTS, type EquippedItems, type EquipmentSlotDefinition, type EquipmentSlotId } from "./types";

const SLOT_LAYOUT: Record<EquipmentSlotId, string> = {
  artifact: "left-[13%] top-[74%]",
  helmet: "left-1/2 top-[2%] -translate-x-1/2",
  necklace: "left-1/2 top-[20%] -translate-x-1/2",
  weapon: "left-[3%] top-[33%]",
  chest: "left-1/2 top-[38%] -translate-x-1/2",
  offhand: "right-[3%] top-[33%]",
  gloves: "left-[12%] top-[55%]",
  belt: "left-1/2 top-[59%] -translate-x-1/2",
  ring: "right-[13%] top-[74%]",
  boots: "left-1/2 bottom-[2%] -translate-x-1/2",
};

function getSlotDefinition(slotId: EquipmentSlotId): EquipmentSlotDefinition {
  const slot = EQUIPMENT_SLOTS.find((entry) => entry.id === slotId);
  if (!slot) throw new Error(`Unknown equipment slot: ${slotId}`);
  return slot;
}

export function EquipmentDoll({ equippedItems }: { equippedItems: EquippedItems }) {
  const orderedSlotIds = Object.keys(SLOT_LAYOUT) as EquipmentSlotId[];

  return (
    <GamePanel variant="character" className="min-h-[34rem] p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-ik-title text-lg font-semibold tracking-wide">Equipment Doll</h2>
        <span className="font-ik-menu text-[11px] uppercase tracking-wide text-muted-foreground">Loadout preview</span>
      </div>

      <div className="mt-4 grid min-h-[29rem] place-items-center">
        <div className="relative h-[460px] w-[min(100%,380px)]">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[78%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/5 blur-2xl" />

          <div className="absolute left-1/2 top-1/2 grid h-[72%] w-[58%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-stone-500/25 bg-black/20 shadow-[0_0_28px_rgba(15,23,42,0.45),inset_0_0_24px_rgba(158,135,82,0.08)]">
            <img
              alt="Roi dark fantasy"
              className="h-[92%] w-[92%] object-contain drop-shadow-[0_0_16px_rgba(201,166,84,0.14)]"
              src="/assets/character/character-placeholder.svg"
            />
          </div>

          {orderedSlotIds.map((slotId) => (
            <div className={`absolute h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem] ${SLOT_LAYOUT[slotId]}`} key={slotId}>
              <EquipmentSlot item={equippedItems[slotId]} slot={getSlotDefinition(slotId)} />
            </div>
          ))}
        </div>
      </div>
    </GamePanel>
  );
}
