import { NextRequest, NextResponse } from "next/server";
import { extractSubmissionData } from "@/lib/claude";
import { saveSubmission } from "@/lib/storage";
import { checkRateLimit } from "@/lib/ratelimit";
import { getClientIp, isAnthropicQuotaError, quotaExhaustedResponse } from "@/lib/api-utils";
import { Message, SubmissionInput } from "@/lib/types";

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const MIN_USER_MESSAGES = 4;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  const limited = checkRateLimit(`submit:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
  if (limited) {
    return NextResponse.json(
      { error: "Too many submissions. Try again later." },
      { status: 429 }
    );
  }

  const body: SubmissionInput = await req.json();
  const { messages, regionSubdivision, regionCountry, regionContinent } = body;

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
  }

  const userMessages = messages.filter((m: Message) => m.role === "user");
  if (userMessages.length < MIN_USER_MESSAGES) {
    return NextResponse.json(
      { error: "Conversation too short" },
      { status: 400 }
    );
  }

  try {
    const extracted = await extractSubmissionData(messages);

    const result = await saveSubmission(
      { messages, regionSubdivision, regionCountry, regionContinent },
      extracted
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    if (isAnthropicQuotaError(error)) return quotaExhaustedResponse();
    throw error;
  }
}
