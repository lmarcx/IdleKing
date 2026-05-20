"use client";

import { useMemo } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/store/game-store";

export function OfflineSummaryModal() {
  const offlineReport = useGameStore((s) => s.offlineReport);
  const dismiss = useGameStore((s) => s.dismissOfflineReport);

  const topGains = useMemo(() => {
    if (!offlineReport) return [];

    return Object.entries(offlineReport.diff.resourcesGained)
      .map(([id, qty]) => ({ id, qty: Math.floor(Number(qty ?? 0)) }))
      .filter((row) => row.qty > 0)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [offlineReport]);

  const hasVisibleProgress = topGains.length > 0 || (offlineReport?.diff.staminaSpent ?? 0) > 0;

  if (offlineReport && !hasVisibleProgress) return null;

  return (
    <Dialog open={Boolean(offlineReport)} onOpenChange={(open) => !open && dismiss()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Offline Summary</DialogTitle>
          <DialogDescription>
            Away for {offlineReport?.minutesAway ?? 0} min (simulated: {offlineReport?.cappedMinutes ?? 0} min)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div>
            <p className="font-ik-body mb-1 font-medium">Top resource gains</p>
            {topGains.length === 0 ? (
              <p className="font-ik-body text-muted-foreground">No positive resource gains.</p>
            ) : (
              <ul className="space-y-1">
                {topGains.map((gain) => (
                  <li key={gain.id} className="flex justify-between">
                    <span className="text-muted-foreground">{gain.id}</span>
                    <span>+{gain.qty}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="font-ik-body">Stamina spent: {offlineReport?.diff.staminaSpent ?? 0}</p>
        </div>

        <DialogFooter>
          <Button onClick={dismiss}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
