import * as PIXI from "pixi.js";
import type { LayoutFloor } from "@idleking/game-core";
import { GROUND_TEXTURES, getGroundTexture, getMapTile, type PlayableMap } from "@idleking/game-core/level-editor";

import { colorFromHex } from "./asset-graphics";

export function drawTileDetail(g: PIXI.Graphics, textureId: string, x: number, y: number, size: number): void {
  if (textureId === "water") {
    for (let offset = 8; offset < size; offset += 10) {
      g.moveTo(x + 5, y + offset).lineTo(x + size - 5, y + offset - 3).stroke({ color: 0xbddff0, alpha: 0.35, width: 1 });
    }
  } else if (textureId === "lava") {
    g.moveTo(x + 6, y + size - 8).lineTo(x + size / 2, y + 7).lineTo(x + size - 7, y + size - 10).stroke({ color: 0xf0b19d, alpha: 0.55, width: 2 });
  } else if (textureId === "ice") {
    g.moveTo(x + 6, y + size - 6).lineTo(x + size - 6, y + 6).stroke({ color: 0xe8fbff, alpha: 0.35, width: 1 });
  } else if (textureId === "stone" || textureId === "rock") {
    g.rect(x + 6, y + 6, size - 12, size - 12).stroke({ color: 0xf2f2f2, alpha: textureId === "rock" ? 0.22 : 0.16, width: 1 });
  } else if (textureId === "grass") {
    g.moveTo(x + 9, y + size - 7).lineTo(x + 12, y + size - 14).moveTo(x + 18, y + size - 7).lineTo(x + 18, y + size - 15).stroke({ color: 0xd8ead8, alpha: 0.25, width: 1 });
  } else if (textureId === "sand" || textureId === "dirt") {
    g.circle(x + 10, y + 12, 1.4).circle(x + size - 12, y + size - 10, 1.2).fill({ color: 0xf2f2f2, alpha: textureId === "sand" ? 0.3 : 0.18 });
  }
}

/** Ground texture pass -- one filled+stroked+detailed rect per grid cell. */
export function renderGroundTiles(g: PIXI.Graphics, map: PlayableMap): void {
  const defaultTexture = GROUND_TEXTURES[0];
  for (let y = 0; y < map.grid.height; y += 1) {
    for (let x = 0; x < map.grid.width; x += 1) {
      const tile = getMapTile(map, x, y);
      const texture = getGroundTexture(tile?.textureId ?? defaultTexture.id) ?? defaultTexture;
      const px = x * map.grid.cellSize;
      const py = y * map.grid.cellSize;
      g.rect(px, py, map.grid.cellSize, map.grid.cellSize)
        .fill({ color: colorFromHex(texture.fill), alpha: 1 })
        .stroke({ color: colorFromHex(texture.stroke), alpha: 0.34, width: 1 });
      drawTileDetail(g, texture.id, px, py, map.grid.cellSize);
    }
  }
}

/** Painted ground tiles of a Story dungeon layout (unpainted cells keep the dungeon's own ground). */
export function renderFloorTiles(g: PIXI.Graphics, floor: LayoutFloor): void {
  const size = floor.cellSize;
  for (const tile of floor.tiles) {
    const texture = getGroundTexture(tile.textureId);
    if (!texture) continue;
    const px = tile.x * size;
    const py = tile.y * size;
    g.rect(px, py, size, size)
      .fill({ color: colorFromHex(texture.fill), alpha: 1 })
      .stroke({ color: colorFromHex(texture.stroke), alpha: 0.34, width: 1 });
    drawTileDetail(g, texture.id, px, py, size);
  }
}

/** Blocked-cell (topography/walkability-derived) overlay -- an X mark over every non-walkable cell. */
export function renderBlockedCellOverlay(g: PIXI.Graphics, blockingCells: ReadonlySet<string>, cellSize: number): void {
  for (const key of blockingCells) {
    const [x, y] = key.split(":").map(Number);
    const px = x * cellSize;
    const py = y * cellSize;
    g.rect(px, py, cellSize, cellSize).fill({ color: 0x050505, alpha: 0.68 });
    g.moveTo(px + 5, py + 5)
      .lineTo(px + cellSize - 5, py + cellSize - 5)
      .moveTo(px + cellSize - 5, py + 5)
      .lineTo(px + 5, py + cellSize - 5)
      .stroke({ color: 0xf2f2f2, alpha: 0.42, width: 2 });
  }
}
