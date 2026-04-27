"use client";

import { type SyntheticEvent, useEffect } from "react";
import { motion } from "framer-motion";

import { getResourceAssetPath, RESOURCE_FALLBACK_ASSET } from "@/lib/resource-assets";
import type { ResourceGainPopup as ResourceGainPopupModel } from "@/store/resource-feedback-store";

type ResourceGainPopupProps = {
  onDone: (id: string) => void;
  popup: ResourceGainPopupModel;
};

function handleIconError(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  if (image.src.endsWith(RESOURCE_FALLBACK_ASSET)) return;
  image.src = RESOURCE_FALLBACK_ASSET;
}

export function ResourceGainPopup({ onDone, popup }: ResourceGainPopupProps) {
  useEffect(() => {
    const timeout = window.setTimeout(() => onDone(popup.id), 720);
    return () => window.clearTimeout(timeout);
  }, [onDone, popup.id]);

  return (
    <motion.div
      animate={{
        opacity: 1,
        scale: 1,
        x: popup.xOffset,
        y: popup.yOffset,
      }}
      className="absolute left-1/2 top-1/2 flex items-center gap-2 rounded-full border border-amber-200/30 bg-[#0b0f14]/85 px-4 py-2 font-ik-title text-lg font-semibold text-amber-100 shadow-[0_0_28px_rgba(201,166,84,0.26)] backdrop-blur-sm"
      data-testid="resource-gain-popup"
      exit={{
        opacity: 0,
        scale: 0.95,
        x: popup.xOffset,
        y: popup.yOffset - 60,
      }}
      initial={{
        opacity: 0,
        scale: 0.85,
        x: popup.xOffset,
        y: popup.yOffset + 20,
      }}
      style={{ translate: "-50% -50%" }}
      transition={{
        duration: 0.24,
        ease: "easeOut",
      }}
    >
      <span className="tabular-nums">+{popup.amount}</span>
      <img
        alt={`Icône ${popup.resourceId}`}
        className="h-7 w-7 object-contain drop-shadow-[0_0_8px_rgba(255,224,145,0.28)]"
        draggable={false}
        onError={handleIconError}
        src={getResourceAssetPath(popup.resourceId)}
      />
    </motion.div>
  );
}
