import * as React from "react";
import { cn } from "@/lib/utils";

/** Native select styled to match inputs: accessible and light on phones. */
export const NativeSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function NativeSelect({ className, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn("min-h-11 w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-foreground md:min-h-9", className)}
        {...props}
      />
    );
  },
);
