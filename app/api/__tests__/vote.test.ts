import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/storage", () => ({
  incrementVote: vi.fn().mockResolvedValue(5),
}));

vi.mock("@/lib/ratelimit", () => ({
  checkRateLimit: vi.fn().mockReturnValue(false),
}));

import { POST } from "../vote/route";
import { checkRateLimit } from "@/lib/ratelimit";

function postReq(body: unknown, ip = "127.0.0.1") {
  return new NextRequest("http://localhost/api/vote", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

describe("POST /api/vote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when id is missing", async () => {
    const res = await POST(postReq({ createdAt: "2026-01-01" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "id and createdAt are required" });
  });

  it("returns 400 when createdAt is missing", async () => {
    const res = await POST(postReq({ id: "abc" }));
    expect(res.status).toBe(400);
  });

  it("returns 429 when already voted", async () => {
    vi.mocked(checkRateLimit).mockReturnValueOnce(true);
    const res = await POST(postReq({ id: "abc", createdAt: "2026-01-01" }));
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: "Already voted on this conversation" });
  });

  it("returns updated voteCount on success", async () => {
    const res = await POST(postReq({ id: "abc", createdAt: "2026-01-01" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ voteCount: 5 });
  });

  it("rate limits per IP and item ID", async () => {
    await POST(postReq({ id: "item-1", createdAt: "2026-01-01" }, "9.8.7.6"));
    expect(checkRateLimit).toHaveBeenCalledWith("vote:9.8.7.6:item-1", 1, 86_400_000);
  });
});
