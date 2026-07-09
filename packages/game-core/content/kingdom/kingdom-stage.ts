import type { KingdomStageDefinition } from "../../level-editor/kingdom-stage.js";

/**
 * Canonical Kingdom Stage definition — the source of truth the Kingdom Hub runtime
 * (apps/web/components/game/kingdom/kingdom-hub-stage.tsx) is migrating toward reading,
 * one hardcoded value at a time (see the Kingdom Stage migration plan).
 *
 * Phase A snapshot: positions, interaction radii, and colliders below were extracted
 * directly from kingdom-hub-stage.tsx's current constants (KINGDOM_HUB_LAYOUT, the
 * *_POSITION consts, the `interactables` array, and the `solidColliders` array built via
 * createGroundCollider). Nothing in the runtime reads this file yet — kingdom-hub-stage.tsx
 * is untouched in this phase.
 *
 * Known gaps / uncertainties (do not treat as resolved):
 * - CORNUCOPIA is DEV_MODE-only in the real runtime (visual, collider, and interactable are
 *   all gated behind `if (DEV_MODE)`). This schema has no devOnly flag yet, so it is listed
 *   here as an always-present building — to be reconciled when interaction dispatch migrates.
 * - FARM's interactionType is approximated as "open_building_modal"; the real handler
 *   (openFarmSlot) drives a bespoke minigame panel, not a generic building modal.
 * - Boto's interactionType is approximated as "custom_trigger"; the real handler opens a
 *   bespoke in-scene KingdomOverlay, which has no dedicated InteractionType yet.
 * - NPC assetId values ("villager_simple_01") are placeholders: the real Kingdom draws NPCs
 *   via geometric-figure.ts (createFigureGraphics), not the GeometricAsset registry.
 * - props: [] — no discrete decorative props were identified in kingdom-hub-stage.tsx (the
 *   ground/plaza visuals are drawn procedurally via drawGroundGrid, not as placed entities).
 * - colliders: [] (top-level, freestanding) — every real collider is per-building; there is
 *   no freestanding collider unrelated to a building, unlike the custom-map editor's
 *   manual_wall_01-style entries.
 */
export const KINGDOM_STAGE_DEFINITION: KingdomStageDefinition = {
  id: "kingdom_stage",
  name: "Kingdom Stage",
  status: "canon",
  version: 1,
  buildings: [
    {
      id: "FORUM",
      assetId: "forum",
      x: 900,
      y: 1033,
      collision: { type: "box", x: 810, y: 1018.5, width: 180, height: 81 },
      interaction: { interactionType: "open_building_modal", interactionTargetId: "FORUM", promptLabel: "Forum", radius: 138 },
    },
    {
      id: "TEMPLE",
      assetId: "temple",
      x: 1418,
      y: 857,
      collision: { type: "box", x: 1345.4, y: 838.2, width: 145.2, height: 81.6 },
      interaction: { interactionType: "open_building_modal", interactionTargetId: "TEMPLE", promptLabel: "Temple", radius: 122 },
    },
    {
      id: "MINE",
      assetId: "mine",
      x: 765,
      y: 232,
      collision: { type: "box", x: 687.3, y: 216, width: 155.4, height: 68 },
      interaction: { interactionType: "open_building_modal", interactionTargetId: "MINE", promptLabel: "Mine", radius: 116 },
    },
    {
      id: "KITCHEN",
      assetId: "kitchen",
      x: 585,
      y: 540,
      collision: { type: "box", x: 523.8, y: 527.6, width: 122.4, height: 60.8 },
      interaction: { interactionType: "open_building_modal", interactionTargetId: "KITCHEN", promptLabel: "Kitchen", radius: 108 },
    },
    {
      id: "FORGE",
      assetId: "forge",
      x: 1035,
      y: 232,
      collision: { type: "box", x: 968.5, y: 216.3, width: 133, height: 71.4 },
      interaction: { interactionType: "open_forge", interactionTargetId: "FORGE", promptLabel: "Forge", radius: 112 },
    },
    {
      id: "BANK",
      assetId: "bank",
      x: 1416,
      y: 356,
      collision: { type: "box", x: 1357, y: 338, width: 118, height: 58 },
      interaction: { interactionType: "open_bank", interactionTargetId: "BANK", promptLabel: "Bank", radius: 104 },
    },
    {
      id: "MARKET",
      assetId: "market",
      x: 376,
      y: 849,
      collision: { type: "box", x: 311, y: 837, width: 130, height: 54 },
      interaction: { interactionType: "open_market", interactionTargetId: "MARKET", promptLabel: "Market", radius: 112 },
    },
    {
      id: "FARM",
      assetId: "farm",
      x: 1210,
      y: 662,
      collision: { type: "box", x: 1123.6, y: 652, width: 172.8, height: 60 },
      interaction: { interactionType: "open_building_modal", interactionTargetId: "FARM", promptLabel: "Farm", radius: 104 },
    },
    {
      // DEV_MODE-only in the real runtime today — see the file-level note above.
      id: "CORNUCOPIA",
      assetId: "cornucopia",
      x: 1012,
      y: 620,
      collision: { type: "box", x: 971.2, y: 609.22, width: 81.6, height: 45.56 },
      interaction: { interactionType: "custom_trigger", interactionTargetId: "CORNUCOPIA", promptLabel: "Cornucopia", radius: 118 },
    },
    {
      id: "TIME_GATE",
      assetId: "portal",
      x: 772,
      y: 622,
      collision: null,
      interaction: { interactionType: "open_time_gate", interactionTargetId: "TIME_GATE", promptLabel: "Portail", radius: 112 },
    },
  ],
  npcs: [
    {
      id: "npc_villager_01",
      assetId: "villager_simple_01",
      name: "Villageois Errant",
      x: 854,
      y: 726,
      interaction: { interactionType: "start_dialogue", interactionTargetId: "npc_villager_01", promptLabel: "Villageois Errant", radius: 96 },
    },
    {
      id: "npc_boto",
      assetId: "villager_simple_01",
      name: "Boto",
      x: 958,
      y: 730,
      interaction: { interactionType: "custom_trigger", interactionTargetId: "npc_boto", promptLabel: "Boto", radius: 92 },
    },
  ],
  props: [],
  colliders: [],
  spawn: { x: 900, y: 640 },
};
