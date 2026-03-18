import { NextRequest, NextResponse } from "next/server";
import { updateModerationStatus } from "@/lib/storage";
import { requireAdminAuth } from "@/lib/admin-auth";
import { ModerationStatus } from "@/lib/types";

const VALID_STATUSES: ModerationStatus[] = ["approved", "rejected"];

export async function POST(req: NextRequest) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  const { id, status } = await req.json();

  if (!id || !status) {
    return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
  }

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: `Status must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
  }

  try {
    await updateModerationStatus(id, status);
  } catch {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, id, status });
}
