import { NextRequest, NextResponse } from "next/server";
import { getQuotes } from "@/lib/storage";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? undefined;

  const quotes = await getQuotes(category);
  return NextResponse.json({ quotes });
}
