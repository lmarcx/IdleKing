import * as PIXI from "pixi.js";

import { BW } from "@/components/game/shared/geometric-figure";
import type { enemies } from "@idleking/game-core";

type EnemySilhouette = enemies.EnemySilhouette;
type EnemyTier = enemies.EnemyTier;

/**
 * Enemy silhouettes — one readable B&W shape per family (ENEMIES_DATABASE_V2) and per boss.
 * Same local space as geometric-figure: feet at y=0, top near y=-100, facing +x, so
 * figureScaleFor() and the hit-flash/lunge code keep working unchanged.
 *
 * Grammar: hostiles are black fills with white outlines (the player's negative); elites get a
 * hollow halo, bosses a heavier outline. Shapes, not colour, carry identity.
 */
const LINE = { color: BW.white, width: 3 } as const;
const THIN = { color: BW.white, width: 2 } as const;

function drawShade(g: PIXI.Graphics) {
  // Ombres de Guerre: hooded warrior smoke, ragged hem, slit eye.
  g.poly([-22, 0, -14, -12, -8, 0, 0, -10, 8, 0, 14, -12, 22, 0, 18, -60, 0, -92, -18, -60]).fill(BW.black).stroke(LINE);
  g.moveTo(-2, -70).lineTo(12, -70).stroke(THIN);
}

function drawWisp(g: PIXI.Graphics) {
  // Spectres des Ténèbres: floating teardrop with a trailing tail, hollow eyes.
  g.poly([0, -98, 22, -66, 18, -38, 6, -22, 10, -8, 0, -14, -10, -4, -8, -24, -20, -40, -22, -66]).fill(BW.black).stroke(LINE);
  g.circle(-4, -66, 4).fill(BW.white);
  g.circle(10, -66, 4).fill(BW.white);
}

function drawSoul(g: PIXI.Graphics) {
  // Âmes Perdues: small hunched flame, hands reaching forward.
  g.poly([0, -76, 16, -48, 14, -16, -14, -16, -16, -48]).fill(BW.black).stroke(LINE);
  g.poly([-10, -16, -6, 0, 6, 0, 10, -16]).fill(BW.gray0).stroke(THIN);
  g.moveTo(12, -40).lineTo(28, -34).moveTo(12, -32).lineTo(26, -24).stroke(THIN);
}

function drawSkeleton(g: PIXI.Graphics) {
  // Squelettes Funéraires: stick ribs, skull, bone limbs.
  g.moveTo(-8, 0).lineTo(-4, -34).moveTo(8, 0).lineTo(4, -34).stroke(LINE);
  g.moveTo(0, -34).lineTo(0, -66).stroke(LINE);
  for (const y of [-40, -48, -56]) g.moveTo(-12, y).lineTo(12, y).stroke(THIN);
  g.moveTo(-14, -62).lineTo(-26, -40).moveTo(14, -62).lineTo(28, -46).stroke(LINE);
  g.circle(0, -80, 12).fill(BW.black).stroke(LINE);
  g.rect(2, -84, 5, 5).fill(BW.white);
}

function drawDrake(g: PIXI.Graphics) {
  // Dragonoïdes Corrompus: hunched reptile, crest spikes, tail.
  g.poly([-24, -6, -36, 0, -22, -14, -18, -46, 6, -66, 24, -64, 34, -54, 20, -48, 18, -24, 22, 0, 8, 0, 4, -20, -10, -20, -10, 0, -18, 0]).fill(BW.black).stroke(LINE);
  g.poly([-8, -54, -4, -70, 2, -60, 6, -74, 10, -64]).stroke(THIN);
  g.circle(24, -58, 2.5).fill(BW.white);
}

function drawFrostWisp(g: PIXI.Graphics) {
  // Spectres du Froid: crystalline wisp — faceted body, shard crown.
  g.poly([0, -100, 14, -84, 22, -56, 10, -22, 0, -6, -10, -22, -22, -56, -14, -84]).fill(BW.black).stroke(LINE);
  g.moveTo(0, -100).lineTo(0, -6).moveTo(-22, -56).lineTo(22, -56).stroke({ color: BW.gray3, width: 1.5 });
  g.circle(6, -72, 3.5).fill(BW.white);
}

