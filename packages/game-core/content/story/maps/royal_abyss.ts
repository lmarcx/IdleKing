import type { PlayableMap } from "../../../level-editor/types.js";

export const ROYAL_ABYSS_MAP: PlayableMap = {
  "id": "royal_abyss",
  "name": "Gouffre Royal",
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
      "id": "poisson_abyssal_gele_1",
      "assetId": "enemy_shard_01",
      "enemyId": "poisson_abyssal_gele",
      "name": "Poisson-Abyssal Gelé",
      "stats": {
        "hp": 190,
        "attack": 18,
        "defense": 0,
        "speed": 90
      },
      "behavior": "chase",
      "aggroRadius": 280,
      "x": 679,
      "y": 433
    },
    {
      "id": "poisson_abyssal_gele_2",
      "assetId": "enemy_shard_01",
      "enemyId": "poisson_abyssal_gele",
      "name": "Poisson-Abyssal Gelé",
      "stats": {
        "hp": 190,
        "attack": 18,
        "defense": 0,
        "speed": 90
      },
      "behavior": "chase",
      "aggroRadius": 280,
      "x": 929,
      "y": 400
    },
    {
      "id": "sirene_errante_3",
      "assetId": "enemy_shard_01",
      "enemyId": "sirene_errante",
      "name": "Sirène Errante",
      "stats": {
        "hp": 143,
        "attack": 20,
        "defense": 0,
        "speed": 72
      },
      "behavior": "ranged",
      "aggroRadius": 360,
      "x": 666,
      "y": 652
    },
    {
      "id": "sirene_errante_4",
      "assetId": "enemy_shard_01",
      "enemyId": "sirene_errante",
      "name": "Sirène Errante",
      "stats": {
        "hp": 143,
        "attack": 20,
        "defense": 0,
        "speed": 72
      },
      "behavior": "ranged",
      "aggroRadius": 360,
      "x": 1471,
      "y": 401
    },
    {
      "id": "crabe_de_givre_5",
      "assetId": "enemy_shard_01",
      "enemyId": "crabe_de_givre",
      "name": "Crabe de Givre",
      "stats": {
        "hp": 361,
        "attack": 22,
        "defense": 0,
        "speed": 59
      },
      "behavior": "chase",
      "aggroRadius": 280,
      "x": 1706,
      "y": 403
    },
    {
      "id": "sirene_des_chants_6",
      "assetId": "enemy_shard_01",
      "enemyId": "sirene_des_chants",
      "name": "Sirène des Chants",
      "stats": {
        "hp": 162,
        "attack": 16,
        "defense": 0,
        "speed": 72
      },
      "behavior": "ranged",
      "aggroRadius": 360,
      "x": 2470,
      "y": 408
    },
    {
      "id": "leviathan_juvenile_gele_7",
      "assetId": "enemy_shard_01",
      "enemyId": "leviathan_juvenile_gele",
      "name": "Léviathan Juvénile Gelé",
      "stats": {
        "hp": 1155,
        "attack": 32,
        "defense": 0,
        "speed": 59
      },
      "behavior": "chase",
      "aggroRadius": 280,
      "x": 2710,
      "y": 432
    },
    {
      "id": "boss_fallen_rain_lord_8",
      "assetId": "enemy_shard_01",
      "enemyId": "boss_fallen_rain_lord",
      "name": "Seigneur de la Pluie Déchu",
      "stats": {
        "hp": 3200,
        "attack": 40,
        "defense": 0,
        "speed": 92
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
      "x": 753,
      "y": 139,
      "width": 79,
      "height": 87,
      "kind": "coral"
    },
    {
      "id": "obstacle_6",
      "type": "box",
      "x": 425,
      "y": 1069,
      "width": 70,
      "height": 78,
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
      "x": 1539,
      "y": 168,
      "width": 72,
      "height": 86,
      "kind": "coral"
    },
    {
      "id": "obstacle_10",
      "type": "box",
      "x": 1646,
      "y": 1066,
      "width": 116,
      "height": 76,
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
      "x": 2665,
      "y": 153,
      "width": 75,
      "height": 96,
      "kind": "coral"
    },
    {
      "id": "obstacle_14",
      "type": "box",
      "x": 2537,
      "y": 1081,
      "width": 83,
      "height": 83,
      "kind": "rock"
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
