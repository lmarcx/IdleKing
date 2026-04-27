import * as React from "react";

import { cn } from "@/lib/utils";

export const GamePanel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("ik-game-panel rounded-xl bg-card text-card-foreground", className)} {...props} />
  )
);
GamePanel.displayName = "GamePanel";
