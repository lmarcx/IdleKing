import { WorldModeNode } from "./world-mode-node";

const WORLD_MODES = [
  {
    href: "/game/worlds",
    icon: "/assets/worlds/story.svg",
    label: "Story",
    position: "left-1/2 top-0 -translate-x-1/2",
    status: "Enter timeline",
  },
  {
    href: undefined,
    icon: "/assets/worlds/expeditions.svg",
    label: "Expeditions",
    position: "bottom-0 left-0",
    status: "Bientot disponible",
  },
  {
    href: undefined,
    icon: "/assets/worlds/duel.svg",
    label: "Duel",
    position: "bottom-0 right-0",
    status: "Bientot disponible",
  },
] as const;

export function WorldModeTriangle() {
  return (
    <section aria-label="World modes" className="grid min-h-[34rem] place-items-center py-6">
      <div className="relative hidden h-[30rem] w-full max-w-[44rem] sm:block">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          viewBox="0 0 704 480"
        >
          <defs>
            <linearGradient id="world-triangle-line" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="rgba(201,166,84,0.72)" />
              <stop offset="0.5" stopColor="rgba(56,189,248,0.55)" />
              <stop offset="1" stopColor="rgba(168,85,247,0.48)" />
            </linearGradient>
          </defs>
          <path
            d="M352 83 120 382h464L352 83Z"
            fill="none"
            stroke="url(#world-triangle-line)"
            strokeWidth="1.5"
          />
          <path
            d="M352 83 120 382h464L352 83Z"
            fill="none"
            stroke="rgba(56,189,248,0.16)"
            strokeWidth="10"
            strokeLinecap="round"
            filter="blur(10px)"
          />
          <circle cx="352" cy="83" r="5" fill="rgba(201,166,84,0.85)" />
          <circle cx="120" cy="382" r="5" fill="rgba(56,189,248,0.78)" />
          <circle cx="584" cy="382" r="5" fill="rgba(168,85,247,0.72)" />
        </svg>

        <div className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/5 blur-3xl" />

        {WORLD_MODES.map((mode) => (
          <WorldModeNode
            className={`absolute ${mode.position}`}
            href={mode.href}
            icon={mode.icon}
            key={mode.label}
            label={mode.label}
            status={mode.status}
          />
        ))}
      </div>

      <div className="grid w-full max-w-xs gap-3 sm:hidden">
        {WORLD_MODES.map((mode) => (
          <WorldModeNode
            href={mode.href}
            icon={mode.icon}
            key={mode.label}
            label={mode.label}
            status={mode.status}
          />
        ))}
      </div>
    </section>
  );
}
