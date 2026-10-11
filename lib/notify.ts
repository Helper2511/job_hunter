import "server-only";
import { db } from "@/lib/db";
import { sendNotificationEmail } from "@/lib/email/postmark";
import { notificationEmail } from "@/lib/email/templates";
import { env } from "@/lib/env";

/** In-app notification, plus email when the user has it turned on. */
export async function notifyUser(userId: string, n: { title: string; body?: string; url?: string; email?: boolean }) {
  await db.notification.create({ data: { userId, title: n.title, body: n.body ?? null, url: n.url ?? null } });
  if (n.email === false) return;
  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, notifyByEmail: true } });
  if (!user?.notifyByEmail) return;
  const mail = notificationEmail(n.title, n.body ? [n.body] : [], `${env.appUrl}${n.url ?? "/jobs"}`);
  try {
    await sendNotificationEmail(user.email, mail.subject, mail.text);
  } catch {
    // In-app notification is already stored.
  }
}
