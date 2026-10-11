"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function saveJob(jobId: string) {
  const user = await requireUser();
  await db.application.upsert({
    where: { userId_jobId: { userId: user.id, jobId } },
    create: { userId: user.id, jobId, method: "saved", status: "SAVED" },
    update: {},
  });
  revalidatePath("/applications");
  return { ok: true };
}

export async function unsaveJob(jobId: string) {
  const user = await requireUser();
  await db.application.deleteMany({ where: { userId: user.id, jobId, status: "SAVED" } });
  revalidatePath("/applications");
  return { ok: true };
}

export async function hideJob(jobId: string) {
  const user = await requireUser();
  await db.hiddenJob.upsert({
    where: { userId_jobId: { userId: user.id, jobId } },
    create: { userId: user.id, jobId },
    update: {},
  });
  return { ok: true };
}

export async function unhideJob(jobId: string) {
  const user = await requireUser();
  await db.hiddenJob.deleteMany({ where: { userId: user.id, jobId } });
  return { ok: true };
}

const savedSearchSchema = z.object({
  name: z.string().trim().min(1, "Give the search a name").max(80),
  query: z.record(z.string(), z.unknown()),
  notify: z.boolean(),
});

export async function createSavedSearch(input: z.infer<typeof savedSearchSchema>) {
  const user = await requireUser();
  const data = savedSearchSchema.parse(input);
  const row = await db.savedSearch.create({
    data: { userId: user.id, name: data.name, query: data.query as object, notify: data.notify },
  });
  return { id: row.id };
}

export async function deleteSavedSearch(id: string) {
  const user = await requireUser();
  await db.savedSearch.deleteMany({ where: { id, userId: user.id } });
  return { ok: true };
}

export async function toggleSavedSearchNotify(id: string, notify: boolean) {
  const user = await requireUser();
  await db.savedSearch.updateMany({ where: { id, userId: user.id }, data: { notify } });
  return { ok: true };
}
