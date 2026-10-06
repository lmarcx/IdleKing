import type { PlayableMap } from "../../../level-editor/types.js";

export const SILENT_RETREAT_CAMP_MAP: PlayableMap = {
  "id": "silent_retreat_camp",
  "name": "Camp de la Retraite Silencieuse",
  "version": 1,
  "world": "story",
  "mode": "story",
  "chapter": "chapter_ii_glaciaire",
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
      "id": "spectre_gele_1",
      "assetId": "enemy_shard_01",
      "enemyId": "spectre_gele",
      "name": "Spectre Gelé",
      "stats": {
        "hp": 190,
        "attack": 18,
        "defense": 0,
        "speed": 90
      },
      "behavior": "chase",
      "aggroRadius": 280,
      "x": 663,
      "y": 429
    },
    {
      "id": "spectre_gele_2",
      "assetId": "enemy_shard_01",
      "enemyId": "spectre_gele",
      "name": "Spectre Gelé",
      "stats": {
        "hp": 190,
        "attack": 18,
        "defense": 0,
        "speed": 90
      },
      "behavior": "chase",
      "aggroRadius": 280,
      "x": 893,
      "y": 420
    },
    {
      "id": "spectre_gele_3",
      "assetId": "enemy_shard_01",
      "enemyId": "spectre_gele",
      "name": "Spectre Gelé",
      "stats": {
        "hp": 190,
        "attack": 18,
        "defense": 0,
        "speed": 90
      },
      "behavior": "chase",
      "aggroRadius": 280,
      "x": 659,
      "y": 650
    },
    {
      "id": "spectre_blizzard_4",
      "assetId": "enemy_shard_01",
      "enemyId": "spectre_blizzard",
      "name": "Spectre Blizzard",
      "stats": {
        "hp": 143,
        "attack": 20,
        "defense": 0,
        "speed": 72
      },
      "behavior": "ranged",
      "aggroRadius": 360,
      "x": 1450,
      "y": 403
    },
    {
      "id": "spectre_cristallise_5",
      "assetId": "enemy_shard_01",
      "enemyId": "spectre_cristallise",
      "name": "Spectre Cristallisé",
      "stats": {
        "hp": 361,
        "attack": 22,
        "defense": 0,
        "speed": 59
      },
      "behavior": "chase",
      "aggroRadius": 280,
      "x": 1729,
      "y": 440
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
      "x": 681,
      "y": 170,
      "width": 72,
      "height": 67,
      "kind": "crystal"
    },
    {
      "id": "obstacle_6",
      "type": "box",
      "x": 337,
      "y": 1032,
      "width": 111,
      "height": 104,
      "kind": "rock"
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
      "x": 1478,
      "y": 142,
      "width": 102,
      "height": 62,
      "kind": "crystal"
    },
    {
      "id": "obstacle_10",
      "type": "box",
      "x": 1587,
      "y": 1021,
      "width": 110,
      "height": 63,
      "kind": "rock"
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
