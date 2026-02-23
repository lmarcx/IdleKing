import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface HoloPanelProps {
  children: ReactNode;
  className?: string;
}

export function HoloPanel({ children, className }: HoloPanelProps) {
  return (
    <div className={cn("ik-holo-panel p-6", className)}>
      {children}
    </div>
  );
}