import type { ItemRarity } from "../../items/types.js";
import type { ResourceId, ResourceStock } from "../../resources/types.js";
import type { MiniGameRunState, MiniGameTemporaryItemReward } from "../types.js";

export type KitchenRecipeId = "STEW" | "SALAD" | (string & {});

export type KitchenPatternInput = "up" | "down" | "left" | "right";

export type KitchenRecipe = {
  id: KitchenRecipeId;
  name: string;
  ingredientCosts: ResourceStock;
  rarity: ItemRarity;
  baseRewardItemId: string;
  patternComplexity: number;
};

export type KitchenResourceTarget = {
  id: string;
  resourceId: ResourceId;
  isRecipeResource: boolean;
  resolved: boolean;
};

export type KitchenRunState = {
  recipe: KitchenRecipe;
  successPoints: number;
  currentPattern: KitchenPatternInput[];
  currentPatternProgress: number;
  correctStreak: number;
  completedPatterns: number;
  resourceTargets?: KitchenResourceTarget[];
  quality?: number;
  seed: number;
};

export type ActiveKitchenRunState = MiniGameRunState & {
  kind: "kitchen";
  kitchen: KitchenRunState;
};

export type KitchenConsumableReward = MiniGameTemporaryItemReward;
