import "server-only";
import { db } from "@/lib/db";
import { todayKey } from "@/lib/utils";

export type UsageKind = "email" | "llm";

export async function getUsage(userId: string, kind: UsageKind): Promise<number> {
  const row = await db.usageCounter.findUnique({ where: { userId_day_kind: { userId, day: todayKey(), kind } } });
  return row?.count ?? 0;
}

/** Increment today's counter if it is below the limit. Returns false when the limit is reached. */
export async function consumeUsage(userId: string, kind: UsageKind, limit: number): Promise<boolean> {
  const day = todayKey();
  const row = await db.usageCounter.upsert({
    where: { userId_day_kind: { userId, day, kind } },
    create: { userId, day, kind, count: 0 },
    update: {},
  });
  if (row.count >= limit) return false;
  const updated = await db.usageCounter.updateMany({
    where: { id: row.id, count: { lt: limit } },
    data: { count: { increment: 1 } },
  });
  return updated.count === 1;
}

export async function releaseUsage(userId: string, kind: UsageKind) {
  await db.usageCounter.updateMany({
    where: { userId, day: todayKey(), kind, count: { gt: 0 } },
    data: { count: { decrement: 1 } },
  });
}
