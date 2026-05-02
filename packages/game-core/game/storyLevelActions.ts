import type { GameState } from "./state.js";
import { generateEquipmentLootDrop } from "../equipment/index.js";
import { addItem } from "../items/inventory.js";
import type { EquipmentItem } from "../items/types.js";
import { addQty, type ResourceId, type ResourceStock } from "../resources/types.js";
import { completeStoryLevel } from "../story/levels.js";

export const STORY_LEVEL_PLACEHOLDER_REWARDS = {
  XP_GLOBAL: 100,
  STONE: 20,
  WOOD: 20,
} satisfies ResourceStock;

export type CompleteStoryLevelActionResult = {
  completed: boolean;
  equipmentDrop: EquipmentItem | null;
  next: GameState;
  rewards: ResourceStock;
};

export type CompleteStoryLevelActionOptions = {
  equipmentDropChance?: number;
};

function applyResourceRewards(stock: ResourceStock, rewards: ResourceStock): ResourceStock {
  let next = stock;

  for (const [resourceId, amount] of Object.entries(rewards) as Array<[ResourceId, number | undefined]>) {
    next = addQty(next, resourceId, amount ?? 0);
  }

  return next;
}

function hashLevelSeed(levelId: string, completedCount: number): number {
  let hash = 2166136261;
  const input = `${levelId}:${completedCount}`;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function completeStoryLevelAction(
  state: GameState,
  levelId: string,
  rewards: ResourceStock = STORY_LEVEL_PLACEHOLDER_REWARDS,
  options: CompleteStoryLevelActionOptions = {}
): CompleteStoryLevelActionResult {
  const nextStory = completeStoryLevel(state.story, levelId);

  if (nextStory === state.story) {
    return {
      completed: false,
      equipmentDrop: null,
      next: state,
      rewards: {},
    };
  }

  const equipmentDrop = generateEquipmentLootDrop({
    seed: hashLevelSeed(levelId, state.story.completedLevels.size),
    worldLevel: state.progression.worldLevel,
    chance: options.equipmentDropChance,
  });

  return {
    completed: true,
    equipmentDrop,
    next: {
      ...state,
      resources: applyResourceRewards(state.resources, rewards),
      inventory: equipmentDrop ? addItem(state.inventory, equipmentDrop) : state.inventory,
      story: nextStory,
    },
    rewards,
  };
}
