"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { KingdomMapDefinition } from "@idleking/game-core/level-editor";
import { inputClassName } from "./editor-shared";

export function KingdomDraftPanel({
  kingdomMap,
  onDeleteBuilding,
  onPatchBuilding,
}: {
  kingdomMap: KingdomMapDefinition;
  onDeleteBuilding: (id: string) => void;
  onPatchBuilding: (id: string, patch: { x?: number; y?: number }) => void;
}) {
  return (
    <section className="grid min-h-0 flex-1 gap-4 overflow-auto bg-[#0b0b0b] p-4">
      <div className="rounded-md border border-amber-200/30 bg-amber-500/10 p-3 font-ik-menu text-xs uppercase tracking-wide text-amber-100">
        Kingdom Draft — not used by live runtime yet
      </div>
      <p className="font-ik-body text-xs text-zinc-500">
        Prototype data only. This map is a standalone editable draft ({kingdomMap.status}, v{kingdomMap.version}) — it is
        not read by the live Kingdom (kingdom-hub-stage.tsx). Positions are approximate placeholders, not extracted from
        the real Kingdom.
      </p>

      <div>
        <h2 className="mb-2 font-ik-menu text-xs text-zinc-300">Buildings ({kingdomMap.buildings.length})</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {kingdomMap.buildings.map((building) => (
            <div className="grid gap-2 rounded-md border border-zinc-800 bg-zinc-950 p-3" key={building.id}>
              <div className="flex items-center justify-between">
                <span className="font-ik-menu text-xs text-zinc-100">{building.id}</span>
                <Button onClick={() => onDeleteBuilding(building.id)} size="sm" variant="ghost">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1 text-xs text-zinc-400">
                  X
                  <input
                    className={inputClassName()}
                    onChange={(event) => onPatchBuilding(building.id, { x: Number(event.target.value) })}
                    type="number"
                    value={building.x}
                  />
                </label>
                <label className="grid gap-1 text-xs text-zinc-400">
                  Y
                  <input
                    className={inputClassName()}
                    onChange={(event) => onPatchBuilding(building.id, { y: Number(event.target.value) })}
                    type="number"
                    value={building.y}
                  />
                </label>
              </div>
              {building.interaction ? (
                <p className="font-ik-body text-[0.65rem] text-zinc-500">
                  {building.interaction.interactionType} · {building.interaction.promptLabel} · r{building.interaction.radius}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-ik-menu text-xs text-zinc-300">NPCs ({kingdomMap.npcs.length})</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {kingdomMap.npcs.map((npc) => (
            <div className="grid gap-1 rounded-md border border-zinc-800 bg-zinc-950 p-3" key={npc.id}>
              <span className="font-ik-menu text-xs text-zinc-100">{npc.name}</span>
              <span className="font-ik-body text-[0.65rem] text-zinc-500">
                x{npc.x} y{npc.y} — {npc.interaction?.promptLabel ?? "no interaction"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-ik-menu text-xs text-zinc-300">Props ({kingdomMap.props.length})</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {kingdomMap.props.map((prop) => (
            <div className="grid gap-1 rounded-md border border-zinc-800 bg-zinc-950 p-3" key={prop.id}>
              <span className="font-ik-menu text-xs text-zinc-100">{prop.id}</span>
              <span className="font-ik-body text-[0.65rem] text-zinc-500">
                x{prop.x} y{prop.y}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
