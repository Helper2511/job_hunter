"use client";

import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

type Side = "right" | "bottom" | "responsive";

/**
 * Right-side panel on desktop, bottom sheet on mobile ("responsive"),
 * or pinned to one edge.
 */
export function SheetContent({
  side = "responsive",
  className,
  children,
  title,
  description,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { side?: Side; title: string; description?: string }) {
  const position = {
    right: "inset-y-0 right-0 h-full w-full max-w-[480px] border-l animate-sheet-in-right",
    bottom: "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[12px] border-t animate-sheet-in-bottom",
    responsive:
      "inset-x-0 bottom-0 max-h-[100dvh] h-[100dvh] rounded-none border-t animate-sheet-in-bottom md:inset-y-0 md:left-auto md:right-0 md:h-full md:w-full md:max-w-[480px] md:border-l md:border-t-0 md:animate-sheet-in-right",
  }[side];
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40" />
      <DialogPrimitive.Content
        className={cn("fixed z-50 flex flex-col overflow-hidden bg-surface shadow-xl", position, className)}
        {...props}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-3 md:px-5">
          <div>
            <DialogPrimitive.Title className="text-section font-semibold">{title}</DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="text-small text-muted">{description}</DialogPrimitive.Description>
            ) : (
              <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
            )}
          </div>
          <DialogPrimitive.Close className="-mr-2 inline-flex size-11 items-center justify-center rounded-[6px] text-muted hover:text-foreground md:size-9">
            <X className="size-5" aria-hidden />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-5">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
