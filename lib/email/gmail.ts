import "server-only";

/**
 * Sending through the Gmail API with the `gmail.send` scope only.
 * The app never reads the user's mailbox.
 */

export { GMAIL_SEND_SCOPE } from "@/lib/constants";

export interface OutgoingEmail {
  from: string;
  fromName?: string;
  to: string;
  subject: string;
  text: string;
  attachment?: { filename: string; contentType: string; data: Uint8Array };
}

function encodeHeader(value: string): string {
  // RFC 2047 for non-ASCII subjects and names.
  return /[^\x20-\x7e]/.test(value) ? `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=` : value;
}

function wrap76(b64: string): string {
  return b64.replace(/.{1,76}/g, (m) => `${m}\r\n`).trimEnd();
}

export function buildMime(email: OutgoingEmail, boundary = `jh_${Date.now().toString(36)}`): string {
  const from = email.fromName ? `${encodeHeader(email.fromName)} <${email.from}>` : email.from;
  const headers = [
    `From: ${from}`,
    `To: ${email.to}`,
    `Subject: ${encodeHeader(email.subject)}`,
    "MIME-Version: 1.0",
  ];
  const textPart = wrap76(Buffer.from(email.text, "utf8").toString("base64"));
  if (!email.attachment) {
    return [...headers, 'Content-Type: text/plain; charset="UTF-8"', "Content-Transfer-Encoding: base64", "", textPart].join("\r\n");
  }
  const a = email.attachment;
  return [
    ...headers,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    textPart,
    `--${boundary}`,
    `Content-Type: ${a.contentType}; name="${a.filename}"`,
    `Content-Disposition: attachment; filename="${a.filename}"`,
    "Content-Transfer-Encoding: base64",
    "",
    wrap76(Buffer.from(a.data).toString("base64")),
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

export class GmailError extends Error {
  constructor(
    message: string,
    public needsReconnect = false,
  ) {
    super(message);
  }
}

export async function sendGmail(accessToken: string, email: OutgoingEmail): Promise<{ id: string }> {
  const raw = Buffer.from(buildMime(email)).toString("base64url");
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw }),
  });
  if (res.status === 401 || res.status === 403) {
    throw new GmailError("Gmail needs to be connected again in Settings.", true);
  }
  if (!res.ok) throw new GmailError("Gmail could not send this email. Try again in a minute.");
  return (await res.json()) as { id: string };
}

export async function fetchGoogleEmail(accessToken: string): Promise<string | null> {
  const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { email?: string };
  return data.email ?? null;
}