function drawMage(g: PIXI.Graphics) {
  // Mages Gelés: robe cone, pointed hood, staff with a frozen orb.
  g.poly([-20, 0, 20, 0, 6, -70, -6, -70]).fill(BW.black).stroke(LINE);
  g.poly([-10, -66, 10, -66, 0, -100]).fill(BW.black).stroke(LINE);
  g.moveTo(26, 2).lineTo(26, -84).stroke(LINE);
  g.poly([26, -96, 33, -88, 26, -80, 19, -88]).fill(BW.white);
}

function drawSiren(g: PIXI.Graphics) {
  // Sirènes: S-curve fish tail rising into a slender torso and long hair.
  g.poly([-20, -2, 0, -12, 18, -4, 8, -20, -6, -34, 2, -52, 8, -70, 0, -88, -12, -82, -10, -64, -16, -44, -10, -24]).fill(BW.black).stroke(LINE);
  g.moveTo(-12, -82).bezierCurveTo(-26, -70, -22, -56, -30, -46).stroke(THIN);
  g.circle(2, -78, 2.5).fill(BW.white);
}

function drawFish(g: PIXI.Graphics) {
  // Créatures Marines Gelées: low, wide fish/crustacean body.
  g.poly([-30, -22, -10, -40, 20, -38, 34, -22, 20, -6, -10, -4]).fill(BW.black).stroke(LINE);
  g.poly([-30, -22, -42, -36, -42, -8]).fill(BW.black).stroke(LINE);
  g.moveTo(-2, -38).lineTo(4, -6).moveTo(10, -38).lineTo(14, -6).stroke(THIN);
  g.circle(24, -26, 3).fill(BW.white);
}

function drawCrab(g: PIXI.Graphics) {
  g.ellipse(0, -26, 28, 18).fill(BW.black).stroke(LINE);
  g.moveTo(-20, -14).lineTo(-30, 0).moveTo(-8, -10).lineTo(-12, 0).moveTo(8, -10).lineTo(12, 0).moveTo(20, -14).lineTo(30, 0).stroke(THIN);
  g.poly([26, -40, 40, -50, 44, -40, 34, -34]).fill(BW.black).stroke(THIN);
  g.poly([-26, -40, -40, -50, -44, -40, -34, -34]).fill(BW.black).stroke(THIN);
}

function drawAberration(g: PIXI.Graphics) {
  // Aberrations d'Arathas: asymmetric lump, one oversized arm, stitched seam.
  g.poly([-18, 0, -22, -40, -8, -72, 14, -80, 22, -56, 16, -30, 20, 0]).fill(BW.black).stroke(LINE);
  g.poly([16, -56, 38, -40, 40, -14, 30, -12, 26, -34, 14, -40]).fill(BW.black).stroke(LINE);
  g.moveTo(-6, -70).lineTo(2, -20).stroke({ color: BW.gray3, width: 1.5 });
  for (const y of [-60, -48, -36, -24]) g.moveTo(-4, y).lineTo(6, y - 2).stroke({ color: BW.gray3, width: 1.5 });
  g.circle(10, -66, 3).fill(BW.white);
}

function drawAmalgam(g: PIXI.Graphics) {
  // Amalgames: a fused mass of shade heads.
  g.poly([-34, 0, -40, -34, -24, -64, 0, -76, 24, -68, 40, -40, 34, 0]).fill(BW.black).stroke({ color: BW.white, width: 4 });
  for (const [x, y, r] of [[-16, -50, 9], [10, -58, 11], [22, -30, 8], [-22, -24, 7], [0, -26, 6]] as const) {
    g.circle(x, y, r).stroke(THIN);
    g.circle(x + r * 0.3, y, 2).fill(BW.white);
  }
}

function drawDragon(g: PIXI.Graphics) {
  // Ombre du Dragon: winged silhouette, long neck.
  g.poly([-40, -40, -14, -56, -6, -30, 6, -30, 14, -56, 40, -40, 22, -36, 14, -16, 18, 0, -18, 0, -14, -16, -22, -36]).fill(BW.black).stroke({ color: BW.white, width: 4 });
  g.poly([6, -32, 14, -70, 28, -90, 40, -86, 30, -78, 22, -62]).fill(BW.black).stroke(LINE);
  g.circle(34, -86, 2.5).fill(BW.white);
}

function drawArchmage(g: PIXI.Graphics) {
  drawMage(g);
  // Corrupted halo of glyphs.
  g.circle(0, -84, 26).stroke({ color: BW.white, width: 2, alpha: 0.8 });
  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2;
    g.rect(Math.cos(angle) * 26 - 2, -84 + Math.sin(angle) * 26 - 2, 4, 4).fill(BW.white);
  }
}

