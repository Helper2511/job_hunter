import type { NextRequest } from "next/server";
import { json, withUser } from "@/lib/api";
import { searchJobs } from "@/lib/jobs/search";
import { queryFromParams } from "@/lib/matching/query";

export async function GET(request: NextRequest) {
  return withUser(async (userId) => {
    const q = queryFromParams(request.nextUrl.searchParams);
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 200) || 200, 500);
    return json(await searchJobs(userId, q, limit));
  });
}
