import { NextRequest, NextResponse } from "next/server";
import { peekRateLimit } from "@/lib/ratelimit";
import { getClientIp } from "@/lib/api-utils";

const SUBMIT_MAX = 5;
const CONVERSATION_DAILY_MAX = 5;

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const limited =
    peekRateLimit(`submit:${ip}`, SUBMIT_MAX) ||
    peekRateLimit(`conversation-daily:${ip}`, CONVERSATION_DAILY_MAX);
  return NextResponse.json({ limited });
}
