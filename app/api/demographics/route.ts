import { NextRequest, NextResponse } from "next/server";
import { saveDemographics } from "@/lib/storage";
import { withLogging } from "@/lib/logger";
import { DemographicsInput } from "@/lib/types";

export const POST = withLogging("/api/demographics", async (req: NextRequest) => {
  const body: DemographicsInput = await req.json();

  if (!body.categories || !Array.isArray(body.categories)) {
    return NextResponse.json(
      { error: "categories array is required" },
      { status: 400 }
    );
  }

  if (!body.eventTags) body.eventTags = [];

  await saveDemographics(body);

  return NextResponse.json({ ok: true });
});
