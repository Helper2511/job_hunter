import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-24 w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-foreground placeholder:text-muted/80",
          "focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50 aria-invalid:border-danger",
          className,
        )}
        {...props}
      />
    );
  },
);
