import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/claude", () => ({
  extractSubmissionData: vi.fn().mockResolvedValue({
    summary: "A person shares their feelings",
    quote: "I feel things",
    beat: "opening",
    poignancyScore: 7,
    contentWarning: false,
    categories: ["hope"],
    eventTags: ["work_affected"],
    language: "en",
    quoteEn: null,
    summaryEn: null,
  }),
}));

vi.mock("@/lib/storage", () => ({
  saveSubmission: vi.fn().mockResolvedValue({
    id: "test-id",
    quote: "I feel things",
    poignancyScore: 7,
    categories: ["hope"],
    eventTags: ["work_affected"],
  }),
}));

vi.mock("@/lib/ratelimit", () => ({
  checkRateLimit: vi.fn().mockReturnValue(false),
}));

import { POST } from "../submit/route";
import { checkRateLimit } from "@/lib/ratelimit";

function makeMessages(userCount: number) {
  const msgs = [];
  for (let i = 0; i < userCount; i++) {
    msgs.push({ role: "assistant", content: `Question ${i + 1}?` });
    msgs.push({ role: "user", content: `Answer ${i + 1}` });
  }
  return msgs;
}

function postReq(body: unknown, ip = "127.0.0.1") {
  return new NextRequest("http://localhost/api/submit", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

describe("POST /api/submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when messages is missing", async () => {
    const res = await POST(postReq({}));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid messages" });
  });

  it("returns 400 when messages is not an array", async () => {
    const res = await POST(postReq({ messages: "not-an-array" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when fewer than 4 user messages", async () => {
    const res = await POST(postReq({ messages: makeMessages(3) }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Conversation too short" });
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked(checkRateLimit).mockReturnValueOnce(true);
    const res = await POST(postReq({ messages: makeMessages(4) }));
    expect(res.status).toBe(429);
  });

  it("succeeds with exactly 4 user messages", async () => {
    const res = await POST(postReq({ messages: makeMessages(4) }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("test-id");
    expect(data.quote).toBe("I feel things");
  });

  it("passes region fields to saveSubmission", async () => {
    const { saveSubmission } = await import("@/lib/storage");
    await POST(postReq({
      messages: makeMessages(4),
      regionCountry: "US",
      regionContinent: "North America",
    }));
    expect(saveSubmission).toHaveBeenCalledWith(
      expect.objectContaining({ regionCountry: "US", regionContinent: "North America" }),
      expect.anything()
    );
  });

  it("returns 503 on Claude API quota error", async () => {
    const { extractSubmissionData } = await import("@/lib/claude");
    const err = new Error("Payment required") as Error & { status: number };
    err.status = 402;
    vi.mocked(extractSubmissionData).mockRejectedValueOnce(err);

    const res = await POST(postReq({ messages: makeMessages(4) }));
    expect(res.status).toBe(503);
  });
});