function drawRainLord(g: PIXI.Graphics) {
  // Seigneur de la Pluie Déchu: duelist with a long cape and trident, rain streaks.
  g.poly([-14, 0, -8, -44, -18, -64, 0, -70, 18, -64, 8, -44, 14, 0]).fill(BW.black).stroke(LINE);
  g.poly([-18, -64, -34, -8, -22, -4]).fill(BW.gray0).stroke(THIN);
  g.circle(0, -80, 10).fill(BW.black).stroke(LINE);
  g.moveTo(24, 4).lineTo(24, -96).moveTo(16, -88).lineTo(16, -100).moveTo(32, -88).lineTo(32, -100).moveTo(16, -88).lineTo(32, -88).stroke(LINE);
  for (const x of [-30, -6, 40]) g.moveTo(x, -104).lineTo(x - 4, -94).stroke({ color: BW.gray3, width: 1.5 });
}

function drawQueen(g: PIXI.Graphics) {
  // Allaeva: gown flaring wide, ice crown spikes.
  g.poly([-32, 0, 32, 0, 10, -54, 8, -70, -8, -70, -10, -54]).fill(BW.black).stroke({ color: BW.white, width: 4 });
  g.circle(0, -80, 10).fill(BW.black).stroke(LINE);
  g.poly([-12, -88, -8, -104, -2, -92, 0, -110, 2, -92, 8, -104, 12, -88]).fill(BW.white).stroke(THIN);
  g.moveTo(-20, -30).lineTo(20, -30).stroke({ color: BW.gray3, width: 1.5 });
}

const SILHOUETTE_DRAWERS: Record<EnemySilhouette, (g: PIXI.Graphics) => void> = {
  shade: drawShade,
  wisp: drawWisp,
  soul: drawSoul,
  skeleton: drawSkeleton,
  drake: drawDrake,
  frost_wisp: drawFrostWisp,
  mage: drawMage,
  siren: drawSiren,
  fish: drawFish,
  crab: drawCrab,
  aberration: drawAberration,
  amalgam: drawAmalgam,
  dragon: drawDragon,
  archmage: drawArchmage,
  rain_lord: drawRainLord,
  queen: drawQueen,
};

/** Top of each silhouette (local y), so the elite halo sits just above the head. */
const SILHOUETTE_TOP: Partial<Record<EnemySilhouette, number>> = { fish: -40, crab: -50, soul: -76, drake: -74, amalgam: -76 };

export function createEnemySilhouetteGraphics(silhouette: EnemySilhouette, tier: EnemyTier = "standard"): PIXI.Graphics {
  const g = new PIXI.Graphics();
  if (tier === "elite") {
    // Elite halo: hollow ring above the head.
    g.ellipse(0, (SILHOUETTE_TOP[silhouette] ?? -100) - 10, 16, 5).stroke({ color: BW.white, width: 2 });
  }
  (SILHOUETTE_DRAWERS[silhouette] ?? drawShade)(g);
  return g;
}

/**
 * Tobo — floating cosmic relic (CHARACTER_BIBLE): impossible geometry, orbital rings, no face.
 * Drawn around (0, -60) so it hovers; animate `rotation` of the returned rings for life.
 */
export function createToboGraphics(): { container: PIXI.Container; rings: PIXI.Graphics } {
  const container = new PIXI.Container();
  const core = new PIXI.Graphics();
  core.poly([0, -84, 18, -60, 0, -36, -18, -60]).fill(BW.black).stroke({ color: BW.white, width: 3 });
  core.poly([0, -84, 8, -60, 0, -36, -8, -60]).stroke({ color: BW.gray3, width: 1.5 });
  core.circle(0, -60, 4).fill(BW.white);
  for (const [x, y] of [[-26, -80], [24, -42], [28, -76]] as const) {
    core.rect(x - 3, y - 3, 6, 6).fill(BW.white);
  }
  const rings = new PIXI.Graphics();
  rings.ellipse(0, 0, 30, 9).stroke({ color: BW.white, width: 2, alpha: 0.85 });
  rings.ellipse(0, 0, 9, 30).stroke({ color: BW.gray3, width: 1.5, alpha: 0.7 });
  rings.position.set(0, -60);
  const shadow = new PIXI.Graphics();
  shadow.ellipse(0, 0, 14, 4).fill({ color: BW.black, alpha: 0.5 });
  container.addChild(shadow, core, rings);
  return { container, rings };
}
