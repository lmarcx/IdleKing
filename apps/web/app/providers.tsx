"use client";

import { useEffect } from "react";

import { AppToaster } from "@/components/app-toaster";
import { initGameStoreAutosave } from "@/store/game-store";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initGameStoreAutosave();
  }, []);

  return (
    <>
      {children}
      <AppToaster />
    </>
  );
}
