import { json, withUser } from "@/lib/api";
import { db } from "@/lib/db";

export async function GET() {
  return withUser(async (userId) => {
    const items = await db.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 30 });
    return json({ items });
  });
}

/** Mark everything as read. */
export async function POST() {
  return withUser(async (userId) => {
    await db.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
    return json({ ok: true });
  });
}
