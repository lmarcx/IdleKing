#!/usr/bin/env node
// Reads a <dungeonId>.generated.json file (produced by the editor's "Export Canonical Story
// Map" button for a local map linked to a real Story dungeon), validates it, verifies the
// dungeonId exists in STORY_DUNGEON_REGISTRY, and reports a summary + per-entity-id diff against
// any already-promoted canonical map for that dungeon. Never writes anything unless --apply is
// passed explicitly.
//
// Usage:
//   node scripts/story-map-promote.mjs <path-to-dungeonId.generated.json>            (dry run: validate + diff only)
//   node scripts/story-map-promote.mjs <path-to-dungeonId.generated.json> --apply    (also writes the canonical files)
//
// On --apply, writes packages/game-core/content/story/maps/<dungeonId>.ts (a new file exporting
// `<DUNGEON_ID>_MAP: PlayableMap`) and registers it in that directory's index.ts via the
// STORY_MAP_IMPORTS_MARKER / STORY_MAP_REGISTRY_ENTRIES_MARKER comments. Re-running --apply for
// the same dungeonId updates its entry in place rather than duplicating it. Requires
// packages/game-core to be built (npm run build:game-core) since it imports the compiled
// @idleking/game-core entry points.
//
// This never mutates STORY_DUNGEON_REGISTRY, never grants rewards, and never calls
// completeDungeon -- it only ever writes spatial PlayableMap data.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(webRoot, "..", "..");
const storyMapsDir = path.join(repoRoot, "packages", "game-core", "content", "story", "maps");
const indexFilePath = path.join(storyMapsDir, "index.ts");
const IMPORTS_MARKER = "// STORY_MAP_IMPORTS_MARKER";
const ENTRIES_MARKER = "// STORY_MAP_REGISTRY_ENTRIES_MARKER";

const DIFFED_ENTITY_KEYS = ["objects", "buildings", "npcs", "enemies", "collisions", "triggers", "puzzles"];

