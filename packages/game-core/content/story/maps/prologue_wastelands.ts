import type { PlayableMap } from "../../../level-editor/types.js";

export const PROLOGUE_WASTELANDS_MAP: PlayableMap = {
  "id": "prologue_wastelands",
  "name": "Terres Desolees",
  "version": 1,
  "world": "kingdom",
  "mode": "story",
  "chapter": "prologue",
  "grid": {
    "width": 75,
    "height": 50,
    "cellSize": 32
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
      "id": "boss_dark_amalgam",
      "assetId": "enemy_shard_01",
      "enemyId": "dark_amalgam",
      "name": "Amalgame des Tenebres",
      "stats": {
        "hp": 520,
        "attack": 16,
        "defense": 5,
        "speed": 72
      },
      "behavior": "boss",
      "aggroRadius": 400,
      "isBoss": true,
      "x": 1980,
      "y": 760
    },
    {
      "id": "shadow_1",
      "assetId": "enemy_shard_01",
      "enemyId": "shadow",
      "name": "Shadow",
      "stats": {
        "hp": 60,
        "attack": 8,
        "defense": 0,
        "speed": 90
      },
      "behavior": "idle",
      "aggroRadius": 280,
      "x": 560,
      "y": 620
    },
    {
      "id": "shadow_2",
      "assetId": "enemy_shard_01",
      "enemyId": "shadow",
      "name": "Shadow",
      "stats": {
        "hp": 60,
        "attack": 8,
        "defense": 0,
        "speed": 90
      },
      "behavior": "idle",
      "aggroRadius": 280,
      "x": 940,
      "y": 340
    },
    {
      "id": "shadow_3",
      "assetId": "enemy_shard_01",
      "enemyId": "shadow",
      "name": "Shadow",
      "stats": {
        "hp": 60,
        "attack": 8,
        "defense": 0,
        "speed": 90
      },
      "behavior": "idle",
      "aggroRadius": 280,
      "x": 1510,
      "y": 520
    },
    {
      "id": "shadow_4",
      "assetId": "enemy_shard_01",
      "enemyId": "shadow",
      "name": "Shadow",
      "stats": {
        "hp": 60,
        "attack": 8,
        "defense": 0,
        "speed": 90
      },
      "behavior": "idle",
      "aggroRadius": 280,
      "x": 2060,
      "y": 700
    },
    {
      "id": "shadow_5",
      "assetId": "enemy_shard_01",
      "enemyId": "shadow",
      "name": "Shadow",
      "stats": {
        "hp": 60,
        "attack": 8,
        "defense": 0,
        "speed": 90
      },
      "behavior": "idle",
      "aggroRadius": 280,
      "x": 360,
      "y": 1060
    }
  ],
  "collisions": [],
  "triggers": [],
  "puzzles": [],
  "spawns": [
    {
      "id": "player_start",
      "x": 1200,
      "y": 800
    }
  ],
  "metadata": {
    "createdWith": "AWorldDreamtLevelEditor",
    "style": "minimal-geometric"
  }
};
