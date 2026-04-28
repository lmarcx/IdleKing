import * as React from "react";

import { cn } from "@/lib/utils";

type GamePanelVariant = "default" | "ornate" | "terminal" | "character";

type GamePanelProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: GamePanelVariant;
};

export const GamePanel = React.forwardRef<HTMLDivElement, GamePanelProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "ik-game-panel rounded-xl bg-card text-card-foreground",
        variant === "ornate" && "ik-game-panel--ornate",
        variant === "terminal" && "ik-game-panel--terminal",
        variant === "character" && "ik-game-panel--character",
        className
      )}
      {...props}
    />
  )
);
GamePanel.displayName = "GamePanel";
