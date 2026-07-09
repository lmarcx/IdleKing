"use client";

import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ActiveDocument, PlaceholderDocumentInfo } from "./editor-shared";

const ERA_PLACEHOLDERS: readonly PlaceholderDocumentInfo[] = [
  {
    id: "era_funebre",
    title: "Era Funèbre",
    note: "Era Funèbre levels are not wired in Editor V2 yet — the Time Gate / dungeon content pipeline is planned for V3.",
  },
  {
    id: "era_glaciaire",
    title: "Era Glaciaire",
    note: "Era Glaciaire levels are not wired in Editor V2 yet — the Time Gate / dungeon content pipeline is planned for V3.",
  },
];

const MODE_PLACEHOLDERS: readonly PlaceholderDocumentInfo[] = [
  { id: "mode_story", title: "Story", note: "Story mode editing isn't wired in Editor V2 yet — planned for V3." },
  {
    id: "mode_expedition",
    title: "Expedition placeholder",
    note: "Expedition content doesn't exist yet in the game — this entry is a reserved placeholder for a future mode.",
  },
];

function TreeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded px-2 py-1 text-left font-ik-body text-xs",
        active ? "bg-zinc-100 text-zinc-950" : "text-zinc-300 hover:text-zinc-100"
      )}
      onClick={onClick}
      type="button"
    >
      <ChevronRight className="h-3 w-3 shrink-0" />
      {label}
    </button>
  );
}

function TreeSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div>
      <p className="mb-1 font-ik-menu text-[0.62rem] uppercase tracking-wide text-zinc-500">{title}</p>
      <div className="grid gap-0.5 pl-1">{children}</div>
    </div>
  );
}

export function ProjectTree({
  activeDocument,
  onSelectAssets,
  onSelectKingdomDraft,
  onSelectLevel,
  onSelectPlaceholder,
}: {
  activeDocument: ActiveDocument;
  onSelectAssets: () => void;
  onSelectKingdomDraft: () => void;
  onSelectLevel: () => void;
  onSelectPlaceholder: (info: PlaceholderDocumentInfo) => void;
}) {
  return (
    <div className="grid gap-3 border-b border-zinc-800 p-3">
      <p className="font-ik-menu text-[0.65rem] uppercase tracking-wide text-zinc-300">Project</p>

      <TreeSection title="Kingdom">
        <TreeButton active={activeDocument.type === "kingdom_draft"} label="Kingdom Draft" onClick={onSelectKingdomDraft} />
      </TreeSection>

      <TreeSection title="Modes">
        {MODE_PLACEHOLDERS.map((item) => (
          <TreeButton
            active={activeDocument.type === "placeholder" && activeDocument.id === item.id}
            key={item.id}
            label={item.title}
            onClick={() => onSelectPlaceholder(item)}
          />
        ))}
      </TreeSection>

      <TreeSection title="Eras">
        {ERA_PLACEHOLDERS.map((item) => (
          <TreeButton
            active={activeDocument.type === "placeholder" && activeDocument.id === item.id}
            key={item.id}
            label={item.title}
            onClick={() => onSelectPlaceholder(item)}
          />
        ))}
      </TreeSection>

      <TreeSection title="Levels">
        <TreeButton
          active={activeDocument.type === "playable_map" && activeDocument.id === "test_map_01"}
          label="Test Map 01"
          onClick={onSelectLevel}
        />
      </TreeSection>

      <button
        aria-pressed={activeDocument.type === "asset_collection"}
        className={cn(
          "flex items-center gap-1.5 rounded px-2 py-1 text-left font-ik-menu text-[0.62rem] uppercase tracking-wide",
          activeDocument.type === "asset_collection" ? "bg-zinc-100 text-zinc-950" : "text-zinc-300 hover:text-zinc-100"
        )}
        onClick={onSelectAssets}
        type="button"
      >
        <ChevronRight className="h-3 w-3 shrink-0" />
        Assets
      </button>
    </div>
  );
}
