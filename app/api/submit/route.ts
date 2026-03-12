import { NextRequest, NextResponse } from "next/server";
import { extractQuoteAndCategories } from "@/lib/claude";
import { saveSubmission } from "@/lib/storage";
import { Message, Submission, Category } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  const { messages }: { messages: Message[] } = await req.json();

  if (!messages || messages.length < 2) {
    return NextResponse.json({ error: "Conversation too short" }, { status: 400 });
  }

  const { quote, categories } = await extractQuoteAndCategories(messages);

  const submission: Submission = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    messages,
    quote,
    categories: categories as Category[],
  };

  await saveSubmission(submission);

  return NextResponse.json({ id: submission.id, quote });
}
