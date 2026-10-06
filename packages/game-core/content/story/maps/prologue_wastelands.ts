import type { PlayableMap } from "../../../level-editor/types.js";

export const PROLOGUE_WASTELANDS_MAP: PlayableMap = {
  "id": "prologue_wastelands",
  "name": "Terres Désolées",
  "version": 1,
  "world": "story",
  "mode": "story",
  "chapter": "prologue",
  "grid": {
    "width": 170,
    "height": 75,
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
      "id": "ombre_errante_1",
      "assetId": "enemy_shard_01",
      "enemyId": "ombre_errante",
      "name": "Ombre Errante",
      "stats": {
        "hp": 60,
        "attack": 8,
        "defense": 0,
        "speed": 90
      },
      "behavior": "chase",
      "aggroRadius": 280,
      "x": 1620,
      "y": 760
    },
    {
      "id": "ombre_errante_2",
      "assetId": "enemy_shard_01",
      "enemyId": "ombre_errante",
      "name": "Ombre Errante",
      "stats": {
        "hp": 60,
        "attack": 8,
        "defense": 0,
        "speed": 90
      },
      "behavior": "chase",
      "aggroRadius": 280,
      "x": 1880,
      "y": 1000
    },
    {
      "id": "ombre_errante_3",
      "assetId": "enemy_shard_01",
      "enemyId": "ombre_errante",
      "name": "Ombre Errante",
      "stats": {
        "hp": 60,
        "attack": 8,
        "defense": 0,
        "speed": 90
      },
      "behavior": "chase",
      "aggroRadius": 280,
      "x": 2060,
      "y": 820
    },
    {
      "id": "ombre_archer_4",
      "assetId": "enemy_shard_01",
      "enemyId": "ombre_archer",
      "name": "Ombre Archer",
      "stats": {
        "hp": 42,
        "attack": 7,
        "defense": 0,
        "speed": 77
      },
      "behavior": "ranged",
      "aggroRadius": 360,
      "x": 2160,
      "y": 520
    },
    {
      "id": "ombre_brisee_5",
      "assetId": "enemy_shard_01",
      "enemyId": "ombre_brisee",
      "name": "Ombre Brisée",
      "stats": {
        "hp": 114,
        "attack": 10,
        "defense": 0,
        "speed": 59
      },
      "behavior": "chase",
      "aggroRadius": 280,
      "x": 2100,
      "y": 1200
    },
    {
      "id": "boss_dark_amalgam_6",
      "assetId": "enemy_shard_01",
      "enemyId": "boss_dark_amalgam",
      "name": "Amalgame des Ténèbres",
      "stats": {
        "hp": 520,
        "attack": 16,
        "defense": 0,
        "speed": 72
      },
      "behavior": "boss",
      "aggroRadius": 400,
      "isBoss": true,
      "x": 2980,
      "y": 900
    }
  ],
  "collisions": [
    {
      "id": "obstacle_1",
      "type": "box",
      "x": 0,
      "y": 0,
      "width": 3400,
      "height": 60,
      "kind": "wall"
    },
    {
      "id": "obstacle_2",
      "type": "box",
      "x": 0,
      "y": 1440,
      "width": 3400,
      "height": 60,
      "kind": "wall"
    },
    {
      "id": "obstacle_3",
      "type": "box",
      "x": 0,
      "y": 0,
      "width": 60,
      "height": 1500,
      "kind": "wall"
    },
    {
      "id": "obstacle_4",
      "type": "box",
      "x": 3340,
      "y": 0,
      "width": 60,
      "height": 1500,
      "kind": "wall"
    },
    {
      "id": "obstacle_5",
      "type": "box",
      "x": 60,
      "y": 560,
      "width": 520,
      "height": 60,
      "kind": "wall"
    },
    {
      "id": "obstacle_6",
      "type": "box",
      "x": 840,
      "y": 560,
      "width": 320,
      "height": 60,
      "kind": "wall"
    },
    {
      "id": "obstacle_7",
      "type": "box",
      "x": 300,
      "y": 700,
      "width": 70,
      "height": 70,
      "kind": "ruin"
    },
    {
      "id": "obstacle_8",
      "type": "box",
      "x": 520,
      "y": 1080,
      "width": 80,
      "height": 60,
      "kind": "ruin"
    },
    {
      "id": "obstacle_9",
      "type": "box",
      "x": 760,
      "y": 760,
      "width": 60,
      "height": 90,
      "kind": "ruin"
    },
    {
      "id": "obstacle_10",
      "type": "box",
      "x": 980,
      "y": 1200,
      "width": 90,
      "height": 60,
      "kind": "ruin"
    },
    {
      "id": "obstacle_11",
      "type": "box",
      "x": 260,
      "y": 200,
      "width": 90,
      "height": 70,
      "kind": "rock"
    },
    {
      "id": "obstacle_12",
      "type": "box",
      "x": 900,
      "y": 300,
      "width": 80,
      "height": 80,
      "kind": "rock"
    },
    {
      "id": "obstacle_13",
      "type": "box",
      "x": 1200,
      "y": 60,
      "width": 60,
      "height": 720,
      "kind": "wall"
    },
    {
      "id": "obstacle_14",
      "type": "box",
      "x": 1200,
      "y": 1020,
      "width": 60,
      "height": 420,
      "kind": "wall"
    },
    {
      "id": "obstacle_15",
      "type": "box",
      "x": 1480,
      "y": 640,
      "width": 80,
      "height": 120,
      "kind": "ruin"
    },
    {
      "id": "obstacle_16",
      "type": "box",
      "x": 1720,
      "y": 1080,
      "width": 120,
      "height": 70,
      "kind": "ruin"
    },
    {
      "id": "obstacle_17",
      "type": "box",
      "x": 1960,
      "y": 720,
      "width": 70,
      "height": 70,
      "kind": "rock"
    },
    {
      "id": "obstacle_18",
      "type": "box",
      "x": 2300,
      "y": 60,
      "width": 60,
      "height": 710,
      "kind": "wall"
    },
    {
      "id": "obstacle_19",
      "type": "box",
      "x": 2300,
      "y": 1030,
      "width": 60,
      "height": 410,
      "kind": "wall"
    },
    {
      "id": "obstacle_20",
      "type": "box",
      "x": 2560,
      "y": 420,
      "width": 60,
      "height": 60,
      "kind": "pillar"
    },
    {
      "id": "obstacle_21",
      "type": "box",
      "x": 2560,
      "y": 1320,
      "width": 60,
      "height": 60,
      "kind": "pillar"
    },
    {
      "id": "obstacle_22",
      "type": "box",
      "x": 3100,
      "y": 420,
      "width": 60,
      "height": 60,
      "kind": "pillar"
    },
    {
      "id": "obstacle_23",
      "type": "box",
      "x": 3100,
      "y": 1320,
      "width": 60,
      "height": 60,
      "kind": "pillar"
    }
  ],
  "triggers": [
    {
      "id": "zone_arrival",
      "type": "event",
      "x": 60,
      "y": 620,
      "width": 1140,
      "height": 820,
      "story": {
        "kind": "zone",
        "zoneId": "arrival",
        "label": "Ruines"
      }
    },
    {
      "id": "zone_alcove",
      "type": "event",
      "x": 60,
      "y": 60,
      "width": 1100,
      "height": 500,
      "story": {
        "kind": "zone",
        "zoneId": "alcove",
        "label": "Alcôve du chien"
      }
    },
    {
      "id": "zone_ambush",
      "type": "event",
      "x": 1260,
      "y": 60,
      "width": 1040,
      "height": 1380,
      "story": {
        "kind": "zone",
        "zoneId": "ambush",
        "label": "Embuscade des Ombres",
        "spawnOnBeat": "shadows"
      }
    },
    {
      "id": "zone_arena",
      "type": "event",
      "x": 2360,
      "y": 60,
      "width": 980,
      "height": 1380,
      "story": {
        "kind": "zone",
        "zoneId": "arena",
        "label": "Arène de l'Amalgame"
      }
    },
    {
      "id": "gate_ruins_to_ambush",
      "type": "event",
      "x": 1200,
      "y": 780,
      "width": 60,
      "height": 240,
      "story": {
        "kind": "gate",
        "opensWhen": {
          "kind": "beat_done",
          "beatId": "feed"
        }
      }
    },
    {
      "id": "gate_ambush_to_arena",
      "type": "event",
      "x": 2300,
      "y": 770,
      "width": 60,
      "height": 260,
      "story": {
        "kind": "gate",
        "opensWhen": {
          "kind": "zone_cleared",
          "zoneId": "ambush"
        }
      }
    },
    {
      "id": "beat_ruins",
      "type": "dialogue",
      "x": 380,
      "y": 860,
      "width": 80,
      "height": 80,
      "story": {
        "kind": "beat",
        "beatId": "ruins"
      }
    },
    {
      "id": "beat_find_dog",
      "type": "dialogue",
      "x": 580,
      "y": 220,
      "width": 80,
      "height": 80,
      "story": {
        "kind": "beat",
        "beatId": "find_dog"
      }
    },
    {
      "id": "beat_feed",
      "type": "dialogue",
      "x": 660,
      "y": 320,
      "width": 80,
      "height": 80,
      "story": {
        "kind": "beat",
        "beatId": "feed"
      }
    },
    {
      "id": "beat_shadows",
      "type": "dialogue",
      "x": 1340,
      "y": 860,
      "width": 80,
      "height": 80,
      "story": {
        "kind": "beat",
        "beatId": "shadows"
      }
    },
    {
      "id": "beat_amalgam",
      "type": "dialogue",
      "x": 2420,
      "y": 860,
      "width": 80,
      "height": 80,
      "story": {
        "kind": "beat",
        "beatId": "amalgam",
        "requires": {
          "zoneCleared": "ambush"
        }
      }
    },
    {
      "id": "beat_drop_of_darkness",
      "type": "dialogue",
      "x": 2940,
      "y": 860,
      "width": 80,
      "height": 80,
      "story": {
        "kind": "beat",
        "beatId": "drop_of_darkness",
        "requires": {
          "bossDefeated": true
        }
      }
    },
    {
      "id": "beat_billy_joins",
      "type": "dialogue",
      "x": 2780,
      "y": 600,
      "width": 80,
      "height": 80,
      "story": {
        "kind": "beat",
        "beatId": "billy_joins"
      }
    },
    {
      "id": "beat_kingdom_found",
      "type": "dialogue",
      "x": 3160,
      "y": 860,
      "width": 80,
      "height": 80,
      "story": {
        "kind": "beat",
        "beatId": "kingdom_found"
      }
    }
  ],
  "puzzles": [],
  "spawns": [
    {
      "id": "player_start",
      "x": 200,
      "y": 900
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
