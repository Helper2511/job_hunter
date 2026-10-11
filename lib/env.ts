import "server-only";

/**
 * Environment access. Values are read lazily so the app builds without secrets;
 * features whose keys are missing degrade instead of crashing.
 */
export const env = {
  get appUrl() {
    return process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  },
  get inboundDomain() {
    return process.env.INBOUND_EMAIL_DOMAIN ?? "in.example.com";
  },
  get resumeBucket() {
    return process.env.SUPABASE_RESUME_BUCKET ?? "resumes";
  },
  get llmModel() {
    return process.env.LLM_MODEL ?? "gpt-4.1-mini";
  },
};

export const features = {
  get llm() {
    return Boolean(process.env.LLM_API_KEY);
  },
  get storage() {
    return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  },
  get postmark() {
    return Boolean(process.env.POSTMARK_SERVER_TOKEN);
  },
  get google() {
    return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  },
  get linkedin() {
    return Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
  },
  get inngest() {
    return Boolean(process.env.INNGEST_EVENT_KEY) || process.env.NODE_ENV !== "production";
  },
};
