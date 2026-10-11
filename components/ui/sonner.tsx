"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={(resolvedTheme as "light" | "dark") ?? "system"}
      duration={4000}
      position="bottom-right"
      mobileOffset={{ bottom: 80 }}
      className="[--width:min(360px,calc(100vw-32px))]"
      toastOptions={{
        classNames: {
          toast: "!bg-surface !text-foreground !border-border !rounded-[8px]",
          description: "!text-muted",
          actionButton: "!bg-accent !text-on-accent",
        },
      }}
    />
  );
}
