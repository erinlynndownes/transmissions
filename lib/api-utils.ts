import { NextRequest, NextResponse } from "next/server";

export function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export function isAnthropicQuotaError(error: unknown): boolean {
  return error instanceof Error && "status" in error && (error as { status: number }).status === 402;
}

export function quotaExhaustedResponse(): NextResponse {
  return NextResponse.json(
    { error: "We're taking a break — check back later." },
    { status: 503 }
  );
}
