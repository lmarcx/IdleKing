import type { PlayableMap } from "../../../level-editor/types.js";

export const TIME_VESTIGE_MAP: PlayableMap = {
  "id": "time_vestige",
  "name": "Vestige du Temps",
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
      "x": 634,
      "y": 447
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
      "x": 907,
      "y": 447
    },
    {
      "id": "ame_tourmentee_3",
      "assetId": "enemy_shard_01",
      "enemyId": "ame_tourmentee",
      "name": "Âme Tourmentée",
      "stats": {
        "hp": 83,
        "attack": 13,
        "defense": 0,
        "speed": 72
      },
      "behavior": "ranged",
      "aggroRadius": 360,
      "x": 638,
      "y": 626
    },
    {
      "id": "ame_tourmentee_4",
      "assetId": "enemy_shard_01",
      "enemyId": "ame_tourmentee",
      "name": "Âme Tourmentée",
      "stats": {
        "hp": 83,
        "attack": 13,
        "defense": 0,
        "speed": 72
      },
      "behavior": "ranged",
      "aggroRadius": 360,
      "x": 1450,
      "y": 442
    },
    {
      "id": "spectre_hurleur_5",
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
      "x": 1684,
      "y": 437
    },
    {
      "id": "spectre_du_fleuve_noir_6",
      "assetId": "enemy_shard_01",
      "enemyId": "spectre_du_fleuve_noir",
      "name": "Spectre du Fleuve Noir",
      "stats": {
        "hp": 264,
        "attack": 20,
        "defense": 0,
        "speed": 72
      },
      "behavior": "ranged",
      "aggroRadius": 360,
      "x": 1453,
      "y": 634
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
      "x": 766,
      "y": 174,
      "width": 86,
      "height": 101,
      "kind": "tomb"
    },
    {
      "id": "obstacle_6",
      "type": "box",
      "x": 666,
      "y": 1059,
      "width": 87,
      "height": 79,
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
      "x": 1698,
      "y": 108,
      "width": 114,
      "height": 84,
      "kind": "tomb"
    },
    {
      "id": "obstacle_10",
      "type": "box",
      "x": 1532,
      "y": 1052,
      "width": 104,
      "height": 108,
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
