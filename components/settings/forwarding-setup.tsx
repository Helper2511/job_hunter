"use client";

import { Check, Copy, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Status {
  confirmation: { subject: string; link: string | null; code: string | null } | null;
  firstAlert: { source: string | null; jobsFound: number } | null;
}

const STEPS = [
  "In Gmail, open Settings → See all settings → Forwarding and POP/IMAP → Add a forwarding address.",
  "Paste the address above. Gmail sends a confirmation email to it; it appears below within a minute. Open its link to confirm.",
  "Create a filter: From contains jobalerts-noreply@linkedin.com OR naukri.com OR glassdoor.com → Forward it to the address above.",
  "Turn on job alerts on LinkedIn, Naukri and Glassdoor if you have not already.",
];

export function ForwardingSetup({ address, poll = true }: { address: string; poll?: boolean }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!poll) return;
    let stop = false;
    async function tick() {
      const res = await fetch("/api/inbound/status").catch(() => null);
      if (res?.ok && !stop) setStatus(await res.json());
    }
    void tick();
    const t = setInterval(tick, 10_000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [poll]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-small text-muted">Your private forwarding address</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <code className="rounded-[6px] border border-border bg-surface px-3 py-2 font-mono text-[15px] break-all">{address}</code>
          <Button
            variant="secondary"
            onClick={async () => {
              await navigator.clipboard.writeText(address);
              setCopied(true);
              toast("Copied");
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? <Check aria-hidden /> : <Copy aria-hidden />} Copy
          </Button>
        </div>
      </div>

      <ol className="flex list-decimal flex-col gap-2 pl-5">
        {STEPS.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <p className="text-small text-muted">
        Forwarding works with any email provider. JobHunt never reads your mailbox; it only sees the emails you forward.
      </p>

      {poll ? (
        <div className="flex flex-col gap-2 rounded-[8px] border border-border p-3" aria-live="polite">
          {status?.confirmation ? (
            <div>
              <p className="flex items-center gap-2 font-medium">
                <Check className="size-4 text-accent" aria-hidden /> Forwarding confirmation received
              </p>
              {status.confirmation.link ? (
                <a href={status.confirmation.link} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  Open the confirmation link
                </a>
              ) : null}
              {status.confirmation.code ? <p className="text-muted">Confirmation code: <span className="font-mono">{status.confirmation.code}</span></p> : null}
            </div>
          ) : null}
          {status?.firstAlert ? (
            <p className="flex items-center gap-2 font-medium">
              <Check className="size-4 text-accent" aria-hidden /> First alert email received
              {status.firstAlert.jobsFound ? ` · ${status.firstAlert.jobsFound} jobs added` : ""}
            </p>
          ) : (
            <p className="flex items-center gap-2 text-muted">
              <Loader2 className="size-4 animate-spin" aria-hidden /> Waiting for your first alert email
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
