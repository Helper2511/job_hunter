import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, type = "text", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex min-h-11 w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-foreground placeholder:text-muted/80 md:min-h-9",
        "focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50 aria-invalid:border-danger",
        "file:mr-3 file:border-0 file:bg-transparent file:text-[13px] file:font-medium",
        className,
      )}
      {...props}
    />
  );
});
