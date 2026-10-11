import "server-only";
import { db } from "@/lib/db";
import { COMPANY_TYPE_LABEL } from "@/lib/constants";

/** How many people must agree before a correction changes the shared company type. */
export const CORRECTION_QUORUM = 3;

/**
 * Corrections apply to the user's own view at once. When enough users agree on
 * the same type, it becomes the shared value and is never auto-reclassified.
 */
export async function applyCorrectionsIfAgreed(companyId: string): Promise<boolean> {
  const votes = await db.companyTypeCorrection.groupBy({
    by: ["type"],
    where: { companyId, status: "pending" },
    _count: { _all: true },
  });
  const winner = votes.sort((a, b) => b._count._all - a._count._all)[0];
  if (!winner || winner._count._all < CORRECTION_QUORUM) return false;

  await db.$transaction([
    db.company.update({
      where: { id: companyId },
      data: {
        companyType: winner.type,
        companyTypeSource: "reviewed",
        companyTypeReason: `${COMPANY_TYPE_LABEL[winner.type] ?? winner.type}, confirmed by ${winner._count._all} people`,
        typeCheckedAt: new Date(),
      },
    }),
    db.companyTypeCorrection.updateMany({ where: { companyId, status: "pending", type: winner.type }, data: { status: "accepted" } }),
    db.companyTypeCorrection.updateMany({ where: { companyId, status: "pending", type: { not: winner.type } }, data: { status: "rejected" } }),
  ]);
  return true;
}
