import { NextRequest, NextResponse } from "next/server";
import { incrementDropoff } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const { userMessageCount } = await req.json();

    if (typeof userMessageCount !== "number" || userMessageCount < 0) {
      return NextResponse.json({ error: "Invalid count" }, { status: 400 });
    }

    await incrementDropoff(userMessageCount);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
