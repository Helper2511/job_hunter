import "server-only";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import type { z } from "zod";
import { MAX_DAILY_LLM_CALLS } from "@/lib/constants";
import { env, features } from "@/lib/env";
import { consumeUsage } from "@/lib/limits";

/**
 * One LLM provider behind a small interface. Any OpenAI-compatible endpoint
 * works by setting LLM_BASE_URL and LLM_MODEL; nothing else depends on the vendor.
 */
function model() {
  const provider = createOpenAI({
    apiKey: process.env.LLM_API_KEY,
    ...(process.env.LLM_BASE_URL ? { baseURL: process.env.LLM_BASE_URL } : {}),
  });
  return process.env.LLM_BASE_URL ? provider.chat(env.llmModel) : provider(env.llmModel);
}

export class LlmUnavailableError extends Error {}

async function guard(userId?: string) {
  if (!features.llm) throw new LlmUnavailableError("No LLM key is configured");
  if (userId && !(await consumeUsage(userId, "llm", MAX_DAILY_LLM_CALLS))) {
    throw new LlmUnavailableError("Daily AI limit reached. It resets at midnight UTC.");
  }
}

export async function llmObject<T>(opts: {
  schema: z.ZodType<T>;
  system: string;
  prompt: string;
  userId?: string;
}): Promise<T> {
  await guard(opts.userId);
  const result = await generateText({
    model: model(),
    system: opts.system,
    prompt: opts.prompt,
    output: Output.object({ schema: opts.schema }),
  });
  return result.output as T;
}

export async function llmText(opts: { system: string; prompt: string; userId?: string }): Promise<string> {
  await guard(opts.userId);
  const result = await generateText({ model: model(), system: opts.system, prompt: opts.prompt });
  return result.text.trim();
}
