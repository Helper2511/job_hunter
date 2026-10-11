import { AlertCircle } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

/** Empty state: one sentence on why, one button for the next step. */
export function EmptyState({ message, action, className }: { message: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-[8px] border border-dashed border-border px-4 py-10 text-center", className)}>
      <p className="text-muted">{message}</p>
      {action}
    </div>
  );
}

/** Error state: what went wrong in plain words, and a retry. */
export function ErrorState({ message, action, className }: { message: string; action?: React.ReactNode; className?: string }) {
  return (
    <div role="alert" className={cn("flex flex-col items-center gap-3 rounded-[8px] border border-border px-4 py-10 text-center", className)}>
      <AlertCircle className="size-5 text-danger" aria-hidden />
      <p>{message}</p>
      {action}
    </div>
  );
}
