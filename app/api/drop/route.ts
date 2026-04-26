import { NextRequest, NextResponse } from "next/server";
import { incrementDropoff } from "@/lib/storage";
import { logger, serializeError, withLogging } from "@/lib/logger";

export const POST = withLogging("/api/drop", async (req: NextRequest) => {
  try {
    const { userMessageCount } = await req.json();

    if (typeof userMessageCount !== "number" || userMessageCount < 0) {
      return NextResponse.json({ error: "Invalid count" }, { status: 400 });
    }

    await incrementDropoff(userMessageCount);

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("dropoff_failed", { error: serializeError(error) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
});
