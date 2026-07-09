import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const pagePath = path.join(root, "app", "game", "kingdom", "page.tsx");
const stagePath = path.join(root, "components", "game", "kingdom", "kingdom-hub-stage.tsx");

function fail(message) {
  console.error(`[kingdom-route] ${message}`);
  process.exitCode = 1;
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function assertIncludes(content, needle, label) {
  if (!content.includes(needle)) {
    fail(`${label} is missing required content: ${needle}`);
  }
}

function assertNotIncludes(content, needle, label) {
  if (content.includes(needle)) {
    fail(`${label} must not contain legacy/flagged content: ${needle}`);
  }
}

const page = readText(pagePath);
const stage = readText(stagePath);

assertIncludes(page, 'import { KingdomHubStage } from "@/components/game/kingdom/kingdom-hub-stage";', pagePath);
assertIncludes(page, "<KingdomHubStage />", pagePath);

// The kingdom hub has been drawn procedurally (geometric figures/world/buildings) since the
// new-minimalist-design rework — there is no PNG/manifest asset pipeline to load anymore.
assertIncludes(stage, 'from "@/components/game/shared/geometric-world"', stagePath);
assertIncludes(stage, "function drawWorld(container: PIXI.Container)", stagePath);

const forbiddenStageTokens = [
  "agentSpriteForgeMap",
  "agent-sprite-forge",
  "AGENT_SPRITE_FORGE",
  "KingdomHubMapVariant",
  "KINGDOM_HUB_MAP_VARIANT",
  "getRequestedHubMapVariant",
  "localStorage",
  "process.env",
  "NODE_ENV",
  "searchParams",
  "URLSearchParams",
  "next/dynamic",
  "dynamic(",
  "falling back to default",
  'mapVariant = "default"',
  "PIXI.TilingSprite",
  "/assets/kingdom-hub/tile_",
];

for (const token of forbiddenStageTokens) {
  assertNotIncludes(stage, token, stagePath);
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("[kingdom-route] /game/kingdom is locked to the canonical procedural Kingdom Hub stage.");
