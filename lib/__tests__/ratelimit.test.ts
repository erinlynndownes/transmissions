import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkRateLimit } from "../ratelimit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows the first request", () => {
    expect(checkRateLimit("test-first", 5, 60_000)).toBe(false);
  });

  it("allows requests up to the max", () => {
    const key = "test-up-to-max";
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, 5, 60_000)).toBe(false);
    }
  });

  it("blocks requests exceeding the max", () => {
    const key = "test-exceeding";
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, 5, 60_000);
    }
    expect(checkRateLimit(key, 5, 60_000)).toBe(true);
  });

  it("resets after the window expires", () => {
    const key = "test-reset";
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, 5, 60_000);
    }
    expect(checkRateLimit(key, 5, 60_000)).toBe(true);

    vi.advanceTimersByTime(60_001);
    expect(checkRateLimit(key, 5, 60_000)).toBe(false);
  });

  it("tracks different keys independently", () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit("key-a", 3, 60_000);
    }
    expect(checkRateLimit("key-a", 3, 60_000)).toBe(true);
    expect(checkRateLimit("key-b", 3, 60_000)).toBe(false);
  });

  it("blocks at exactly max+1", () => {
    const key = "test-boundary";
    // Request 1 through max should pass
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit(key, 10, 60_000)).toBe(false);
    }
    // Request max+1 should block
    expect(checkRateLimit(key, 10, 60_000)).toBe(true);
  });

  it("handles max of 1 (single request per window)", () => {
    const key = "test-single";
    expect(checkRateLimit(key, 1, 60_000)).toBe(false);
    expect(checkRateLimit(key, 1, 60_000)).toBe(true);

    vi.advanceTimersByTime(60_001);
    expect(checkRateLimit(key, 1, 60_000)).toBe(false);
  });
});
