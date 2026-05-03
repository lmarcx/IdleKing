type KingdomDialogueBoxProps = {
  name: string;
  onClose: () => void;
  text: string;
};

export function KingdomDialogueBox({ name, onClose, text }: KingdomDialogueBoxProps) {
  return (
    <div className="pointer-events-auto absolute inset-x-4 bottom-4 z-20 rounded-lg border border-amber-200/30 bg-zinc-950/95 p-4 text-amber-50 shadow-[0_20px_70px_rgba(0,0,0,0.62)] backdrop-blur-sm md:inset-x-12 md:bottom-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-ik-menu text-[11px] uppercase tracking-[0.22em] text-amber-200/70">{name}</div>
          <p className="mt-2 font-ik-body text-sm leading-6 text-amber-50 md:text-base">{text}</p>
          <p className="mt-3 font-ik-menu text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Press F or Escape to close
          </p>
        </div>

        <button
          className="shrink-0 rounded-md border border-amber-200/25 bg-black/35 px-3 py-2 font-ik-menu text-xs text-amber-50 transition hover:border-amber-200/45 hover:bg-amber-500/15"
          onClick={onClose}
          type="button"
        >
          Close
        </button>
      </div>
    </div>
  );
}
