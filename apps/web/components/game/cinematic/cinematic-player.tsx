"use client";

import { useCallback, useEffect, useState } from "react";

import type { CinematicScript } from "@idleking/game-core";

/** Logical imageKey -> concrete asset path. Falls back to a neutral wasteland bg. */
const IMAGE_BY_KEY: Record<string, string> = {
  wastelands_dawn: "/assets/story-zones/desolated-lands-bg.svg",
  wastelands_ruins: "/assets/story-zones/desolated-lands.svg",
  fragmented_vision: "/assets/story-zones/age-of-gods-bg.svg",
  wastelands_path: "/assets/story-zones/desolated-lands-bg.svg",
};

const FALLBACK_IMAGE = "/assets/story-zones/desolated-lands-bg.svg";

function imageForKey(imageKey?: string): string {
  if (!imageKey) return FALLBACK_IMAGE;
  return IMAGE_BY_KEY[imageKey] ?? FALLBACK_IMAGE;
}

type CinematicPlayerProps = {
  script: CinematicScript;
  onComplete: () => void;
};

export function CinematicPlayer({ script, onComplete }: CinematicPlayerProps) {
  const [index, setIndex] = useState(0);
  const slideCount = script.slides.length;
  const slide = script.slides[index];
  const isLast = index >= slideCount - 1;

  const goNext = useCallback(() => {
    setIndex((current) => {
      if (current >= slideCount - 1) {
        onComplete();
        return current;
      }
      return current + 1;
    });
  }, [onComplete, slideCount]);

  const goPrev = useCallback(() => {
    setIndex((current) => Math.max(0, current - 1));
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " " || event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "Escape") {
        event.preventDefault();
        onComplete();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, onComplete]);

  if (!slide) {
    onComplete();
    return null;
  }

  return (
    <section className="relative grid min-h-[calc(100vh-2rem)] place-items-end overflow-hidden bg-black">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
        key={slide.id}
        style={{ backgroundImage: `url(${imageForKey(slide.imageKey)})` }}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/10" />

      <button
        className="absolute right-5 top-5 z-20 rounded-md border border-amber-200/25 bg-black/45 px-3 py-1.5 font-ik-menu text-xs uppercase tracking-[0.18em] text-amber-100 transition hover:border-amber-100 hover:bg-amber-500/15"
        onClick={onComplete}
        type="button"
      >
        Passer
      </button>

      <div className="relative z-10 w-full px-6 pb-10 md:px-16 md:pb-16">
        <div className="mx-auto max-w-3xl rounded-lg border border-amber-200/30 bg-zinc-950/85 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.62)] backdrop-blur-sm md:p-8">
          {slide.speaker ? (
            <div className="font-ik-menu text-[11px] uppercase tracking-[0.22em] text-amber-200/70">
              {slide.speaker}
            </div>
          ) : null}
          <p className="font-ik-body text-base leading-7 text-amber-50 md:text-lg md:leading-8">{slide.text}</p>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {script.slides.map((s, i) => (
                <span
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-6 bg-amber-300" : "w-1.5 bg-amber-200/30"
                  }`}
                  key={s.id}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                className="rounded-md border border-amber-200/25 bg-black/35 px-4 py-2 font-ik-menu text-xs uppercase tracking-[0.18em] text-amber-100 transition enabled:hover:border-amber-100 enabled:hover:bg-amber-500/15 disabled:opacity-35"
                disabled={index === 0}
                onClick={goPrev}
                type="button"
              >
                Précédent
              </button>
              <button
                className="rounded-md border border-amber-200/45 bg-amber-500/18 px-5 py-2 font-ik-menu text-xs uppercase tracking-[0.18em] text-amber-50 transition hover:border-amber-100 hover:bg-amber-500/24"
                onClick={goNext}
                type="button"
              >
                {isLast ? "Commencer" : "Suivant"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
