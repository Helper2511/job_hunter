"use client";

import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { linkSocial } from "@/lib/auth-client";
import { GMAIL_SEND_SCOPE } from "@/lib/constants";

export function GmailConnect({ connected, address, configured, callbackURL }: { connected: boolean; address: string | null; configured: boolean; callbackURL: string }) {
  return (
    <div className="flex flex-col gap-3">
      <p>
        Send your resume to HR from your own Gmail address. JobHunt asks only for permission to <strong>send</strong> email.
        It cannot read your inbox.
      </p>
      {connected ? (
        <p className="font-medium">Connected{address ? ` as ${address}` : ""}.</p>
      ) : (
        <Button
          variant="primary"
          className="self-start"
          disabled={!configured}
          onClick={() => linkSocial({ provider: "google", scopes: [GMAIL_SEND_SCOPE], callbackURL })}
        >
          <Mail aria-hidden /> Connect Gmail
        </Button>
      )}
      {!configured ? <p className="text-small text-muted">Google sign-in is not configured on this server yet.</p> : null}
    </div>
  );
}
