import { NextRequest, NextResponse } from "next/server";
import { incrementVote } from "@/lib/storage";
import { checkRateLimit } from "@/lib/ratelimit";
import { getClientIp } from "@/lib/api-utils";
import { withLogging } from "@/lib/logger";

const RATE_LIMIT_MAX = 1;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

export const POST = withLogging("/api/vote", async (req: NextRequest) => {
  const ip = getClientIp(req);

  const { id, createdAt }: { id: string; createdAt: string } = await req.json();

  if (!id || !createdAt) {
    return NextResponse.json(
      { error: "id and createdAt are required" },
      { status: 400 }
    );
  }

  const limited = checkRateLimit(`vote:${ip}:${id}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
  if (limited) {
    return NextResponse.json(
      { error: "Already voted on this conversation" },
      { status: 429 }
    );
  }

  const voteCount = await incrementVote(id, createdAt);
  return NextResponse.json({ voteCount });
});
