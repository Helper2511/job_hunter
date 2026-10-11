import { redirect } from "next/navigation";
import { errorJson, withUser } from "@/lib/api";
import { db } from "@/lib/db";
import { signedResumeUrl } from "@/lib/storage";

/** Redirect to a short-lived signed URL; the bucket is private. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let target: string | null = null;
  const res = await withUser(async (userId) => {
    const resume = await db.resume.findFirst({ where: { id, userId } });
    if (!resume) return errorJson("Resume not found", 404);
    target = await signedResumeUrl(resume.filePath, 120, resume.fileName);
    return new Response(null, { status: 204 });
  });
  if (target) redirect(target);
  return res;
}
