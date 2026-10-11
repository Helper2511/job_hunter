import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[6px] text-[15px] font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 min-h-11 md:min-h-9",
  {
    variants: {
      variant: {
        primary: "bg-accent text-on-accent hover:opacity-90",
        secondary: "border border-border-strong bg-surface text-foreground hover:bg-background",
        quiet: "text-muted hover:text-foreground hover:bg-border/50",
        destructive: "border border-danger text-danger bg-transparent hover:bg-danger hover:text-surface",
        destructiveFill: "bg-danger text-surface hover:opacity-90",
        link: "text-accent underline-offset-4 hover:underline min-h-0 md:min-h-0 px-0",
      },
      size: {
        default: "px-4 py-2",
        sm: "px-3 py-1 text-[13px] md:min-h-8",
        icon: "size-11 md:size-9 p-0",
      },
    },
    defaultVariants: { variant: "secondary", size: "default" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild = false, ...props },
  ref,
) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
