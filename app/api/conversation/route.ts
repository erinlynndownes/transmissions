import { NextRequest, NextResponse } from "next/server";
import { continueConversation } from "@/lib/claude";
import { checkRateLimit } from "@/lib/ratelimit";
import { Message } from "@/lib/types";

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

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

  try {
    const reply = await continueConversation(messages);
    return NextResponse.json({ reply });
  } catch (error: unknown) {
    if (error instanceof Error && "status" in error && (error as { status: number }).status === 402) {
      return NextResponse.json(
        { error: "We're taking a break — check back later." },
        { status: 503 }
      );
    }
    throw error;
  }
}
