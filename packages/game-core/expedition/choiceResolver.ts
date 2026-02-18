import type { ExpeditionRoom, ChoiceOption } from "./types.js";
import type { RunModifiers } from "./runModifiers.js";
import { applyChoiceToRun } from "./runModifiers.js";

export type ChoicePickResult = {
  picked: ChoiceOption;
  nextModifiers: RunModifiers;
};

export function resolveChoiceRoom(params: {
  room: Extract<ExpeditionRoom, { type: "CHOICE" }>;
  pickId: string; // option id
  modifiers: RunModifiers;
}): ChoicePickResult {
  const opt = params.room.options.find((o) => o.id === params.pickId);
  if (!opt) {
    // if invalid pickId, fallback to first option for safety
    const fallback = params.room.options[0];
    return {
      picked: fallback,
      nextModifiers: applyChoiceToRun(params.modifiers, fallback),
    };
  }

  return {
    picked: opt,
    nextModifiers: applyChoiceToRun(params.modifiers, opt),
  };
}
