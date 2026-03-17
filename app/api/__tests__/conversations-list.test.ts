import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/storage", () => ({
  getConversations: vi.fn().mockResolvedValue({ items: [], cursor: undefined }),
}));

import { GET } from "../conversations/route";

function req(params: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/conversations");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url);
}

describe("GET /api/conversations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- category validation ---

  it("accepts valid categories", async () => {
    for (const cat of ["fear", "hope", "grief", "excitement", "anger", "uncertainty", "wonder", "other"]) {
      const res = await GET(req({ category: cat }));
      expect(res.status).toBe(200);
    }
  });

  it("rejects invalid category", async () => {
    const res = await GET(req({ category: "sadness" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid category" });
  });

  // --- eventTag validation ---

  it("accepts valid eventTags", async () => {
    for (const tag of ["work_affected", "health_affected", "relationships_affected", "creative_affected", "education_affected", "financial_affected"]) {
      const res = await GET(req({ eventTag: tag }));
      expect(res.status).toBe(200);
    }
  });

  it("rejects invalid eventTag", async () => {
    const res = await GET(req({ eventTag: "housing_affected" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid eventTag" });
  });

  // --- beat validation ---

  it("accepts valid beats", async () => {
    for (const beat of ["opening", "future", "personal", "closing", "other"]) {
      const res = await GET(req({ beat }));
      expect(res.status).toBe(200);
    }
  });

  it("rejects invalid beat", async () => {
    const res = await GET(req({ beat: "intro" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid beat" });
  });

  // --- limit validation ---

  it("accepts limit within range", async () => {
    for (const limit of ["1", "50", "100"]) {
      const res = await GET(req({ limit }));
      expect(res.status).toBe(200);
    }
  });

  it("rejects limit of 0", async () => {
    const res = await GET(req({ limit: "0" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid limit (1-100)" });
  });

  it("rejects limit over 100", async () => {
    const res = await GET(req({ limit: "101" }));
    expect(res.status).toBe(400);
  });

  it("rejects non-numeric limit", async () => {
    const res = await GET(req({ limit: "abc" }));
    expect(res.status).toBe(400);
  });

  // --- pass-through params ---

  it("passes region and cursor params to storage", async () => {
    const { getConversations } = await import("@/lib/storage");
    await GET(req({ regionCountry: "US", cursor: "abc123" }));
    expect(getConversations).toHaveBeenCalledWith(
      expect.objectContaining({ regionCountry: "US", cursor: "abc123" })
    );
  });

  // --- response headers ---

  it("sets cache-control header", async () => {
    const res = await GET(req());
    expect(res.headers.get("cache-control")).toContain("s-maxage=30");
  });

  // --- no params ---

  it("returns 200 with no params", async () => {
    const res = await GET(req());
    expect(res.status).toBe(200);
  });
});
