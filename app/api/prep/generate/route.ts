import { z } from "zod";
import { errorJson, json, withUser } from "@/lib/api";
import { db } from "@/lib/db";
import { generateQuestions } from "@/lib/prep/create";

const body = z.object({ applicationId: z.string(), focus: z.string().trim().max(120).optional() });

/** Regenerate questions, optionally with a focus such as "more system design". */
export async function POST(request: Request) {
  return withUser(async (userId) => {
    const parsed = body.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return errorJson("Missing application");
    const app = await db.application.findFirst({ where: { id: parsed.data.applicationId, userId } });
    if (!app) return errorJson("Application not found", 404);
    const result = await generateQuestions(app.id, userId, parsed.data.focus);
    return json(result);
  });
}
