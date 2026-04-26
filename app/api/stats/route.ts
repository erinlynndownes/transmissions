import { NextRequest, NextResponse } from "next/server";
import { getStats } from "@/lib/storage";
import { withLogging } from "@/lib/logger";

export const GET = withLogging("/api/stats", async (_req: NextRequest) => {
  void _req;
  const stats = await getStats();
  return NextResponse.json(stats, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
});
