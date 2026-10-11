import { z } from "zod";
import { errorJson, json, withUser } from "@/lib/api";
import { addCompany, checkCompany, classifyCompany } from "@/lib/companies/check";
import { db } from "@/lib/db";
import { EVENTS, sendEvent } from "@/lib/events";

const body = z.union([
  z.object({ input: z.string().trim().min(2).max(300) }),
  z.object({ companyId: z.string().min(1) }),
]);

export const maxDuration = 60;

/**
 * Add a company by name or website (and watch it), or re-check one.
 * The check runs right away so a Greenhouse or Lever board lists its openings within seconds.
 */
export async function POST(request: Request) {
  return withUser(async (userId) => {
    const parsed = body.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return errorJson("Enter a company name or website.");

    let companyId: string;
    let homepageHtml: string | null = null;
    if ("input" in parsed.data) {
      const added = await addCompany(parsed.data.input);
      companyId = added.company.id;
      homepageHtml = added.homepageHtml;
      await db.companyWatch.upsert({
        where: { userId_companyId: { userId, companyId } },
        create: { userId, companyId },
        update: {},
      });
    } else {
      companyId = parsed.data.companyId;
    }

    const outcome = await checkCompany(companyId);
    const company = await db.company.findUniqueOrThrow({ where: { id: companyId } });
    if (!company.typeCheckedAt) {
      // Classification reads a couple more pages; run it in the background when possible.
      const queued = await sendEvent(EVENTS.companyClassify, { companyId });
      if (!queued) await classifyCompany(companyId, homepageHtml).catch(() => undefined);
    }
    return json({ companyId, name: company.name, ...outcome });
  });
}
