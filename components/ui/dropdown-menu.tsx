"use client";

import { Check } from "lucide-react";
import { DropdownMenu as DropdownPrimitive } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;
export const DropdownMenuGroup = DropdownPrimitive.Group;

export function DropdownMenuContent({ className, sideOffset = 6, ...props }: React.ComponentProps<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        sideOffset={sideOffset}
        className={cn("z-50 min-w-48 max-w-[calc(100vw-32px)] rounded-[8px] border border-border bg-surface p-1 shadow-lg", className)}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
}

const itemClass =
  "relative flex min-h-11 md:min-h-9 cursor-default select-none items-center gap-2 rounded-[6px] px-2 py-1.5 text-[15px] outline-none data-[highlighted]:bg-background data-[disabled]:opacity-50";

export function DropdownMenuItem({ className, ...props }: React.ComponentProps<typeof DropdownPrimitive.Item>) {
  return <DropdownPrimitive.Item className={cn(itemClass, className)} {...props} />;
}

export function DropdownMenuCheckboxItem({
  className,
  children,
  hint,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.CheckboxItem> & { hint?: string }) {
  return (
    <DropdownPrimitive.CheckboxItem className={cn(itemClass, "items-start pl-8", className)} {...props}>
      <span className="absolute left-2 top-2.5 flex size-4 items-center justify-center rounded-[4px] border border-border-strong">
        <DropdownPrimitive.ItemIndicator>
          <Check className="size-3.5" aria-hidden />
        </DropdownPrimitive.ItemIndicator>
      </span>
      <span className="flex flex-col">
        <span>{children}</span>
        {hint ? <span className="text-small text-muted">{hint}</span> : null}
      </span>
    </DropdownPrimitive.CheckboxItem>
  );
}

export function DropdownMenuLabel({ className, ...props }: React.ComponentProps<typeof DropdownPrimitive.Label>) {
  return <DropdownPrimitive.Label className={cn("px-2 py-1.5 text-small font-medium text-muted", className)} {...props} />;
}

export function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof DropdownPrimitive.Separator>) {
  return <DropdownPrimitive.Separator className={cn("my-1 h-px bg-border", className)} {...props} />;
}
