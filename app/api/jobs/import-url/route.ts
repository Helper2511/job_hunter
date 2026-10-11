import { z } from "zod";
import { errorJson, json, withUser } from "@/lib/api";
import { db } from "@/lib/db";
import { FetchError } from "@/lib/http";
import { upsertJobs } from "@/lib/jobs/upsert";
import { importJobFromUrl } from "@/lib/providers/manual";

const body = z.object({
  url: z.string().url(),
  title: z.string().trim().max(200).optional(),
  company: z.string().trim().max(200).optional(),
});

export async function POST(request: Request) {
  return withUser(async (userId) => {
    const parsed = body.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return errorJson("Enter a full job link, starting with https://");
    let job;
    try {
      job = await importJobFromUrl(parsed.data.url, { title: parsed.data.title, company: parsed.data.company });
    } catch (err) {
      const message = err instanceof FetchError ? err.message : "Could not read this page.";
      return json({ error: `${message} Add the title and company yourself.`, needsDetails: true }, { status: 422 });
    }
    const { ids } = await upsertJobs([job]);
    await db.application.upsert({
      where: { userId_jobId: { userId, jobId: ids[0] } },
      create: { userId, jobId: ids[0], method: "saved", status: "SAVED" },
      update: {},
    });
    return json({ id: ids[0] });
  });
}
