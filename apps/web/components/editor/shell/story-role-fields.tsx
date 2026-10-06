"use client";

import { enemies as coreEnemies, getLevelScript, type LayoutObstacleKind } from "@idleking/game-core";
import type {
  MapCollision,
  MapEnemy,
  MapTrigger,
  PlayableMap,
  StoryGateCondition,
  StoryTriggerRole,
} from "@idleking/game-core/level-editor";

import { inputClassName, type Selection, type SelectedEntity } from "./editor-shared";

const OBSTACLE_KINDS: readonly LayoutObstacleKind[] = ["wall", "pillar", "ruin", "rock", "tomb", "crystal", "shelf", "coral"];

type Patch = Record<string, unknown>;

/** Fields an enemy takes from its archetype (the runtime reads the archetype; these keep the map readable). */
export function enemyPatchFromArchetype(archetypeId: string): Partial<MapEnemy> {
  const archetype = coreEnemies.getEnemyArchetype(archetypeId);
  if (!archetype) return { enemyId: archetypeId };
  const isBoss = archetype.tier === "boss";
  return {
    enemyId: archetype.id,
    name: archetype.name,
    stats: { hp: archetype.stats.hp, attack: archetype.stats.contactDamage, defense: 0, speed: archetype.stats.moveSpeed },
    behavior: isBoss ? "boss" : archetype.attack === "ranged" ? "ranged" : "chase",
    aggroRadius: archetype.stats.aggroRadius,
    isBoss: isBoss || undefined,
  };
}

function zoneIdsOf(map: PlayableMap): string[] {
  return map.triggers.flatMap((trigger) => (trigger.story?.kind === "zone" ? [trigger.story.zoneId] : []));
}

function defaultRole(kind: StoryTriggerRole["kind"], trigger: MapTrigger, map: PlayableMap, beatIds: readonly string[]): StoryTriggerRole {
  if (kind === "zone") return { kind: "zone", zoneId: trigger.id.replace(/^zone_/, ""), label: "Salle" };
  if (kind === "gate") return { kind: "gate", opensWhen: { kind: "zone_cleared", zoneId: zoneIdsOf(map)[0] ?? "" } };
  return { kind: "beat", beatId: beatIds[0] ?? "" };
}

function Select({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: readonly string[]; value: string }) {
  const values = options.includes(value) ? options : [value, ...options];
  return (
    <label className="col-span-2 grid gap-1 text-xs text-zinc-400">
      {label}
      <select className={inputClassName()} onChange={(event) => onChange(event.target.value)} value={value}>
        {values.map((option) => (
          <option key={option} value={option}>
            {option || "—"}
          </option>
        ))}
      </select>
    </label>
  );
}

function Text({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="col-span-2 grid gap-1 text-xs text-zinc-400">
      {label}
      <input className={inputClassName()} onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  );
}

function TriggerRoleFields({ map, onPatch, trigger, beatIds }: { map: PlayableMap; onPatch: (patch: Patch) => void; trigger: MapTrigger; beatIds: readonly string[] }) {
  const role = trigger.story;
  const setRole = (next: StoryTriggerRole | undefined) => onPatch({ story: next });
  const zoneIds = zoneIdsOf(map);

  return (
    <>
      <Select
        label="Story role"
        onChange={(kind) => setRole(kind === "none" ? undefined : defaultRole(kind as StoryTriggerRole["kind"], trigger, map, beatIds))}
        options={["none", "zone", "gate", "beat"]}
        value={role?.kind ?? "none"}
      />
      {role?.kind === "zone" ? (
        <>
          <Text label="Zone id" onChange={(zoneId) => setRole({ ...role, zoneId })} value={role.zoneId} />
          <Text label="Label" onChange={(label) => setRole({ ...role, label })} value={role.label ?? ""} />
          <Select
            label="Enemies spawn on beat (ambush)"
            onChange={(beatId) => {
              const { spawnOnBeat: _previous, ...rest } = role;
              setRole(beatId ? { ...rest, spawnOnBeat: beatId } : rest);
            }}
            options={["", ...beatIds]}
            value={role.spawnOnBeat ?? ""}
          />
        </>
      ) : null}
      {role?.kind === "gate" ? (
        <>
          <Select
            label="Opens when"
            onChange={(kind) => {
              const opensWhen: StoryGateCondition =
                kind === "beat_done" ? { kind: "beat_done", beatId: beatIds[0] ?? "" } : { kind: "zone_cleared", zoneId: zoneIds[0] ?? "" };
              setRole({ kind: "gate", opensWhen });
            }}
            options={["zone_cleared", "beat_done"]}
            value={role.opensWhen.kind}
          />
          {role.opensWhen.kind === "zone_cleared" ? (
            <Select label="Zone" onChange={(zoneId) => setRole({ kind: "gate", opensWhen: { kind: "zone_cleared", zoneId } })} options={zoneIds} value={role.opensWhen.zoneId} />
          ) : (
            <Select label="Beat" onChange={(beatId) => setRole({ kind: "gate", opensWhen: { kind: "beat_done", beatId } })} options={beatIds} value={role.opensWhen.beatId} />
          )}
        </>
      ) : null}
      {role?.kind === "beat" ? (
        <>
          <Select label="Script beat" onChange={(beatId) => setRole({ ...role, beatId })} options={beatIds} value={role.beatId} />
          <Select
            label="Also requires"
            onChange={(value) => {
              const { requires: _previous, ...rest } = role;
              if (value === "boss defeated") setRole({ ...rest, requires: { bossDefeated: true } });
              else if (value) setRole({ ...rest, requires: { zoneCleared: value.replace(/^zone cleared: /, "") } });
              else setRole(rest);
            }}
            options={["", "boss defeated", ...zoneIds.map((zoneId) => `zone cleared: ${zoneId}`)]}
            value={role.requires?.bossDefeated ? "boss defeated" : role.requires?.zoneCleared ? `zone cleared: ${role.requires.zoneCleared}` : ""}
          />
        </>
      ) : null}
    </>
  );
}

/**
 * Story-dungeon fields of the selected entity (see story/storyMapLayout.ts for how the runtime
 * reads them): trigger roles (room / gate / beat), obstacle kinds, enemy archetypes.
 */
export function StoryRoleFields({
  dungeonId,
  map,
  onPatch,
  selectedEntity,
  selection,
}: {
  dungeonId: string;
  map: PlayableMap;
  onPatch: (patch: Patch) => void;
  selectedEntity: SelectedEntity;
  selection: Selection;
}) {
  const beatIds = getLevelScript(dungeonId)?.beats.map((beat) => beat.id) ?? [];

  if (selection.kind === "trigger") {
    return <TriggerRoleFields beatIds={beatIds} map={map} onPatch={onPatch} trigger={selectedEntity as MapTrigger} />;
  }
  if (selection.kind === "collision") {
    const collision = selectedEntity as MapCollision;
    return <Select label="Obstacle kind" onChange={(kind) => onPatch({ kind })} options={OBSTACLE_KINDS} value={collision.kind ?? "wall"} />;
  }
  if (selection.kind === "enemy") {
    const enemy = selectedEntity as MapEnemy;
    return (
      <Select
        label="Enemy archetype"
        onChange={(archetypeId) => onPatch(enemyPatchFromArchetype(archetypeId))}
        options={coreEnemies.ENEMY_ARCHETYPES.map((archetype) => archetype.id)}
        value={enemy.enemyId}
      />
    );
  }
  return null;
}
