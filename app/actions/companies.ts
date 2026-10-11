"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkCompany } from "@/lib/companies/check";
import { requireUser } from "@/lib/session";

export async function watchCompany(companyId: string) {
  const user = await requireUser();
  await db.companyWatch.upsert({
    where: { userId_companyId: { userId: user.id, companyId } },
    create: { userId: user.id, companyId },
    update: {},
  });
  revalidatePath("/companies");
  return { ok: true };
}

export async function unwatchCompany(companyId: string) {
  const user = await requireUser();
  await db.companyWatch.deleteMany({ where: { userId: user.id, companyId } });
  revalidatePath("/companies");
  return { ok: true };
}

const TYPES = ["saas", "product", "services", "manufacturing", "other"] as const;

/**
 * A user's correction applies to their own view at once and is saved for
 * review before it changes the shared value.
 */
export async function correctCompanyType(companyId: string, type: (typeof TYPES)[number]) {
  const user = await requireUser();
  z.enum(TYPES).parse(type);
  await db.companyTypeCorrection.upsert({
    where: { userId_companyId: { userId: user.id, companyId } },
    create: { userId: user.id, companyId, type },
    update: { type, status: "pending", createdAt: new Date() },
  });
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/companies");
  return { ok: true };
}

export async function recheckCompany(companyId: string) {
  await requireUser();
  const outcome = await checkCompany(companyId);
  revalidatePath(`/companies/${companyId}`);
  return outcome;
}
