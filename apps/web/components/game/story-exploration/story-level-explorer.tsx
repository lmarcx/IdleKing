"use client";

import { useState } from "react";

import { ExplorationHud, type ExplorerHudLevel } from "./exploration-hud";
import { PixiExplorationStage } from "./pixi-exploration-stage";

type StoryLevelExplorerProps = {
  level: ExplorerHudLevel;
};

const MAP_WIDTH = 2400;
const MAP_HEIGHT = 1600;

export function StoryLevelExplorer({ level }: StoryLevelExplorerProps) {
  const [playerPosition, setPlayerPosition] = useState({
    x: MAP_WIDTH / 2,
    y: MAP_HEIGHT / 2,
  });

  return (
    <section className="relative h-[calc(100vh-2rem)] min-h-[44rem] overflow-hidden rounded-xl border border-amber-200/25 bg-black shadow-[0_22px_70px_rgba(0,0,0,0.48)]">
      <PixiExplorationStage mapHeight={MAP_HEIGHT} mapWidth={MAP_WIDTH} onPlayerMove={setPlayerPosition} />
      <ExplorationHud level={level} playerPosition={playerPosition} />
      <div className="pointer-events-none absolute inset-x-4 bottom-4 z-10 rounded-lg border border-amber-200/18 bg-black/55 px-4 py-2 font-ik-body text-xs text-muted-foreground">
        Deplacement : WASD, ZQSD ou fleches directionnelles.
      </div>
    </section>
  );
}
