import { NextRequest, NextResponse } from "next/server";
import { getPendingReviews } from "@/lib/storage";
import { requireAdminAuth } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  const items = await getPendingReviews();

  return NextResponse.json({ items });
}
