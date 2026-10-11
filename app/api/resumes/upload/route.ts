import { errorJson, json, withUser } from "@/lib/api";
import { db } from "@/lib/db";
import { features } from "@/lib/env";
import { extractPdfText } from "@/lib/resumeText";
import { MAX_RESUME_BYTES, uploadResume } from "@/lib/storage";

export async function POST(request: Request) {
  return withUser(async (userId) => {
    if (!features.storage) return errorJson("Resume storage is not set up yet.", 503);
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return errorJson("Choose a PDF file.");
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return errorJson("Resumes must be PDF files.");
    if (file.size > MAX_RESUME_BYTES) return errorJson("That file is over 5 MB. Export a smaller PDF.");

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") return errorJson("That file is not a valid PDF.");

    const label = String(form?.get("label") ?? "").trim().slice(0, 60) || file.name.replace(/\.pdf$/i, "").slice(0, 60);
    const roleType = String(form?.get("roleType") ?? "").trim().slice(0, 40) || null;
    const path = await uploadResume(userId, file);
    const textContent = await extractPdfText(bytes);
    const count = await db.resume.count({ where: { userId } });
    const resume = await db.resume.create({
      data: { userId, label, roleType, filePath: path, fileName: file.name.slice(-120), textContent, isDefault: count === 0 },
    });
    return json({ id: resume.id, label: resume.label, hasText: Boolean(textContent) });
  });
}
