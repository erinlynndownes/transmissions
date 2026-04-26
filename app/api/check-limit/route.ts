import { NextRequest, NextResponse } from "next/server";
import { peekRateLimit } from "@/lib/ratelimit";
import { getClientIp } from "@/lib/api-utils";
import { withLogging } from "@/lib/logger";

const SUBMIT_MAX = 5;
const CONVERSATION_DAILY_MAX = 5;

export const GET = withLogging("/api/check-limit", async (req: NextRequest) => {
  const ip = getClientIp(req);
  const limited =
    peekRateLimit(`submit:${ip}`, SUBMIT_MAX) ||
    peekRateLimit(`conversation-daily:${ip}`, CONVERSATION_DAILY_MAX);
  return NextResponse.json({ limited });
});
