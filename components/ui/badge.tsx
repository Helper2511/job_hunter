import { cva, type VariantProps } from "class-variance-authority";
import { Building2 } from "lucide-react";
import * as React from "react";
import { STATUS_LABEL, type ApplicationStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[13px] leading-5 font-medium whitespace-nowrap", {
  variants: {
    variant: {
      neutral: "bg-neutral-badge text-muted",
      highlight: "bg-highlight text-highlight-foreground",
      SAVED: "bg-status-saved text-status-saved-foreground",
      APPLIED: "bg-status-applied text-status-applied-foreground",
      INTERVIEW: "bg-status-interview text-status-interview-foreground",
      OFFER: "bg-status-offer text-status-offer-foreground",
      REJECTED: "bg-status-rejected text-status-rejected-foreground",
    },
  },
  defaultVariants: { variant: "neutral" },
});

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function CareerPageOnlyTag({ className }: { className?: string }) {
  return (
    <Badge variant="highlight" className={className}>
      <Building2 className="size-3.5" aria-hidden />
      Career page only
    </Badge>
  );
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const s = (status in STATUS_LABEL ? status : "SAVED") as ApplicationStatus;
  return (
    <Badge variant={s} className={className}>
      {STATUS_LABEL[s]}
    </Badge>
  );
}
