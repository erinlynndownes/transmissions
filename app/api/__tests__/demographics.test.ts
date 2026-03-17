import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/storage", () => ({
  saveDemographics: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "../demographics/route";
import { saveDemographics } from "@/lib/storage";

function postReq(body: unknown) {
  return new NextRequest("http://localhost/api/demographics", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/demographics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when categories is missing", async () => {
    const res = await POST(postReq({ gender: "woman" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "categories array is required" });
  });

  it("returns 400 when categories is not an array", async () => {
    const res = await POST(postReq({ categories: "fear" }));
    expect(res.status).toBe(400);
  });

  it("succeeds with just categories", async () => {
    const res = await POST(postReq({ categories: ["fear", "hope"] }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("defaults eventTags to empty array when missing", async () => {
    await POST(postReq({ categories: ["fear"] }));
    expect(saveDemographics).toHaveBeenCalledWith(
      expect.objectContaining({ eventTags: [] })
    );
  });

  it("passes through all optional demographic fields", async () => {
    const body = {
      categories: ["hope"],
      eventTags: ["work_affected"],
      gender: "non-binary",
      ageRange: "25-34",
      employmentStatus: "self-employed",
      regionContinent: "Europe",
    };
    await POST(postReq(body));
    expect(saveDemographics).toHaveBeenCalledWith(expect.objectContaining(body));
  });
});
