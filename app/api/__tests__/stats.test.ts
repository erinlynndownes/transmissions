import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/storage", () => ({
  getStats: vi.fn().mockResolvedValue({ total: { submissions: 42 }, category: { fear: 10 } }),
}));

import { GET } from "../stats/route";

describe("GET /api/stats", () => {
  it("returns stats with cache headers", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ total: { submissions: 42 }, category: { fear: 10 } });
    expect(res.headers.get("cache-control")).toContain("s-maxage=60");
  });
});
