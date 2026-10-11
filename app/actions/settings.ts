"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { db } from "@/lib/db";
import { MAX_DAILY_EMAILS } from "@/lib/constants";
import { deleteResumeFiles } from "@/lib/storage";
import { preferencesSchema, profileSchema } from "@/lib/schemas";
import { requireUser } from "@/lib/session";

export async function updateProfile(input: z.infer<typeof profileSchema>) {
  const user = await requireUser();
  const data = profileSchema.parse(input);
  await db.user.update({
    where: { id: user.id },
    data: {
      name: data.name,
      phone: data.phone || null,
      noticePeriod: data.noticePeriod || null,
      linkedinUrl: data.linkedinUrl || null,
      naukriUrl: data.naukriUrl || null,
      glassdoorUrl: data.glassdoorUrl || null,
      savedSearchUrls: data.savedSearchUrls,
    },
  });
  revalidatePath("/settings");
  return { ok: true };
}

export async function updatePreferences(input: z.infer<typeof preferencesSchema>, finishOnboarding = false) {
  const user = await requireUser();
  const data = preferencesSchema.parse(input);
  await db.user.update({
    where: { id: user.id },
    data: { ...data, ...(finishOnboarding && !user.onboardedAt ? { onboardedAt: new Date() } : {}) },
  });
  revalidatePath("/settings");
  return { ok: true };
}

export async function updateNotifications(input: { notifyByEmail: boolean; dailyEmailLimit: number }) {
  const user = await requireUser();
  const limit = Math.max(1, Math.min(MAX_DAILY_EMAILS, Math.round(input.dailyEmailLimit)));
  await db.user.update({ where: { id: user.id }, data: { notifyByEmail: input.notifyByEmail, dailyEmailLimit: limit } });
  revalidatePath("/settings");
  return { ok: true };
}

export async function completeOnboarding() {
  const user = await requireUser();
  if (!user.onboardedAt) await db.user.update({ where: { id: user.id }, data: { onboardedAt: new Date() } });
  return { ok: true };
}

export async function setDefaultResume(id: string) {
  const user = await requireUser();
  await db.$transaction([
    db.resume.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
    db.resume.updateMany({ where: { id, userId: user.id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/settings");
  return { ok: true };
}

export async function updateResume(id: string, input: { label: string; roleType: string }) {
  const user = await requireUser();
  await db.resume.updateMany({
    where: { id, userId: user.id },
    data: { label: input.label.trim().slice(0, 60) || "Resume", roleType: input.roleType.trim().slice(0, 40) || null },
  });
  revalidatePath("/settings");
  return { ok: true };
}

export async function deleteResume(id: string) {
  const user = await requireUser();
  const resume = await db.resume.findFirst({ where: { id, userId: user.id } });
  if (!resume) return { ok: true };
  await db.resume.delete({ where: { id } });
  await deleteResumeFiles([resume.filePath]).catch(() => undefined);
  if (resume.isDefault) {
    const next = await db.resume.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    if (next) await db.resume.update({ where: { id: next.id }, data: { isDefault: true } });
  }
  revalidatePath("/settings");
  return { ok: true };
}

/** "Delete my data": user, resumes (files too), tokens, applications, prep pages. */
export async function deleteMyData(confirmation: string) {
  const user = await requireUser();
  if (confirmation !== "DELETE") return { error: "Type DELETE to confirm." };
  const resumes = await db.resume.findMany({ where: { userId: user.id }, select: { filePath: true } });
  await deleteResumeFiles(resumes.map((r) => r.filePath)).catch(() => undefined);
  // Sessions, accounts (OAuth tokens) and every user-scoped row cascade from the user.
  await db.user.delete({ where: { id: user.id } });
  return { ok: true };
}
