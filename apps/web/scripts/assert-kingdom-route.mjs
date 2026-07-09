import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const pagePath = path.join(root, "app", "game", "kingdom", "page.tsx");
const stagePath = path.join(root, "components", "game", "kingdom", "kingdom-hub-stage.tsx");
const manifestPath = path.join(root, "public", "assets", "kingdom", "agent-sprite-forge", "manifest.json");

function fail(message) {
  console.error(`[kingdom-route] ${message}`);
  process.exitCode = 1;
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function readJson(filePath) {
  return JSON.parse(readText(filePath));
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

function assertExactCasePath(filePath) {
  const absolutePath = path.resolve(filePath);
  const parsed = path.parse(absolutePath);
  let current = parsed.root;
  const segments = path.relative(parsed.root, absolutePath).split(path.sep).filter(Boolean);

  for (const segment of segments) {
    if (!fs.existsSync(current)) {
      fail(`Missing path while checking asset case: ${current}`);
      return;
    }

    const entries = fs.readdirSync(current);
    if (!entries.includes(segment)) {
      fail(`Path case mismatch or missing segment "${segment}" under ${current}`);
      return;
    }
    current = path.join(current, segment);
  }

  if (!fs.existsSync(current)) {
    fail(`Missing required asset: ${current}`);
  }
}

function publicAssetPath(publicUrl) {
  if (typeof publicUrl !== "string" || !publicUrl.startsWith("/assets/")) {
    fail(`Invalid public asset URL: ${String(publicUrl)}`);
    return null;
  }

  return path.join(root, "public", ...publicUrl.slice(1).split("/"));
}

function assertPublicAsset(publicUrl) {
  const filePath = publicAssetPath(publicUrl);
  if (filePath) {
    assertExactCasePath(filePath);
  }
}

const page = readText(pagePath);
const stage = readText(stagePath);
const manifest = readJson(manifestPath);

assertIncludes(page, 'import { KingdomHubStage } from "@/components/game/kingdom/kingdom-hub-stage";', pagePath);
assertIncludes(page, "<KingdomHubStage />", pagePath);
assertIncludes(stage, 'const AGENT_SPRITE_FORGE_MANIFEST_PATH = "/assets/kingdom/agent-sprite-forge/manifest.json";', stagePath);
assertIncludes(stage, "function drawWorld(container: PIXI.Container, textures: HubTextures)", stagePath);

const forbiddenStageTokens = [
  "agentSpriteForgeMap",
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

const forbiddenManifestKeys = ["flag", "fallbackVariant"];
for (const key of forbiddenManifestKeys) {
  if (Object.hasOwn(manifest.integration ?? {}, key)) {
    fail(`Manifest integration must not expose ${key}.`);
  }
}

const assets = manifest.assets ?? {};
assertPublicAsset(assets.groundBackgroundLayer);
assertPublicAsset(assets.propsManifest);
assertPublicAsset(assets.collision);
assertPublicAsset(assets.zones);

const propsManifestPath = publicAssetPath(assets.propsManifest);
if (propsManifestPath) {
  const propsManifest = readJson(propsManifestPath);
  for (const prop of propsManifest.props ?? []) {
    assertPublicAsset(prop.image);
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("[kingdom-route] /game/kingdom is locked to the canonical Agent Sprite Forge stage.");
