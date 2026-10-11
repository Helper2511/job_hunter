import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, features } from "@/lib/env";

let client: SupabaseClient | null = null;

function supabase(): SupabaseClient {
  if (!features.storage) throw new Error("Resume storage is not configured");
  client ??= createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  return client;
}

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;

export async function uploadResume(userId: string, file: File): Promise<string> {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-80);
  const path = `${userId}/${Date.now()}-${safe}`;
  const { error } = await supabase()
    .storage.from(env.resumeBucket)
    .upload(path, await file.arrayBuffer(), { contentType: "application/pdf", upsert: false });
  if (error) throw new Error("Could not save the resume. Try again.");
  return path;
}

/** Short-lived link; the bucket itself is private. */
export async function signedResumeUrl(path: string, seconds = 120, downloadName?: string): Promise<string> {
  const { data, error } = await supabase()
    .storage.from(env.resumeBucket)
    .createSignedUrl(path, seconds, downloadName ? { download: downloadName } : undefined);
  if (error || !data) throw new Error("Could not open the resume");
  return data.signedUrl;
}

export async function downloadResume(path: string): Promise<Uint8Array> {
  const { data, error } = await supabase().storage.from(env.resumeBucket).download(path);
  if (error || !data) throw new Error("Could not read the resume");
  return new Uint8Array(await data.arrayBuffer());
}

export async function deleteResumeFiles(paths: string[]) {
  if (!paths.length || !features.storage) return;
  await supabase().storage.from(env.resumeBucket).remove(paths);
}
