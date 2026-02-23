"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasPersistedSave, useGameStore } from "@/store/game-store";

export default function StartScreenPage() {
  const router = useRouter();
  const [confirmClear, setConfirmClear] = useState(false);
  const [canLoad, setCanLoad] = useState(false);
  const newGame = useGameStore((s) => s.newGame);
  const loadGame = useGameStore((s) => s.loadGame);
  const clearSave = useGameStore((s) => s.clearSave);

  useEffect(() => {
    setCanLoad(hasPersistedSave());
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center p-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl">IdleKing Offline MVP</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Start a fresh run or load the latest local save.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <Button
              onClick={() => {
                newGame();
                router.push("/game/boto");
              }}
            >
              New Game
            </Button>
            <Button
              variant="secondary"
              disabled={!canLoad}
              onClick={() => {
                loadGame();
                router.push("/game/boto");
              }}
            >
              Load Game
            </Button>
            <Button variant="destructive" onClick={() => setConfirmClear(true)}>
              Clear Save
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete local save?</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                clearSave();
                setCanLoad(false);
                setConfirmClear(false);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
