"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path fill="currentColor" d="M21.6 12.23c0-.68-.06-1.36-.18-2.02H12v3.83h5.4a4.62 4.62 0 0 1-2 3.03v2.5h3.24c1.9-1.75 2.96-4.33 2.96-7.34z" />
      <path fill="currentColor" opacity=".75" d="M12 22c2.7 0 4.97-.9 6.63-2.43l-3.24-2.5c-.9.6-2.05.95-3.39.95-2.6 0-4.81-1.76-5.6-4.12H3.06v2.58A10 10 0 0 0 12 22z" />
      <path fill="currentColor" opacity=".55" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.52H3.06a10 10 0 0 0 0 8.96L6.4 13.9z" />
      <path fill="currentColor" opacity=".9" d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.6 9.6 0 0 0 12 2 10 10 0 0 0 3.06 7.52L6.4 10.1C7.19 7.74 9.4 5.98 12 5.98z" />
    </svg>
  );
}

export function SignInButtons({ next = "/jobs" }: { next?: string }) {
  const [pending, setPending] = useState<"google" | "linkedin" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function go(provider: "google" | "linkedin") {
    setPending(provider);
    setError(null);
    const res = await signIn.social({ provider, callbackURL: next, newUserCallbackURL: "/onboarding" });
    if (res?.error) {
      setError("Sign-in did not start. Check your connection and try again.");
      setPending(null);
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <Button variant="primary" onClick={() => go("linkedin")} disabled={pending !== null}>
        <span aria-hidden className="text-[13px] font-bold">in</span>
        {pending === "linkedin" ? "Opening LinkedIn…" : "Continue with LinkedIn"}
      </Button>
      <Button variant="secondary" onClick={() => go("google")} disabled={pending !== null}>
        <GoogleMark />
        {pending === "google" ? "Opening Google…" : "Continue with Google"}
      </Button>
      {error ? (
        <p role="alert" className="text-small text-danger">
          {error}
        </p>
      ) : null}
      <p className="text-small text-muted">
        We never ask for your LinkedIn, Naukri or Glassdoor password.
      </p>
    </div>
  );
}
