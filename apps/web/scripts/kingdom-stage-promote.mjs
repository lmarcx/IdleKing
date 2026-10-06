#!/usr/bin/env node
// Reads a kingdom-stage.generated.json file (produced by the editor's "Export Canonical
// Kingdom Stage" button), validates it, and reports how it differs from the currently built
// canonical KINGDOM_STAGE_DEFINITION. Never writes anything unless --apply is passed explicitly.
//
// Usage:
//   node scripts/kingdom-stage-promote.mjs [path-to-kingdom-stage.generated.json]           (dry run: validate + diff only)
//   node scripts/kingdom-stage-promote.mjs [path-to-kingdom-stage.generated.json] --apply    (also rewrites the canonical file)
//
// Defaults to ./kingdom-stage.generated.json (relative to the current working directory) if
// no path is given. Requires packages/game-core to be built (npm run build:game-core) since it
// imports the compiled @idleking/game-core/level-editor entry point.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(webRoot, "..", "..");
const canonicalFilePath = path.join(repoRoot, "packages", "game-core", "content", "kingdom", "kingdom-stage.ts");
const DEFINITION_MARKER = "export const KINGDOM_STAGE_DEFINITION: KingdomStageDefinition = ";

function fail(message) {
  console.error(`[kingdom-stage-promote] ${message}`);
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

function diffBuildingIds(current, exported) {
  const currentById = new Map(current.map((building) => [building.id, building]));
  const changed = [];
  for (const building of exported) {
    const existing = currentById.get(building.id);
    if (!existing || JSON.stringify(existing) !== JSON.stringify(building)) {
      changed.push(building.id);
    }
  }
  return changed;
}

async function main() {
  const { apply, file } = parseArgs(process.argv.slice(2));
  const inputPath = path.resolve(process.cwd(), file ?? "kingdom-stage.generated.json");

  if (!fs.existsSync(inputPath)) {
    fail(
      `Exported file not found: ${inputPath}\n` +
        "Export it first from the editor (Kingdom Stage -> Export Canonical Kingdom Stage), " +
        "then re-run with its path, e.g.:\n" +
        "  node scripts/kingdom-stage-promote.mjs ~/Downloads/kingdom-stage.generated.json",
    );
  }

  let exported;
  try {
    exported = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  } catch (error) {
    fail(`Could not parse ${inputPath} as JSON: ${error.message}`);
  }

  const { validateKingdomStageDefinition, KINGDOM_STAGE_DEFINITION } = await import("@idleking/game-core/level-editor");

  const validation = validateKingdomStageDefinition(exported);
  if (!validation.ok) {
    fail(`Invalid Kingdom Stage document:\n${validation.errors.map((error) => `  - ${error}`).join("\n")}`);
  }
  console.log(`[kingdom-stage-promote] ${inputPath} is a valid KingdomStageDefinition.`);

  const changedBuildings = diffBuildingIds(KINGDOM_STAGE_DEFINITION.buildings, exported.buildings);
  const changedNpcs = diffBuildingIds(KINGDOM_STAGE_DEFINITION.npcs, exported.npcs);
  console.log(
    changedBuildings.length > 0
      ? `[kingdom-stage-promote] Buildings differing from the currently built canonical data: ${changedBuildings.join(", ")}`
      : "[kingdom-stage-promote] No building differences from the currently built canonical data.",
  );
  console.log(
    changedNpcs.length > 0
      ? `[kingdom-stage-promote] NPCs differing from the currently built canonical data: ${changedNpcs.join(", ")}`
      : "[kingdom-stage-promote] No NPC differences from the currently built canonical data.",
  );

  if (!apply) {
    console.log(
      "[kingdom-stage-promote] Dry run only -- no files were written. Re-run with --apply to " +
        `replace the data block in ${path.relative(repoRoot, canonicalFilePath)}.`,
    );
    return;
  }

  if (!fs.existsSync(canonicalFilePath)) {
    fail(`Canonical file not found: ${canonicalFilePath}`);
  }

  const currentSource = fs.readFileSync(canonicalFilePath, "utf8");
  const markerIndex = currentSource.indexOf(DEFINITION_MARKER);
  if (markerIndex === -1) {
    fail(`Could not find "${DEFINITION_MARKER}" in ${canonicalFilePath} -- refusing to write.`);
  }

  const preamble = currentSource.slice(0, markerIndex);
  const dataBlock = `${DEFINITION_MARKER}${JSON.stringify(exported, null, 2)};\n`;
  fs.writeFileSync(canonicalFilePath, preamble + dataBlock, "utf8");
  console.log(`[kingdom-stage-promote] Wrote ${path.relative(repoRoot, canonicalFilePath)}.`);
  console.log(
    "[kingdom-stage-promote] This only updated the local working tree -- nothing was committed. " +
      "Next: review the diff, run the game-core tests, then commit yourself.",
  );
}

await main();
