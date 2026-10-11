"use client";

import { Briefcase, Building2, KanbanSquare, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/jobs", label: "Jobs", short: "Jobs", icon: Briefcase },
  { href: "/companies", label: "Companies", short: "Companies", icon: Building2 },
  { href: "/applications", label: "Applications", short: "Applied", icon: KanbanSquare },
  { href: "/settings", label: "Settings", short: "Me", icon: Settings },
] as const;

function useActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({ collapsed = false }: { collapsed?: boolean }) {
  const isActive = useActive();
  return (
    <ul className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              title={collapsed ? label : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-[6px] px-3 text-[15px] md:min-h-10",
                collapsed && "justify-center px-0",
                active ? "bg-accent-soft font-medium text-accent-soft-foreground" : "text-muted hover:bg-border/50 hover:text-foreground",
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span className={cn(collapsed && "sr-only")}>{label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function BottomNav() {
  const isActive = useActive();
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="grid grid-cols-4">
        {NAV_ITEMS.map(({ href, short, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "mx-1 my-1 flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-[6px] text-[13px]",
                  active ? "bg-accent-soft font-medium text-accent-soft-foreground" : "text-muted",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {short}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
