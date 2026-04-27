"use client";

import { AnimatePresence } from "framer-motion";

import { ResourceGainPopup } from "@/components/game/resource-gain-popup";
import { useResourceFeedbackStore } from "@/store/resource-feedback-store";

export function ResourceGainPopupLayer() {
  const popups = useResourceFeedbackStore((state) => state.resourceGainPopups);
  const dismissResourceGainPopup = useResourceFeedbackStore((state) => state.dismissResourceGainPopup);

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">
      <AnimatePresence>
        {popups.map((popup) => (
          <ResourceGainPopup key={popup.id} popup={popup} onDone={dismissResourceGainPopup} />
        ))}
      </AnimatePresence>
    </div>
  );
}
