import Link from "next/link";
import { notFound } from "next/navigation";

import { CustomMapPixiStage } from "@/components/game/custom-map/custom-map-pixi-stage";
import { CUSTOM_MAPS, MAP_MANIFEST } from "@idleking/game-core/level-editor";

export default async function CustomMapPage({ params }: { params: Promise<{ mapId: string }> }) {
  const { mapId } = await params;
  const map = CUSTOM_MAPS.find((item) => item.id === mapId);
  const manifestEntry = MAP_MANIFEST.maps.find((item) => item.id === mapId);
  if (!map || !manifestEntry) notFound();

  return (
    <div className="min-h-screen bg-[#070707] text-zinc-100">
      <header className="flex items-center justify-between border-b border-zinc-800 bg-black px-4 py-3">
        <div>
          <h1 className="font-ik-title text-xl">{map.name}</h1>
          <p className="text-xs text-zinc-500">{manifestEntry.path}</p>
        </div>
        <div className="flex gap-2">
          <Link className="rounded-md border border-zinc-800 px-3 py-2 text-sm hover:border-zinc-200" href="/editor">Editor</Link>
          <Link className="rounded-md border border-zinc-800 px-3 py-2 text-sm hover:border-zinc-200" href="/game/kingdom">Kingdom</Link>
        </div>
      </header>
      <main className="h-[calc(100vh-73px)]">
        <CustomMapPixiStage map={map} />
      </main>
    </div>
  );
}
