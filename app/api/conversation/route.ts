import { NextRequest, NextResponse } from "next/server";
import { continueConversation } from "@/lib/claude";
import { checkRateLimit } from "@/lib/ratelimit";
import { getClientIp, isAnthropicQuotaError, quotaExhaustedResponse } from "@/lib/api-utils";
import { Message } from "@/lib/types";

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_MESSAGE_LENGTH = 5000;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  const limited = checkRateLimit(`conversation:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
  if (limited) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429 }
    );
  }

  const { messages }: { messages: Message[] } = await req.json();

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
  }

  if (messages.some((m) => m.content.length > MAX_MESSAGE_LENGTH)) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  try {
    const reply = await continueConversation(messages);
    return NextResponse.json({ reply });
  } catch (error: unknown) {
    if (isAnthropicQuotaError(error)) return quotaExhaustedResponse();
    console.error("[conversation] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
