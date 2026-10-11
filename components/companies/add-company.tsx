"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Status =
  | { kind: "idle" }
  | { kind: "working"; step: string }
  | { kind: "done"; companyId: string; name: string; found: number; status: string; message?: string }
  | { kind: "error"; message: string };

const STEPS = ["Finding the careers page…", "Reading open roles…", "Comparing with job platforms…"];

export function AddCompany() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim().length < 2) {
      setStatus({ kind: "error", message: "Enter a company name or website, for example acme.com." });
      return;
    }
    let i = 0;
    setStatus({ kind: "working", step: STEPS[0] });
    const timer = setInterval(() => {
      i = Math.min(i + 1, STEPS.length - 1);
      setStatus({ kind: "working", step: STEPS[i] });
    }, 2500);
    const res = await fetch("/api/companies/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    }).catch(() => null);
    clearInterval(timer);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (!res || !res.ok) {
      setStatus({ kind: "error", message: data.error ?? "Could not reach this careers page. Check the web address or try again later." });
      return;
    }
    setStatus({ kind: "done", companyId: data.companyId, name: data.name, found: data.found, status: data.status, message: data.message });
    setInput("");
    toast.success(`${data.name} added to your watchlist`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="rounded-[8px] border border-border bg-surface p-4">
      <Label htmlFor="company-input">Add company</Label>
      <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
        <Input
          id="company-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Company name or website, e.g. razorpay.com"
          disabled={status.kind === "working"}
        />
        <Button type="submit" variant="primary" disabled={status.kind === "working"}>
          Add company
        </Button>
      </div>
      <div aria-live="polite" className="mt-2 text-small">
        {status.kind === "working" ? (
          <p className="flex items-center gap-2 text-muted">
            <Loader2 className="size-4 animate-spin" aria-hidden /> {status.step}
          </p>
        ) : status.kind === "error" ? (
          <p className="text-danger">{status.message}</p>
        ) : status.kind === "done" ? (
          <p className="text-muted">
            {status.status === "ok"
              ? `${status.name}: found ${status.found} open role${status.found === 1 ? "" : "s"}. `
              : status.status === "manual"
                ? `${status.name}: this careers page can’t be read automatically. Check it manually. `
                : `${status.name}: ${status.message ?? "the careers page could not be reached"}. `}
            <Link href={`/companies/${status.companyId}`} className="text-accent hover:underline">
              Open company
            </Link>
          </p>
        ) : (
          <p className="text-muted">We look for the careers page and check it once a day.</p>
        )}
      </div>
    </form>
  );
}
