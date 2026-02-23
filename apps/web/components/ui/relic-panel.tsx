import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type RelicPanelVariant = "default" | "gold" | "xp" | "wxp";

interface RelicPanelProps {
  children: ReactNode;
  variant?: RelicPanelVariant;
  className?: string;
}

export function RelicPanel({
  children,
  variant = "default",
  className,
}: RelicPanelProps) {
  const variantClass =
    variant === "gold"
      ? "ik-relic-panel--gold"
      : variant === "xp"
      ? "ik-relic-panel--xp"
      : variant === "wxp"
      ? "ik-relic-panel--wxp"
      : "";

  return (
    <div
      className={cn(
        "ik-relic-panel p-5",
        variantClass,
        className
      )}
    >
      {children}
    </div>
  );
}