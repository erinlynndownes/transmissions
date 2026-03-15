import { NextRequest, NextResponse } from "next/server";
import { getConversations } from "@/lib/storage";
import { Category } from "@/lib/types";

// Legacy route — prefer /api/conversations
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") as Category | undefined;

  const result = await getConversations({ category, limit: 20 });
  return NextResponse.json({ quotes: result.items });
}
