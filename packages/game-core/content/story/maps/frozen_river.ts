import type { PlayableMap } from "../../../level-editor/types.js";

export const FROZEN_RIVER_MAP: PlayableMap = {
  "id": "frozen_river",
  "name": "Rive Figée du Fleuve de Vie",
  "version": 1,
  "world": "story",
  "mode": "story",
  "chapter": "chapter_i_funebre",
  "grid": {
    "width": 106,
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
      "id": "spectre_vagabond_1",
      "assetId": "enemy_shard_01",
      "enemyId": "spectre_vagabond",
      "name": "Spectre Vagabond",
      "stats": {
        "hp": 110,
        "attack": 12,
        "defense": 0,
        "speed": 90
      },
      "behavior": "chase",
      "aggroRadius": 280,
      "x": 667,
      "y": 442
    },
    {
      "id": "spectre_vagabond_2",
      "assetId": "enemy_shard_01",
      "enemyId": "spectre_vagabond",
      "name": "Spectre Vagabond",
      "stats": {
        "hp": 110,
        "attack": 12,
        "defense": 0,
        "speed": 90
      },
      "behavior": "chase",
      "aggroRadius": 280,
      "x": 914,
      "y": 437
    },
    {
      "id": "spectre_vagabond_3",
      "assetId": "enemy_shard_01",
      "enemyId": "spectre_vagabond",
      "name": "Spectre Vagabond",
      "stats": {
        "hp": 110,
        "attack": 12,
        "defense": 0,
        "speed": 90
      },
      "behavior": "chase",
      "aggroRadius": 280,
      "x": 679,
      "y": 644
    },
    {
      "id": "spectre_hurleur_4",
      "assetId": "enemy_shard_01",
      "enemyId": "spectre_hurleur",
      "name": "Spectre Hurleur",
      "stats": {
        "hp": 83,
        "attack": 13,
        "defense": 0,
        "speed": 72
      },
      "behavior": "ranged",
      "aggroRadius": 360,
      "x": 1420,
      "y": 396
    },
    {
      "id": "spectre_veilleur_5",
      "assetId": "enemy_shard_01",
      "enemyId": "spectre_veilleur",
      "name": "Spectre Veilleur",
      "stats": {
        "hp": 209,
        "attack": 14,
        "defense": 0,
        "speed": 59
      },
      "behavior": "chase",
      "aggroRadius": 280,
      "x": 1700,
      "y": 426
    }
  ],
  "collisions": [
    {
      "id": "obstacle_1",
      "type": "box",
      "x": 0,
      "y": 0,
      "width": 2120,
      "height": 60,
      "kind": "wall"
    },
    {
      "id": "obstacle_2",
      "type": "box",
      "x": 0,
      "y": 1240,
      "width": 2120,
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
      "x": 2060,
      "y": 0,
      "width": 60,
      "height": 1300,
      "kind": "wall"
    },
    {
      "id": "obstacle_5",
      "type": "box",
      "x": 531,
      "y": 129,
      "width": 84,
      "height": 67,
      "kind": "tomb"
    },
    {
      "id": "obstacle_6",
      "type": "box",
      "x": 493,
      "y": 1045,
      "width": 91,
      "height": 102,
      "kind": "pillar"
    },
    {
      "id": "obstacle_7",
      "type": "box",
      "x": 1000,
      "y": 60,
      "width": 60,
      "height": 470,
      "kind": "wall"
    },
    {
      "id": "obstacle_8",
      "type": "box",
      "x": 1000,
      "y": 770,
      "width": 60,
      "height": 470,
      "kind": "wall"
    },
    {
      "id": "obstacle_9",
      "type": "box",
      "x": 1750,
      "y": 141,
      "width": 99,
      "height": 83,
      "kind": "tomb"
    },
    {
      "id": "obstacle_10",
      "type": "box",
      "x": 1675,
      "y": 1069,
      "width": 113,
      "height": 87,
      "kind": "pillar"
    }
  ],
  "triggers": [
    {
      "id": "zone_room_1",
      "type": "event",
      "x": 60,
      "y": 60,
      "width": 1000,
      "height": 1180,
      "story": {
        "kind": "zone",
        "zoneId": "room_1",
        "label": "Salle 1"
      }
    },
    {
      "id": "zone_room_2",
      "type": "event",
      "x": 1060,
      "y": 60,
      "width": 1000,
      "height": 1180,
      "story": {
        "kind": "zone",
        "zoneId": "room_2",
        "label": "Salle 2"
      }
    },
    {
      "id": "gate_room_1",
      "type": "event",
      "x": 1000,
      "y": 530,
      "width": 60,
      "height": 240,
      "story": {
        "kind": "gate",
        "opensWhen": {
          "kind": "zone_cleared",
          "zoneId": "room_1"
        }
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
