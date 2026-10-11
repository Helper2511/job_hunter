"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { db } from "@/lib/db";
import { ensurePrep } from "@/lib/prep/create";
import { requireUser } from "@/lib/session";

const FOLLOW_UP_DAYS = 7;

export async function moveApplication(id: string, status: (typeof APPLICATION_STATUSES)[number]) {
  const user = await requireUser();
  z.enum(APPLICATION_STATUSES).parse(status);
  const app = await db.application.findFirst({ where: { id, userId: user.id } });
  if (!app) return { error: "This application no longer exists." };
  const data: { status: string; appliedAt?: Date; followUpAt?: Date | null } = { status };
  if (app.status === "SAVED" && status !== "SAVED") {
    data.appliedAt = new Date();
    data.followUpAt = status === "APPLIED" ? new Date(Date.now() + FOLLOW_UP_DAYS * 86_400_000) : null;
  }
  await db.application.update({ where: { id }, data });
  let prepId: string | null = null;
  if (status === "INTERVIEW") prepId = (await ensurePrep(id, user.id)).id;
  revalidatePath("/applications");
  return { ok: true, prepId };
}

export async function deleteApplication(id: string) {
  const user = await requireUser();
  await db.application.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/applications");
  return { ok: true };
}

/** "Mark as not applied" after a mis-click: drop back to saved, or remove. */
export async function markNotApplied(jobId: string) {
  const user = await requireUser();
  await db.application.deleteMany({ where: { userId: user.id, jobId } });
  revalidatePath("/applications");
  return { ok: true };
}

export async function updateApplicationNotes(id: string, notes: string, followUpAt: string | null) {
  const user = await requireUser();
  await db.application.updateMany({
    where: { id, userId: user.id },
    data: { notes: notes.slice(0, 5000), followUpAt: followUpAt ? new Date(followUpAt) : null, followUpNotifiedAt: null },
  });
  revalidatePath("/applications");
  return { ok: true };
}
