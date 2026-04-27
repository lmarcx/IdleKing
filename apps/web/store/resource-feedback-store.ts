"use client";

import { create } from "zustand";

import type { ResourceId } from "@idleking/game-core/resources/types.js";

export type ResourceGain = {
  amount: number;
  resourceId: ResourceId;
};

export type ResourceGainPopup = ResourceGain & {
  createdAt: number;
  id: string;
  xOffset: number;
  yOffset: number;
};

type ResourceFeedbackStore = {
  dismissResourceGainPopup: (id: string) => void;
  resourceGainPopups: ResourceGainPopup[];
  showResourceGain: (gained: ResourceGain | ResourceGain[]) => void;
};

let popupSequence = 0;

function createResourceGainPopup(gain: ResourceGain): ResourceGainPopup {
  popupSequence += 1;

  return {
    ...gain,
    createdAt: Date.now(),
    id: `resource-gain-${Date.now()}-${popupSequence}`,
    xOffset: ((popupSequence % 5) - 2) * 28,
    yOffset: -((popupSequence % 3) * 12),
  };
}

export const useResourceFeedbackStore = create<ResourceFeedbackStore>((set) => ({
  dismissResourceGainPopup: (id) =>
    set((current) => ({
      resourceGainPopups: current.resourceGainPopups.filter((popup) => popup.id !== id),
    })),
  resourceGainPopups: [],
  showResourceGain: (gained) => {
    const gains = Array.isArray(gained) ? gained : [gained];
    const popups = gains.filter((gain) => gain.amount > 0).map(createResourceGainPopup);

    if (popups.length === 0) return;

    set((current) => ({
      resourceGainPopups: [...current.resourceGainPopups, ...popups].slice(-8),
    }));
  },
}));
