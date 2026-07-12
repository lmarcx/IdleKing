"use client";

import { ChevronRight, Plus } from "lucide-react";

import type { EditorDocumentIndexEntry } from "@/lib/editor-document-store";
import { STORY_ERA_GROUPS } from "@/lib/story-era-groups";
import { cn } from "@/lib/utils";
import { STORY_DUNGEON_REGISTRY, type StoryDungeonDefinition } from "@idleking/game-core";
import { hasCanonicalStoryMap } from "@idleking/game-core/level-editor";
import type { ActiveDocument, PlaceholderDocumentInfo } from "./editor-shared";

export type EraOrigin = "era_funebre" | "era_glaciaire";

const ERA_PLACEHOLDERS: readonly (PlaceholderDocumentInfo & { origin: EraOrigin })[] = [
  {
    id: "era_funebre",
    origin: "era_funebre",
    title: "Era Funèbre",
    note: "Era Funèbre dungeon content (Time Gate) is not wired in Editor V2 yet — the real dungeon pipeline is planned for V3. You can still create sandbox levels below for prototyping.",
  },
  {
    id: "era_glaciaire",
    origin: "era_glaciaire",
    title: "Era Glaciaire",
    note: "Era Glaciaire dungeon content (Time Gate) is not wired in Editor V2 yet — the real dungeon pipeline is planned for V3. You can still create sandbox levels below for prototyping.",
  },
];

const MODE_PLACEHOLDERS: readonly PlaceholderDocumentInfo[] = [
  {
    id: "mode_expedition",
    title: "Expedition placeholder",
    note: "Expedition content doesn't exist yet in the game — this entry is a reserved placeholder for a future mode.",
  },
];

const STORY_MAP_BADGE_STYLE: Record<"Local" | "Canon" | "No map", string> = {
  Local: "border border-emerald-300/40 text-emerald-200",
  Canon: "border border-sky-300/40 text-sky-200",
  "No map": "border border-amber-300/40 text-amber-200",
};

function TreeButton({
  active,
  badge,
  className,
  label,
  onClick,
}: {
  active: boolean;
  badge?: "Local" | "Canon" | "No map";
  className?: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded px-2 py-1 text-left font-ik-body text-xs",
        active ? "bg-zinc-100 text-zinc-950" : "text-zinc-300 hover:text-zinc-100",
        className
      )}
      onClick={onClick}
      type="button"
    >
      <ChevronRight className="h-3 w-3 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge ? (
        <span className={cn("shrink-0 rounded px-1 py-0.5 text-[0.55rem] uppercase tracking-wide", STORY_MAP_BADGE_STYLE[badge])}>
          {badge}
        </span>
      ) : null}
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
  activeStoryDungeonId,
  levelDocuments,
  onCreateSandboxLevel,
  onSelectAssets,
  onSelectKingdomStage,
  onSelectLevel,
  onSelectPlaceholder,
  onSelectStoryDungeon,
}: {
  activeDocument: ActiveDocument;
  activeStoryDungeonId: string | null;
  levelDocuments: readonly EditorDocumentIndexEntry[];
  onCreateSandboxLevel: (origin: EraOrigin) => void;
  onSelectAssets: () => void;
  onSelectKingdomStage: () => void;
  onSelectLevel: (id?: string) => void;
  onSelectPlaceholder: (info: PlaceholderDocumentInfo) => void;
  onSelectStoryDungeon: (dungeonId: string) => void;
}) {
  const unassignedLevels = levelDocuments.filter((doc) => !doc.origin && doc.id !== "test_map_01");

  return (
    <div className="grid gap-3 border-b border-zinc-800 p-3">
      <p className="font-ik-menu text-[0.65rem] uppercase tracking-wide text-zinc-300">Project</p>

      <TreeSection title="Kingdom">
        <TreeButton active={activeDocument.type === "kingdom_stage"} label="Kingdom Stage" onClick={onSelectKingdomStage} />
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

      <TreeSection title="Story">
        {STORY_ERA_GROUPS.filter((group) => !group.teaser).map((group) => {
          const dungeons = group.dungeonIds
            .map((id) => STORY_DUNGEON_REGISTRY.find((dungeon) => dungeon.id === id))
            .filter((dungeon): dungeon is StoryDungeonDefinition => Boolean(dungeon));
          return (
            <div className="grid gap-0.5" key={group.id}>
              <p className="px-2 py-0.5 font-ik-body text-[0.68rem] uppercase tracking-wide text-zinc-500">{group.title}</p>
              <div className="ml-4 grid gap-0.5 border-l border-zinc-800 pl-2">
                {dungeons.map((dungeon) => {
                  const hasLocal = levelDocuments.some((doc) => doc.id === dungeon.id);
                  const badge: "Local" | "Canon" | "No map" = hasLocal
                    ? "Local"
                    : hasCanonicalStoryMap(dungeon.id)
                      ? "Canon"
                      : "No map";
                  return (
                    <TreeButton
                      active={activeStoryDungeonId === dungeon.id}
                      badge={badge}
                      key={dungeon.id}
                      label={`${dungeon.title} / ${dungeon.id}`}
                      onClick={() => onSelectStoryDungeon(dungeon.id)}
                    />
                  );
                })}
                <button
                  className="flex items-center gap-1.5 rounded px-2 py-1 text-left font-ik-body text-[0.68rem] text-zinc-500 hover:text-zinc-200"
                  onClick={() => onCreateSandboxLevel(group.id === "era_glaciaire" ? "era_glaciaire" : "era_funebre")}
                  type="button"
                >
                  <Plus className="h-3 w-3 shrink-0" />
                  Nouveau niveau sandbox
                </button>
              </div>
            </div>
          );
        })}
      </TreeSection>

      <TreeSection title="Eras">
        {ERA_PLACEHOLDERS.map((era) => {
          const eraLevels = levelDocuments.filter((doc) => doc.origin === era.origin);
          return (
            <div className="grid gap-0.5" key={era.id}>
              <TreeButton
                active={activeDocument.type === "placeholder" && activeDocument.id === era.id}
                label={era.title}
                onClick={() => onSelectPlaceholder(era)}
              />
              <div className="ml-4 grid gap-0.5 border-l border-zinc-800 pl-2">
                {eraLevels.map((doc) => (
                  <TreeButton
                    active={activeDocument.type === "playable_map" && activeDocument.id === doc.id}
                    key={doc.id}
                    label={doc.title}
                    onClick={() => onSelectLevel(doc.id)}
                  />
                ))}
                <button
                  className="flex items-center gap-1.5 rounded px-2 py-1 text-left font-ik-body text-[0.68rem] text-zinc-500 hover:text-zinc-200"
                  onClick={() => onCreateSandboxLevel(era.origin)}
                  type="button"
                >
                  <Plus className="h-3 w-3 shrink-0" />
                  Nouveau niveau
                </button>
              </div>
            </div>
          );
        })}
      </TreeSection>

      <TreeSection title="Levels">
        <TreeButton
          active={activeDocument.type === "playable_map" && activeDocument.id === "test_map_01"}
          label="Test Map 01"
          onClick={() => onSelectLevel()}
        />
        {unassignedLevels.map((doc) => (
          <TreeButton
            active={activeDocument.type === "playable_map" && activeDocument.id === doc.id}
            key={doc.id}
            label={doc.title}
            onClick={() => onSelectLevel(doc.id)}
          />
        ))}
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
