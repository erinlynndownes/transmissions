import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/storage", () => ({
  getStats: vi.fn().mockResolvedValue({ total: { submissions: 42 }, category: { fear: 10 } }),
}));

import { GET } from "../stats/route";

describe("GET /api/stats", () => {
  it("returns stats with cache headers", async () => {
    const res = await GET(new NextRequest("http://localhost/api/stats"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ total: { submissions: 42 }, category: { fear: 10 } });
    expect(res.headers.get("cache-control")).toContain("s-maxage=60");
  });
});
