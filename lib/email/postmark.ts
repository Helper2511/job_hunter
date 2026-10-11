import "server-only";
import { ServerClient } from "postmark";
import { features } from "@/lib/env";

let client: ServerClient | null = null;

function getClient() {
  if (!features.postmark) return null;
  client ??= new ServerClient(process.env.POSTMARK_SERVER_TOKEN!);
  return client;
}

/** Notification email (new matches, reminders). Skipped quietly when Postmark is not set up. */
export async function sendNotificationEmail(to: string, subject: string, text: string): Promise<boolean> {
  const c = getClient();
  const from = process.env.POSTMARK_FROM_ADDRESS;
  if (!c || !from) return false;
  await c.sendEmail({ From: from, To: to, Subject: subject, TextBody: text, MessageStream: "outbound" });
  return true;
}

/** The fields of Postmark's inbound webhook payload that the app reads. */
export interface PostmarkInbound {
  From: string;
  FromFull?: { Email: string; Name?: string };
  To: string;
  ToFull?: { Email: string }[];
  OriginalRecipient?: string;
  Subject: string;
  TextBody?: string;
  HtmlBody?: string;
  MessageID?: string;
}

/** Find the private alert address the email was sent to. */
export function recipientAddresses(payload: PostmarkInbound): string[] {
  const all = [payload.OriginalRecipient, ...(payload.ToFull ?? []).map((t) => t.Email), ...payload.To.split(",")];
  return all
    .filter((a): a is string => Boolean(a))
    .map((a) => a.replace(/.*</, "").replace(/>.*/, "").trim().toLowerCase());
}
