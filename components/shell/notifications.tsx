"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, relativeDate } from "@/lib/utils";

interface Item {
  id: string;
  title: string;
  body: string | null;
  url: string | null;
  readAt: string | null;
  createdAt: string;
}

export function Notifications({
  unread,
  compact = false,
  side = "right",
}: {
  unread: number;
  compact?: boolean;
  side?: "right" | "bottom";
}) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [count, setCount] = useState(unread);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => {
        if (cancelled) return;
        setItems(d.items);
        setCount(0);
        if (d.items.some((i: Item) => !i.readAt)) fetch("/api/notifications", { method: "POST" });
      })
      .catch(() => setItems([]));
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "relative inline-flex min-h-11 items-center gap-3 rounded-[6px] px-3 text-muted hover:bg-border/50 hover:text-foreground md:min-h-10",
          compact && "justify-center px-0",
        )}
      >
        <Bell className="size-5" aria-hidden />
        <span className={cn(compact && "sr-only")}>Updates</span>
        {count > 0 ? (
          <span className="tabular ml-auto rounded-full bg-accent px-1.5 text-[13px] leading-5 text-on-accent" aria-label={`${count} new`}>
            {count}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent side={side} align="end" className="w-80 p-0">
        <h2 className="border-b border-border px-3 py-2 font-semibold">Updates</h2>
        <div className="max-h-96 overflow-y-auto">
          {items === null ? (
            <div className="space-y-2 p-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : items.length === 0 ? (
            <p className="p-3 text-small text-muted">Nothing new. Updates about watched companies and interviews show up here.</p>
          ) : (
            <ul>
              {items.map((n) => (
                <li key={n.id} className="border-b border-border last:border-0">
                  <Link href={n.url ?? "/jobs"} onClick={() => setOpen(false)} className="block px-3 py-2 hover:bg-background">
                    <p className={cn("text-[15px]", !n.readAt && "font-medium")}>{n.title}</p>
                    {n.body ? <p className="text-small text-muted">{n.body}</p> : null}
                    <p className="text-small text-muted">{relativeDate(n.createdAt)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
