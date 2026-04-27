"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { GamePanel } from "@/components/ui/game-panel";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/game/boto", label: "Boto" },
  { href: "/game/character", label: "Character" },
  { href: "/game/inventory", label: "Inventory" },
  { href: "/game/worlds", label: "Worlds" },
  { href: "/game/kingdom", label: "Kingdom" },
  { href: "/game/skills", label: "Skills" },
  { href: "/game/settings", label: "Settings" },
];

export function LeftNav() {
  const pathname = usePathname();

  return (
    <GamePanel variant="ornate" className="p-3">
      <p className="font-ik-menu mb-3 text-xs uppercase tracking-wide text-muted-foreground">Navigation</p>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "font-ik-menu block rounded-md px-3 py-2 text-sm",
                active ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </GamePanel>
  );
}