function fail(message) {
  console.error(`[story-map-promote] ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  let apply = false;
  let file = null;
  for (const arg of argv) {
    if (arg === "--apply") apply = true;
    else if (!file) file = arg;
  }
  return { apply, file };
}

function constNameForDungeonId(dungeonId) {
  return `${dungeonId.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_MAP`;
}

function summarizeMap(map) {
  return {
    grid: `${map.grid.width}x${map.grid.height} / ${map.grid.cellSize}`,
    objects: map.objects.length,
    buildings: map.buildings.length,
    npcs: map.npcs.length,
    enemies: map.enemies.length,
    collisions: map.collisions.length,
    triggers: map.triggers.length,
    puzzles: map.puzzles.length,
    spawns: map.spawns.length,
  };
}

function diffIds(currentEntities, exportedEntities) {
  const currentById = new Map(currentEntities.map((entity) => [entity.id, entity]));
  const exportedIds = new Set(exportedEntities.map((entity) => entity.id));
  const added = [];
  const changed = [];
  for (const entity of exportedEntities) {
    const existing = currentById.get(entity.id);
    if (!existing) added.push(entity.id);
    else if (JSON.stringify(existing) !== JSON.stringify(entity)) changed.push(entity.id);
  }
  const removed = currentEntities.filter((entity) => !exportedIds.has(entity.id)).map((entity) => entity.id);
  return { added, removed, changed };
}

async function main() {
  const { apply, file } = parseArgs(process.argv.slice(2));
  if (!file) {
    fail(
      "Missing path to an exported <dungeonId>.generated.json file. Export it first from the " +
        "editor (a Story-dungeon-linked map -> Export Canonical Story Map), then re-run with its " +
        "path, e.g.:\n  node scripts/story-map-promote.mjs ~/Downloads/prologue_wastelands.generated.json",
    );
  }
  const inputPath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(inputPath)) fail(`Exported file not found: ${inputPath}`);

  let exported;
  try {
    exported = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  } catch (error) {
    fail(`Could not parse ${inputPath} as JSON: ${error.message}`);
  }

  const { validatePlayableMap, getCanonicalStoryMap } = await import("@idleking/game-core/level-editor");
  const { getStoryDungeonDefinition } = await import("@idleking/game-core");

  const validation = validatePlayableMap(exported);
  if (!validation.ok) {
    fail(`Invalid PlayableMap document:\n${validation.errors.map((error) => `  - ${error}`).join("\n")}`);
  }

  const dungeonId = exported.id;
  const dungeon = getStoryDungeonDefinition(dungeonId);
  if (!dungeon) {
    fail(
      `"${dungeonId}" (map.id) is not a known Story dungeon -- it must exactly match an id in ` +
        "STORY_DUNGEON_REGISTRY (packages/game-core/story/progressionMvp.ts).",
    );
  }
  if (exported.mode !== "story") {
    fail(`Cannot promote: map.mode must be "story" (was "${exported.mode}").`);
  }

  const expectedFilename = `${dungeonId}.generated.json`;
  if (path.basename(inputPath) !== expectedFilename) {
    console.log(
      `[story-map-promote] Note: filename is "${path.basename(inputPath)}", expected "${expectedFilename}" ` +
        "for map.id -- proceeding using map.id as the dungeon id.",
    );
  }

  console.log(`[story-map-promote] ${inputPath} is a valid PlayableMap for dungeon "${dungeonId}" (${dungeon.title}).`);
  console.log(`[story-map-promote] Summary: ${JSON.stringify(summarizeMap(exported))}`);

  const currentCanonical = getCanonicalStoryMap(dungeonId);
  if (!currentCanonical) {
    console.log(`[story-map-promote] No canonical map exists yet for "${dungeonId}" -- this would be a new promotion.`);
  } else {
    for (const key of DIFFED_ENTITY_KEYS) {
      const { added, removed, changed } = diffIds(currentCanonical[key], exported[key]);
      if (added.length || removed.length || changed.length) {
        console.log(
          `[story-map-promote] ${key}: +${added.length} (${added.join(", ") || "-"}) ` +
            `-${removed.length} (${removed.join(", ") || "-"}) ~${changed.length} (${changed.join(", ") || "-"})`,
        );
      } else {
        console.log(`[story-map-promote] ${key}: no differences.`);
      }
    }
  }

  if (!apply) {
    console.log(
      "[story-map-promote] Dry run only -- no files were written. Re-run with --apply to write " +
        `packages/game-core/content/story/maps/${dungeonId}.ts and register it in index.ts.`,
    );
    return;
  }

  if (!fs.existsSync(indexFilePath)) fail(`Registry index not found: ${indexFilePath}`);
  const indexSource = fs.readFileSync(indexFilePath, "utf8");
  if (!indexSource.includes(IMPORTS_MARKER) || !indexSource.includes(ENTRIES_MARKER)) {
    fail(`Could not find the promotion markers in ${indexFilePath} -- refusing to write.`);
  }

  const constName = constNameForDungeonId(dungeonId);
  const dungeonFilePath = path.join(storyMapsDir, `${dungeonId}.ts`);
  const dungeonFileContent =
    `import type { PlayableMap } from "../../../level-editor/types.js";\n\n` +
    `export const ${constName}: PlayableMap = ${JSON.stringify(exported, null, 2)};\n`;
  fs.writeFileSync(dungeonFilePath, dungeonFileContent, "utf8");
  console.log(`[story-map-promote] Wrote ${path.relative(repoRoot, dungeonFilePath)}.`);

  const importLine = `import { ${constName} } from "./${dungeonId}.js";`;
  // Unindented: used both to insert after the (already-indented-in-source) ENTRIES_MARKER and to
  // fully replace an existing "  <dungeonId>: <const>," line (regex match includes its own indent).
  const entryLine = `${dungeonId}: ${constName},`;

  let nextIndexSource = indexSource;
  if (!nextIndexSource.includes(importLine)) {
    nextIndexSource = nextIndexSource.replace(IMPORTS_MARKER, `${IMPORTS_MARKER}\n${importLine}`);
  }
  const entryRegex = new RegExp(`^ {2}${dungeonId}: \\w+,$`, "m");
  nextIndexSource = entryRegex.test(nextIndexSource)
    ? nextIndexSource.replace(entryRegex, `  ${entryLine}`)
    : nextIndexSource.replace(ENTRIES_MARKER, `${entryLine}\n  ${ENTRIES_MARKER}`);

  fs.writeFileSync(indexFilePath, nextIndexSource, "utf8");
  console.log(`[story-map-promote] Updated ${path.relative(repoRoot, indexFilePath)}.`);
  console.log(
    "[story-map-promote] This only updated the local working tree -- nothing was committed. " +
      "Next: review the diff, run the game-core tests, then commit yourself.",
  );
}

await main();
