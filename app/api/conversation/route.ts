import { NextRequest, NextResponse } from "next/server";
import { continueConversation } from "@/lib/claude";
import { Message } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { messages }: { messages: Message[] } = await req.json();

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
  }

  const reply = await continueConversation(messages);
  return NextResponse.json({ reply });
}
