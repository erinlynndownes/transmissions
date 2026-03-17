import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockConvo = {
  id: "test-123",
  createdAt: "2026-01-01T00:00:00Z",
  messages: [
    { role: "assistant", content: "How do you feel about AI?" },
    { role: "user", content: "Conflicted." },
  ],
  extractedData: {
    summary: "A person feels conflicted",
    quote: "Conflicted.",
    beat: "opening",
    poignancyScore: 6,
    contentWarning: false,
    categories: ["uncertainty"],
    eventTags: [],
    language: "en",
    quoteEn: null,
    summaryEn: null,
  },
};

vi.mock("@/lib/storage", () => ({
  getConversation: vi.fn().mockImplementation((id: string) =>
    id === "test-123" ? mockConvo : null
  ),
}));

import { GET } from "../conversations/[id]/route";

function makeReq() {
  return new NextRequest("http://localhost/api/conversations/test-123");
}

describe("GET /api/conversations/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns conversation when found", async () => {
    const res = await GET(makeReq(), { params: Promise.resolve({ id: "test-123" }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("test-123");
    expect(data.messages).toHaveLength(2);
  });

  it("returns 404 when not found", async () => {
    const res = await GET(makeReq(), { params: Promise.resolve({ id: "nonexistent" }) });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not found" });
  });

  it("sets cache-control header", async () => {
    const res = await GET(makeReq(), { params: Promise.resolve({ id: "test-123" }) });
    expect(res.headers.get("cache-control")).toContain("s-maxage=300");
  });
});
