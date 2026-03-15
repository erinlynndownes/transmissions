import { NextRequest, NextResponse } from "next/server";
import { saveDemographics } from "@/lib/storage";
import { DemographicsInput } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body: DemographicsInput = await req.json();

  if (!body.categories || !Array.isArray(body.categories)) {
    return NextResponse.json(
      { error: "categories array is required" },
      { status: 400 }
    );
  }

  await saveDemographics(body);

  return NextResponse.json({ ok: true });
}
