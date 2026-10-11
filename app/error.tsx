"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 px-4 text-center" role="alert">
      <h1 className="text-page font-semibold">Something went wrong</h1>
      <p className="text-muted">This page could not load. Check your connection and try again.</p>
      <Button onClick={reset}>Retry</Button>
    </main>
  );
}
