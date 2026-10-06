import type { PlayableMap } from "../../../level-editor/types.js";

export const ARATHAS_ACADEMY_MAP: PlayableMap = {
  "id": "arathas_academy",
  "name": "Académie d'Arathas",
  "version": 1,
  "world": "story",
  "mode": "story",
  "chapter": "chapter_ii_glaciaire",
  "grid": {
    "width": 221,
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
      "id": "apprenti_gele_1",
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
      "x": 640,
      "y": 436
    },
    {
      "id": "apprenti_gele_2",
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
      "x": 921,
      "y": 418
    },
    {
      "id": "sujet_a01_3",
      "assetId": "enemy_shard_01",
      "enemyId": "sujet_a01",
      "name": "Sujet A-01",
      "stats": {
        "hp": 190,
        "attack": 18,
        "defense": 0,
        "speed": 90
      },
      "behavior": "chase",
      "aggroRadius": 280,
      "x": 620,
      "y": 660
    },
    {
      "id": "sujet_a01_4",
      "assetId": "enemy_shard_01",
      "enemyId": "sujet_a01",
      "name": "Sujet A-01",
      "stats": {
        "hp": 190,
        "attack": 18,
        "defense": 0,
        "speed": 90
      },
      "behavior": "chase",
      "aggroRadius": 280,
      "x": 1452,
      "y": 399
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
      "x": 1729,
      "y": 432
    },
    {
      "id": "sujet_a07_6",
      "assetId": "enemy_shard_01",
      "enemyId": "sujet_a07",
      "name": "Sujet A-07",
      "stats": {
        "hp": 133,
        "attack": 25,
        "defense": 0,
        "speed": 131
      },
      "behavior": "chase",
      "aggroRadius": 280,
      "x": 2478,
      "y": 392
    },
    {
      "id": "prototype_alpha_7",
      "assetId": "enemy_shard_01",
      "enemyId": "prototype_alpha",
      "name": "Prototype Alpha",
      "stats": {
        "hp": 1155,
        "attack": 32,
        "defense": 0,
        "speed": 59
      },
      "behavior": "chase",
      "aggroRadius": 280,
      "x": 2736,
      "y": 448
    },
    {
      "id": "boss_corrupted_archmage_8",
      "assetId": "enemy_shard_01",
      "enemyId": "boss_corrupted_archmage",
      "name": "Archimage Corrompu",
      "stats": {
        "hp": 2800,
        "attack": 36,
        "defense": 0,
        "speed": 70
      },
      "behavior": "boss",
      "aggroRadius": 400,
      "isBoss": true,
      "x": 3828.8,
      "y": 650
    }
  ],
  "collisions": [
    {
      "id": "obstacle_1",
      "type": "box",
      "x": 0,
      "y": 0,
      "width": 4420,
      "height": 60,
      "kind": "wall"
    },
    {
      "id": "obstacle_2",
      "type": "box",
      "x": 0,
      "y": 1240,
      "width": 4420,
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
      "x": 4360,
      "y": 0,
      "width": 60,
      "height": 1300,
      "kind": "wall"
    },
    {
      "id": "obstacle_5",
      "type": "box",
      "x": 726,
      "y": 153,
      "width": 82,
      "height": 79,
      "kind": "shelf"
    },
    {
      "id": "obstacle_6",
      "type": "box",
      "x": 793,
      "y": 1019,
      "width": 94,
      "height": 93,
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
      "x": 1612,
      "y": 160,
      "width": 78,
      "height": 80,
      "kind": "shelf"
    },
    {
      "id": "obstacle_10",
      "type": "box",
      "x": 1562,
      "y": 1037,
      "width": 96,
      "height": 75,
      "kind": "pillar"
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
      "x": 2406,
      "y": 146,
      "width": 75,
      "height": 108,
      "kind": "shelf"
    },
    {
      "id": "obstacle_14",
      "type": "box",
      "x": 2478,
      "y": 1014,
      "width": 75,
      "height": 66,
      "kind": "pillar"
    },
    {
      "id": "obstacle_15",
      "type": "box",
      "x": 3000,
      "y": 60,
      "width": 60,
      "height": 470,
      "kind": "wall"
    },
    {
      "id": "obstacle_16",
      "type": "box",
      "x": 3000,
      "y": 770,
      "width": 60,
      "height": 470,
      "kind": "wall"
    },
    {
      "id": "obstacle_17",
      "type": "box",
      "x": 3370,
      "y": 286,
      "width": 60,
      "height": 60,
      "kind": "pillar"
    },
    {
      "id": "obstacle_18",
      "type": "box",
      "x": 3370,
      "y": 1014,
      "width": 60,
      "height": 60,
      "kind": "pillar"
    },
    {
      "id": "obstacle_19",
      "type": "box",
      "x": 3990,
      "y": 286,
      "width": 60,
      "height": 60,
      "kind": "pillar"
    },
    {
      "id": "obstacle_20",
      "type": "box",
      "x": 3990,
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
      "id": "zone_room_3",
      "type": "event",
      "x": 2060,
      "y": 60,
      "width": 1000,
      "height": 1180,
      "story": {
        "kind": "zone",
        "zoneId": "room_3",
        "label": "Salle 3"
      }
    },
    {
      "id": "zone_arena",
      "type": "event",
      "x": 3060,
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
    },
    {
      "id": "gate_room_3",
      "type": "event",
      "x": 3000,
      "y": 530,
      "width": 60,
      "height": 240,
      "story": {
        "kind": "gate",
        "opensWhen": {
          "kind": "zone_cleared",
          "zoneId": "room_3"
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
