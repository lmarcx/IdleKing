import type { GameState } from "./state.js";
import { addQty, type ResourceId, type ResourceStock } from "../resources/types.js";
import { completeStoryLevel } from "../story/levels.js";

export const STORY_LEVEL_PLACEHOLDER_REWARDS = {
  XP_GLOBAL: 100,
  STONE: 20,
  WOOD: 20,
} satisfies ResourceStock;

export type CompleteStoryLevelActionResult = {
  completed: boolean;
  next: GameState;
  rewards: ResourceStock;
};

function applyResourceRewards(stock: ResourceStock, rewards: ResourceStock): ResourceStock {
  let next = stock;

  for (const [resourceId, amount] of Object.entries(rewards) as Array<[ResourceId, number | undefined]>) {
    next = addQty(next, resourceId, amount ?? 0);
  }

  return next;
}

export function completeStoryLevelAction(
  state: GameState,
  levelId: string,
  rewards: ResourceStock = STORY_LEVEL_PLACEHOLDER_REWARDS
): CompleteStoryLevelActionResult {
  const nextStory = completeStoryLevel(state.story, levelId);

  if (nextStory === state.story) {
    return {
      completed: false,
      next: state,
      rewards: {},
    };
  }

  return {
    completed: true,
    next: {
      ...state,
      resources: applyResourceRewards(state.resources, rewards),
      story: nextStory,
    },
    rewards,
  };
}
