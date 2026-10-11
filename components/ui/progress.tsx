"use client";

import { Progress as ProgressPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export function Progress({ value, className, label }: { value: number; className?: string; label: string }) {
  return (
    <ProgressPrimitive.Root value={value} aria-label={label} className={cn("relative h-2 w-full overflow-hidden rounded-full bg-border", className)}>
      <ProgressPrimitive.Indicator className="h-full bg-accent transition-transform duration-200" style={{ transform: `translateX(-${100 - value}%)` }} />
    </ProgressPrimitive.Root>
  );
}
