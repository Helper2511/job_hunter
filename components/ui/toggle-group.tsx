"use client";

import { Check } from "lucide-react";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";

export const ToggleGroup = ToggleGroupPrimitive.Root;

/** A chip that can be switched on and off; selected chips show a check. */
export function ToggleChip({ className, children, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      className={cn(
        "group inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-border-strong bg-surface px-3.5 text-[15px] md:min-h-9",
        "data-[state=on]:border-accent-soft data-[state=on]:bg-accent-soft data-[state=on]:text-accent-soft-foreground data-[state=on]:font-medium",
        className,
      )}
      {...props}
    >
      <Check className="hidden size-4 group-data-[state=on]:block" aria-hidden />
      {children}
    </ToggleGroupPrimitive.Item>
  );
}
