import Link from "next/link";

import { MAP_MANIFEST } from "@idleking/game-core/level-editor";

export default function CustomMapIndexPage() {
  return (
    <div className="min-h-screen bg-[#070707] p-6 text-zinc-100">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-ik-title text-3xl">Custom Maps</h1>
        <div className="mt-6 grid gap-3">
          {MAP_MANIFEST.maps.map((map) => (
            <Link className="rounded-md border border-zinc-800 bg-zinc-950 p-4 hover:border-zinc-200" href={`/game/custom-map/${map.id}`} key={map.id}>
              <span className="block font-ik-menu text-sm">{map.name}</span>
              <span className="mt-1 block text-xs text-zinc-500">{map.world} / {map.chapter}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
