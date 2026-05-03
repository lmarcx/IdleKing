import { GamePanel } from "@/components/ui/game-panel";

import { EquipmentSlot } from "./equipment-slot";
import { EQUIPMENT_SLOTS, type EquippedItems, type EquipmentSlotDefinition, type EquipmentSlotId } from "./types";

const ARMOR_SLOT_IDS: EquipmentSlotId[] = ["helmet", "chest", "gloves", "belt", "boots"];
const ACCESSORY_SLOT_IDS: EquipmentSlotId[] = ["weapon", "offhand", "necklace", "artifact"];

function getSlotDefinition(slotId: EquipmentSlotId): EquipmentSlotDefinition {
  const slot = EQUIPMENT_SLOTS.find((entry) => entry.id === slotId);
  if (!slot) throw new Error(`Unknown equipment slot: ${slotId}`);
  return slot;
}

export function EquipmentDoll({
  equippedItems,
  onUnequip,
}: {
  equippedItems: EquippedItems;
  onUnequip: (slot: EquipmentSlotId) => void;
}) {
  return (
    <GamePanel variant="character" className="min-h-[34rem] p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-ik-title text-lg font-semibold tracking-wide">Equipment Doll</h2>
        <span className="font-ik-menu text-[11px] uppercase tracking-wide text-muted-foreground">Loadout preview</span>
      </div>

      <div className="mt-4 grid min-h-[29rem] place-items-center">
        <div className="grid w-full max-w-[420px] grid-cols-[3.25rem_minmax(0,1fr)_3.25rem] items-center gap-4 sm:grid-cols-[3.5rem_minmax(0,1fr)_3.5rem] sm:gap-6">
          <div className="grid justify-items-center gap-3">
            {ARMOR_SLOT_IDS.map((slotId) => (
              <div className="h-12 w-12 sm:h-[52px] sm:w-[52px]" key={slotId}>
                <EquipmentSlot item={equippedItems[slotId]} onUnequip={onUnequip} slot={getSlotDefinition(slotId)} />
              </div>
            ))}
          </div>

          <div className="relative grid min-h-[390px] place-items-center">
            <div className="absolute left-1/2 top-1 h-12 w-12 -translate-x-1/2 sm:h-[52px] sm:w-[52px]">
              <EquipmentSlot item={equippedItems.cape} onUnequip={onUnequip} slot={getSlotDefinition("cape")} />
            </div>
            <img
              alt="Roi dark fantasy"
              className="mt-10 h-[min(72vw,350px)] max-h-[350px] w-full max-w-[230px] object-contain drop-shadow-[0_0_14px_rgba(201,166,84,0.12)]"
              src="/assets/character/character-placeholder.svg"
            />
          </div>

          <div className="grid justify-items-center gap-3">
            {ACCESSORY_SLOT_IDS.map((slotId) => (
              <div className="h-12 w-12 sm:h-[52px] sm:w-[52px]" key={slotId}>
                <EquipmentSlot item={equippedItems[slotId]} onUnequip={onUnequip} slot={getSlotDefinition(slotId)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </GamePanel>
  );
}
