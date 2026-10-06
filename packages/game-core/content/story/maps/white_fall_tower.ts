import type { PlayableMap } from "../../../level-editor/types.js";

export const WHITE_FALL_TOWER_MAP: PlayableMap = {
  "id": "white_fall_tower",
  "name": "Tour de la Chute Blanche",
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
      "x": 670,
      "y": 443
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
      "x": 889,
      "y": 448
    },
    {
      "id": "apprenti_gele_3",
      "assetId": "enemy_shard_01",
      "enemyId": "apprenti_gele",
      "name": "Apprenti Gelé",
      "stats": {
        "hp": 143,
        "attack": 20,
        "defense": 0,
        "speed": 72
      },
      "behavior": "ranged",
      "aggroRadius": 360,
      "x": 641,
      "y": 674
    },
    {
      "id": "apprenti_gele_4",
      "assetId": "enemy_shard_01",
      "enemyId": "apprenti_gele",
      "name": "Apprenti Gelé",
      "stats": {
        "hp": 143,
        "attack": 20,
        "defense": 0,
        "speed": 72
      },
      "behavior": "ranged",
      "aggroRadius": 360,
      "x": 1426,
      "y": 419
    },
    {
      "id": "archiviste_gele_5",
      "assetId": "enemy_shard_01",
      "enemyId": "archiviste_gele",
      "name": "Archiviste Gelé",
      "stats": {
        "hp": 171,
        "attack": 13,
        "defense": 0,
        "speed": 81
      },
      "behavior": "ranged",
      "aggroRadius": 360,
      "x": 1734,
      "y": 422
    },
    {
      "id": "professeur_d_arathas_6",
      "assetId": "enemy_shard_01",
      "enemyId": "professeur_d_arathas",
      "name": "Professeur d'Arathas",
      "stats": {
        "hp": 456,
        "attack": 30,
        "defense": 0,
        "speed": 72
      },
      "behavior": "ranged",
      "aggroRadius": 360,
      "x": 1432,
      "y": 660
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
      "x": 400,
      "y": 162,
      "width": 112,
      "height": 84,
      "kind": "shelf"
    },
    {
      "id": "obstacle_6",
      "type": "box",
      "x": 613,
      "y": 1014,
      "width": 84,
      "height": 95,
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
      "x": 1408,
      "y": 106,
      "width": 91,
      "height": 71,
      "kind": "shelf"
    },
    {
      "id": "obstacle_10",
      "type": "box",
      "x": 1719,
      "y": 1070,
      "width": 97,
      "height": 81,
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
