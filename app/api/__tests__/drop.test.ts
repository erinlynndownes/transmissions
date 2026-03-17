import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/storage", () => ({
  incrementDropoff: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "../drop/route";
import { incrementDropoff } from "@/lib/storage";

function postReq(body: unknown) {
  return new NextRequest("http://localhost/api/drop", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/drop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when userMessageCount is not a number", async () => {
    const res = await POST(postReq({ userMessageCount: "three" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid count" });
  });

  it("returns 400 when userMessageCount is negative", async () => {
    const res = await POST(postReq({ userMessageCount: -1 }));
    expect(res.status).toBe(400);
  });

  it("accepts zero", async () => {
    const res = await POST(postReq({ userMessageCount: 0 }));
    expect(res.status).toBe(200);
    expect(incrementDropoff).toHaveBeenCalledWith(0);
  });

  it("succeeds with a valid count", async () => {
    const res = await POST(postReq({ userMessageCount: 3 }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(incrementDropoff).toHaveBeenCalledWith(3);
  });

  it("returns 500 when body parsing fails", async () => {
    const badReq = new NextRequest("http://localhost/api/drop", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not-json",
    });
    const res = await POST(badReq);
    expect(res.status).toBe(500);
  });
});
