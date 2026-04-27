import Link from "next/link";

import { cn } from "@/lib/utils";

export type WorldModeNodeProps = {
  className?: string;
  href?: string;
  icon: string;
  label: string;
  status: string;
};

const nodeClassName =
  "group grid w-36 place-items-center gap-2 rounded-xl border border-amber-300/24 bg-black/28 p-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_18px_rgba(56,189,248,0.06)] transition-colors hover:border-cyan-300/45 hover:bg-muted/25 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300/50";

export function WorldModeNode({ className, href, icon, label, status }: WorldModeNodeProps) {
  const content = (
    <>
      <span className="font-ik-title text-base font-semibold tracking-wide">{label}</span>
      <span className="grid h-16 w-16 place-items-center rounded-full border border-border/60 bg-black/30 shadow-[0_0_18px_rgba(201,166,84,0.08)] transition-transform group-hover:scale-105">
        <img alt="" aria-hidden="true" className="h-10 w-10 object-contain" src={icon} />
      </span>
      <span className="font-ik-body text-xs text-muted-foreground">{status}</span>
    </>
  );

  if (href) {
    return (
      <Link className={cn(nodeClassName, className)} href={href}>
        {content}
      </Link>
    );
  }

  return (
    <button className={cn(nodeClassName, className)} type="button">
      {content}
    </button>
  );
}
