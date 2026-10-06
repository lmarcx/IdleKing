import type { PlayableMap } from "../../../level-editor/types.js";

export const REFLECTION_CAVERN_MAP: PlayableMap = {
  "id": "reflection_cavern",
  "name": "Caverne aux Chants",
  "version": 1,
  "world": "story",
  "mode": "story",
  "chapter": "chapter_ii_glaciaire",
  "grid": {
    "width": 171,
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
      "x": 635,
      "y": 441
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
      "x": 906,
      "y": 409
    },
    {
      "id": "sirene_des_reflets_3",
      "assetId": "enemy_shard_01",
      "enemyId": "sirene_des_reflets",
      "name": "Sirène des Reflets",
      "stats": {
        "hp": 152,
        "attack": 18,
        "defense": 0,
        "speed": 86
      },
      "behavior": "ranged",
      "aggroRadius": 360,
      "x": 662,
      "y": 644
    },
    {
      "id": "sirene_des_reflets_4",
      "assetId": "enemy_shard_01",
      "enemyId": "sirene_des_reflets",
      "name": "Sirène des Reflets",
      "stats": {
        "hp": 152,
        "attack": 18,
        "defense": 0,
        "speed": 86
      },
      "behavior": "ranged",
      "aggroRadius": 360,
      "x": 1465,
      "y": 417
    },
    {
      "id": "spectre_blizzard_5",
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
      "x": 1729,
      "y": 416
    },
    {
      "id": "spectre_du_blizzard_blanc_6",
      "assetId": "enemy_shard_01",
      "enemyId": "spectre_du_blizzard_blanc",
      "name": "Spectre du Blizzard Blanc",
      "stats": {
        "hp": 456,
        "attack": 30,
        "defense": 0,
        "speed": 72
      },
      "behavior": "ranged",
      "aggroRadius": 360,
      "x": 1445,
      "y": 673
    },
    {
      "id": "boss_frost_amalgam_7",
      "assetId": "enemy_shard_01",
      "enemyId": "boss_frost_amalgam",
      "name": "Amalgame du Givre",
      "stats": {
        "hp": 2200,
        "attack": 32,
        "defense": 0,
        "speed": 66
      },
      "behavior": "boss",
      "aggroRadius": 400,
      "isBoss": true,
      "x": 2828.8,
      "y": 650
    }
  ],
  "collisions": [
    {
      "id": "obstacle_1",
      "type": "box",
      "x": 0,
      "y": 0,
      "width": 3420,
      "height": 60,
      "kind": "wall"
    },
    {
      "id": "obstacle_2",
      "type": "box",
      "x": 0,
      "y": 1240,
      "width": 3420,
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
      "x": 3360,
      "y": 0,
      "width": 60,
      "height": 1300,
      "kind": "wall"
    },
    {
      "id": "obstacle_5",
      "type": "box",
      "x": 670,
      "y": 132,
      "width": 74,
      "height": 81,
      "kind": "crystal"
    },
    {
      "id": "obstacle_6",
      "type": "box",
      "x": 421,
      "y": 1051,
      "width": 117,
      "height": 65,
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
      "x": 1351,
      "y": 112,
      "width": 71,
      "height": 69,
      "kind": "crystal"
    },
    {
      "id": "obstacle_10",
      "type": "box",
      "x": 1715,
      "y": 1036,
      "width": 91,
      "height": 61,
      "kind": "rock"
    },
    {
      "id": "obstacle_11",
      "type": "box",
      "x": 2000,
      "y": 60,
      "width": 60,
      "height": 470,
      "kind": "wall"
    },
    {
      "id": "obstacle_12",
      "type": "box",
      "x": 2000,
      "y": 770,
      "width": 60,
      "height": 470,
      "kind": "wall"
    },
    {
      "id": "obstacle_13",
      "type": "box",
      "x": 2370,
      "y": 286,
      "width": 60,
      "height": 60,
      "kind": "pillar"
    },
    {
      "id": "obstacle_14",
      "type": "box",
      "x": 2370,
      "y": 1014,
      "width": 60,
      "height": 60,
      "kind": "pillar"
    },
    {
      "id": "obstacle_15",
      "type": "box",
      "x": 2990,
      "y": 286,
      "width": 60,
      "height": 60,
      "kind": "pillar"
    },
    {
      "id": "obstacle_16",
      "type": "box",
      "x": 2990,
      "y": 1014,
      "width": 60,
      "height": 60,
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
      "id": "zone_arena",
      "type": "event",
      "x": 2060,
      "y": 60,
      "width": 1240,
      "height": 1180,
      "story": {
        "kind": "zone",
        "zoneId": "arena",
        "label": "Arène"
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
    },
    {
      "id": "gate_room_2",
      "type": "event",
      "x": 2000,
      "y": 530,
      "width": 60,
      "height": 240,
      "story": {
        "kind": "gate",
        "opensWhen": {
          "kind": "zone_cleared",
          "zoneId": "room_2"
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
