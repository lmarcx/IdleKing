import type { PlayableMap } from "../../../level-editor/types.js";

export const ASHEN_PEAK_MAP: PlayableMap = {
  "id": "ashen_peak",
  "name": "Pic des Cendres",
  "version": 1,
  "world": "story",
  "mode": "story",
  "chapter": "chapter_i_funebre",
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
      "id": "squelette_guerrier_1",
      "assetId": "enemy_shard_01",
      "enemyId": "squelette_guerrier",
      "name": "Squelette Guerrier",
      "stats": {
        "hp": 110,
        "attack": 12,
        "defense": 0,
        "speed": 90
      },
      "behavior": "chase",
      "aggroRadius": 280,
      "x": 627,
      "y": 441
    },
    {
      "id": "squelette_guerrier_2",
      "assetId": "enemy_shard_01",
      "enemyId": "squelette_guerrier",
      "name": "Squelette Guerrier",
      "stats": {
        "hp": 110,
        "attack": 12,
        "defense": 0,
        "speed": 90
      },
      "behavior": "chase",
      "aggroRadius": 280,
      "x": 926,
      "y": 434
    },
    {
      "id": "dragonoide_dechu_3",
      "assetId": "enemy_shard_01",
      "enemyId": "dragonoide_dechu",
      "name": "Dragonoïde Déchu",
      "stats": {
        "hp": 110,
        "attack": 12,
        "defense": 0,
        "speed": 90
      },
      "behavior": "chase",
      "aggroRadius": 280,
      "x": 662,
      "y": 661
    },
    {
      "id": "dragonoide_dechu_4",
      "assetId": "enemy_shard_01",
      "enemyId": "dragonoide_dechu",
      "name": "Dragonoïde Déchu",
      "stats": {
        "hp": 110,
        "attack": 12,
        "defense": 0,
        "speed": 90
      },
      "behavior": "chase",
      "aggroRadius": 280,
      "x": 1455,
      "y": 390
    },
    {
      "id": "squelette_archer_5",
      "assetId": "enemy_shard_01",
      "enemyId": "squelette_archer",
      "name": "Squelette Archer",
      "stats": {
        "hp": 77,
        "attack": 11,
        "defense": 0,
        "speed": 77
      },
      "behavior": "ranged",
      "aggroRadius": 360,
      "x": 1721,
      "y": 438
    },
    {
      "id": "dragonoide_fanatique_6",
      "assetId": "enemy_shard_01",
      "enemyId": "dragonoide_fanatique",
      "name": "Dragonoïde Fanatique",
      "stats": {
        "hp": 99,
        "attack": 15,
        "defense": 0,
        "speed": 113
      },
      "behavior": "chase",
      "aggroRadius": 280,
      "x": 1466,
      "y": 639
    },
    {
      "id": "dragonoide_fanatique_7",
      "assetId": "enemy_shard_01",
      "enemyId": "dragonoide_fanatique",
      "name": "Dragonoïde Fanatique",
      "stats": {
        "hp": 99,
        "attack": 15,
        "defense": 0,
        "speed": 113
      },
      "behavior": "chase",
      "aggroRadius": 280,
      "x": 2455,
      "y": 433
    },
    {
      "id": "gardien_des_cendres_8",
      "assetId": "enemy_shard_01",
      "enemyId": "gardien_des_cendres",
      "name": "Gardien des Cendres",
      "stats": {
        "hp": 669,
        "attack": 22,
        "defense": 0,
        "speed": 59
      },
      "behavior": "chase",
      "aggroRadius": 280,
      "x": 2725,
      "y": 436
    },
    {
      "id": "boss_dragon_shadow_9",
      "assetId": "enemy_shard_01",
      "enemyId": "boss_dragon_shadow",
      "name": "Ombre du Dragon",
      "stats": {
        "hp": 1600,
        "attack": 26,
        "defense": 0,
        "speed": 80
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
      "x": 680,
      "y": 174,
      "width": 98,
      "height": 97,
      "kind": "rock"
    },
    {
      "id": "obstacle_6",
      "type": "box",
      "x": 606,
      "y": 1068,
      "width": 80,
      "height": 69,
      "kind": "ruin"
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
      "x": 1609,
      "y": 127,
      "width": 70,
      "height": 108,
      "kind": "rock"
    },
    {
      "id": "obstacle_10",
      "type": "box",
      "x": 1698,
      "y": 1014,
      "width": 80,
      "height": 89,
      "kind": "ruin"
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
      "x": 2620,
      "y": 141,
      "width": 70,
      "height": 105,
      "kind": "rock"
    },
    {
      "id": "obstacle_14",
      "type": "box",
      "x": 2402,
      "y": 1073,
      "width": 93,
      "height": 104,
      "kind": "ruin"
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
