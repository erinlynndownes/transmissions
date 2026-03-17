import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/claude", () => ({
  continueConversation: vi.fn().mockResolvedValue("I hear you."),
}));

vi.mock("@/lib/ratelimit", () => ({
  checkRateLimit: vi.fn().mockReturnValue(false),
}));

import { POST } from "../conversation/route";
import { checkRateLimit } from "@/lib/ratelimit";
import { continueConversation } from "@/lib/claude";

function postReq(body: unknown, ip = "127.0.0.1") {
  return new NextRequest("http://localhost/api/conversation", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

describe("POST /api/conversation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when messages is missing", async () => {
    const res = await POST(postReq({}));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid messages" });
  });

  it("returns 400 when messages is not an array", async () => {
    const res = await POST(postReq({ messages: "hello" }));
    expect(res.status).toBe(400);
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked(checkRateLimit).mockReturnValueOnce(true);
    const res = await POST(postReq({ messages: [] }));
    expect(res.status).toBe(429);
  });

  it("returns the reply on success", async () => {
    const messages = [{ role: "user", content: "I feel hopeful" }];
    const res = await POST(postReq({ messages }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.reply).toBe("I hear you.");
    expect(continueConversation).toHaveBeenCalledWith(messages);
  });

  it("returns 503 on Claude API quota error", async () => {
    const err = new Error("Payment required") as Error & { status: number };
    err.status = 402;
    vi.mocked(continueConversation).mockRejectedValueOnce(err);

    const res = await POST(postReq({ messages: [{ role: "user", content: "hi" }] }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "We're taking a break — check back later." });
  });

  it("uses IP from x-forwarded-for for rate limiting", async () => {
    await POST(postReq({ messages: [{ role: "user", content: "hi" }] }, "1.2.3.4"));
    expect(checkRateLimit).toHaveBeenCalledWith("conversation:1.2.3.4", 30, 60_000);
  });
});
