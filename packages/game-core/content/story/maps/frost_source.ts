import type { PlayableMap } from "../../../level-editor/types.js";

export const FROST_SOURCE_MAP: PlayableMap = {
  "id": "frost_source",
  "name": "Source du Givre",
  "version": 1,
  "world": "story",
  "mode": "story",
  "chapter": "chapter_ii_glaciaire",
  "grid": {
    "width": 101,
    "height": 65,
    "cellSize": 20
  },
  "topography": {
    "cells": []
  },
  "tiles": [],
  "objects": [],
  "buildings": [],
  "npcs": [],
  "enemies": [
    {
      "id": "boss_allaeva_1",
      "assetId": "enemy_shard_01",
      "enemyId": "boss_allaeva",
      "name": "Allaeva, Reine de Glace",
      "stats": {
        "hp": 4200,
        "attack": 46,
        "defense": 0,
        "speed": 76
      },
      "behavior": "boss",
      "aggroRadius": 400,
      "isBoss": true,
      "x": 1200.8,
      "y": 650
    }
  ],
  "collisions": [
    {
      "id": "obstacle_1",
      "type": "box",
      "x": 0,
      "y": 0,
      "width": 2020,
      "height": 60,
      "kind": "wall"
    },
    {
      "id": "obstacle_2",
      "type": "box",
      "x": 0,
      "y": 1240,
      "width": 2020,
      "height": 60,
      "kind": "wall"
    },
    {
      "id": "obstacle_3",
      "type": "box",
      "x": 0,
      "y": 0,
      "width": 60,
      "height": 1300,
      "kind": "wall"
    },
    {
      "id": "obstacle_4",
      "type": "box",
      "x": 1960,
      "y": 0,
      "width": 60,
      "height": 1300,
      "kind": "wall"
    },
    {
      "id": "obstacle_5",
      "type": "box",
      "x": 520,
      "y": 286,
      "width": 60,
      "height": 60,
      "kind": "pillar"
    },
    {
      "id": "obstacle_6",
      "type": "box",
      "x": 520,
      "y": 1014,
      "width": 60,
      "height": 60,
      "kind": "pillar"
    },
    {
      "id": "obstacle_7",
      "type": "box",
      "x": 1440,
      "y": 286,
      "width": 60,
      "height": 60,
      "kind": "pillar"
    },
    {
      "id": "obstacle_8",
      "type": "box",
      "x": 1440,
      "y": 1014,
      "width": 60,
      "height": 60,
      "kind": "pillar"
    }
  ],
  "triggers": [
    {
      "id": "zone_arena",
      "type": "event",
      "x": 60,
      "y": 60,
      "width": 1840,
      "height": 1180,
      "story": {
        "kind": "zone",
        "zoneId": "arena",
        "label": "Arène"
      }
    }
  ],
  "puzzles": [],
  "spawns": [
    {
      "id": "player_start",
      "x": 200,
      "y": 650
    }
  ],
  "victoryCondition": {
    "kind": "ALL_ENEMIES"
  },
  "metadata": {
    "createdWith": "AWorldDreamtLevelEditor",
    "style": "minimal-geometric"
  }
};
