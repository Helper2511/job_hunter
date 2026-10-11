import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { classifyInbound } from "@/lib/email/parsers";
import { recipientAddresses, type PostmarkInbound } from "@/lib/email/postmark";
import { EVENTS, sendEvent } from "@/lib/events";
import { processInboundEmail } from "@/lib/inbound";

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/**
 * Postmark posts forwarded job alert emails here. The webhook URL carries the
 * secret either as basic-auth password (https://user:SECRET@host/...) or as ?token=SECRET.
 */
function authorized(request: Request): boolean {
  const secret = process.env.POSTMARK_INBOUND_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const token = new URL(request.url).searchParams.get("token");
  if (token && safeEqual(token, secret)) return true;
  const header = request.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    const decoded = Buffer.from(header.slice(6), "base64").toString();
    const password = decoded.slice(decoded.indexOf(":") + 1);
    return safeEqual(password, secret);
  }
  return false;
}

export async function POST(request: Request) {
  if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
  const payload = (await request.json().catch(() => null)) as PostmarkInbound | null;
  if (!payload?.From) return new Response("Bad request", { status: 400 });

  const addresses = recipientAddresses(payload);
  const user = await db.user.findFirst({ where: { alertAddress: { in: addresses } }, select: { id: true } });
  // Unknown recipient: accept so Postmark does not retry, but store nothing.
  if (!user) return Response.json({ ok: true, matched: false });

  const text = payload.TextBody ?? null;
  const html = payload.HtmlBody ?? null;
  const { kind, source } = classifyInbound(payload.FromFull?.Email ?? payload.From, payload.Subject ?? "", text, html);
  const email = await db.inboundEmail.create({
    data: {
      userId: user.id,
      fromAddress: payload.FromFull?.Email ?? payload.From,
      subject: (payload.Subject ?? "").slice(0, 500),
      textBody: text?.slice(0, 500_000) ?? null,
      htmlBody: html?.slice(0, 1_000_000) ?? null,
      kind,
      source,
    },
  });

  if (kind === "alert") {
    const queued = await sendEvent(EVENTS.alertReceived, { inboundEmailId: email.id });
    if (!queued) await processInboundEmail(email.id);
  }
  return Response.json({ ok: true, matched: true });
}
