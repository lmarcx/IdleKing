"use client";

import { useEffect } from "react";

import { useGameHudOverlay, type GameHudOverlayId } from "./game-hud-overlays";

const SHORTCUT_OVERLAY_BY_KEY_CODE: Record<string, GameHudOverlayId> = {
  KeyI: "inventory",
  KeyP: "character",
  KeyK: "skills",
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";
}

/**
 * Global I/P/S overlay toggles. Mounted once inside GameHudOverlayProvider so
 * it works across every /game/* route (canvas stages and standalone pages
 * alike). Movement/combat keydown listeners already gate on
 * useGameHudOverlay().isOverlayOpen once an overlay is open — this only
 * decides whether to open/close/switch the overlay itself.
 */
export function GameHudShortcuts() {
  const { activeOverlay, closeOverlay, openOverlay } = useGameHudOverlay();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;

      const overlayId = SHORTCUT_OVERLAY_BY_KEY_CODE[event.code];
      if (!overlayId) return;
      if (isTypingTarget(event.target)) return;

      event.preventDefault();
      if (activeOverlay === overlayId) {
        closeOverlay();
      } else {
        openOverlay(overlayId);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeOverlay, closeOverlay, openOverlay]);

  return null;
}
