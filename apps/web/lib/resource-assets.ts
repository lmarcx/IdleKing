import type { ResourceId } from "@idleking/game-core/resources/types.js";

export const RESOURCE_FALLBACK_ASSET = "/assets/resources/resource.svg";

export const RESOURCE_ASSETS: Partial<Record<ResourceId, string>> = {
  APPLE: "/assets/resources/apple.svg",
  APRICOT: "/assets/resources/apricot.svg",
  BREAD: "/assets/resources/bread.svg",
  CARROT: "/assets/resources/carrot.svg",
  CHERRY: "/assets/resources/cherry.svg",
  COPPER: "/assets/resources/copper.svg",
  EGG: "/assets/resources/egg.svg",
  GEMS: "/assets/resources/gems.svg",
  GOLD: "/assets/resources/gold.svg",
  GRAPE: "/assets/resources/grape.svg",
  INK: "/assets/resources/ink.svg",
  IRON: "/assets/resources/iron.svg",
  MEAT: "/assets/resources/meat.svg",
  MILK: "/assets/resources/milk.svg",
  MITHRIL: "/assets/resources/mithril.svg",
  ORICHALUM: "/assets/resources/orichalum.svg",
  PAPER: "/assets/resources/paper.svg",
  PEACH: "/assets/resources/peach.svg",
  PLATE_SALAD: "/assets/resources/plate-salad.svg",
  PLATE_STEW: "/assets/resources/plate-stew.svg",
  PLATINUM: "/assets/resources/platinum.svg",
  POTATO: "/assets/resources/potato.svg",
  RAZZBERRY: "/assets/resources/razzberry.svg",
  RUNES: "/assets/resources/runes.svg",
  SALAD: "/assets/resources/salad.svg",
  SCROLLS: "/assets/resources/scrolls.svg",
  SILVER: "/assets/resources/silver.svg",
  STONE: "/assets/resources/stone.svg",
  STRAWBERRY: "/assets/resources/strawberry.svg",
  TOMATO: "/assets/resources/tomato.svg",
  WATER: "/assets/resources/water.svg",
  WHEAT: "/assets/resources/wheat.svg",
  WOOD: "/assets/resources/wood.svg",
  XP_GLOBAL: "/assets/resources/xp-global.svg",
};

export function getResourceAssetPath(resourceId: string) {
  return RESOURCE_ASSETS[resourceId as ResourceId] ?? RESOURCE_FALLBACK_ASSET;
}
