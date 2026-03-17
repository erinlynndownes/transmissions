import { describe, it, expect } from "vitest";
import { filterMockItems, getMockConversation, getMockStats, MOCK_ITEMS } from "../mock-data";

describe("filterMockItems", () => {
  it("returns all items when no filter is provided", () => {
    const { items } = filterMockItems({});
    expect(items.length).toBeGreaterThan(0);
    expect(items.length).toBeLessThanOrEqual(20); // default limit
  });

  it("filters by category", () => {
    const { items } = filterMockItems({ category: "fear" });
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.categories).toContain("fear");
    }
  });

  it("filters by eventTag", () => {
    const { items } = filterMockItems({ eventTag: "work_affected" });
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.eventTags).toContain("work_affected");
    }
  });

  it("filters by beat", () => {
    const { items } = filterMockItems({ beat: "closing" });
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.beat).toBe("closing");
    }
  });

  it("filters by regionCountry", () => {
    const { items } = filterMockItems({ regionCountry: "US" });
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.regionCountry).toBe("US");
    }
  });

  it("filters by regionContinent", () => {
    const { items } = filterMockItems({ regionContinent: "Europe" });
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.regionContinent).toBe("Europe");
    }
  });

  it("returns items sorted newest first", () => {
    const { items } = filterMockItems({});
    for (let i = 1; i < items.length; i++) {
      expect(items[i - 1].createdAt >= items[i].createdAt).toBe(true);
    }
  });

  it("respects custom limit", () => {
    const { items } = filterMockItems({ limit: 3 });
    expect(items).toHaveLength(3);
  });

  it("returns a cursor when there are more items than the limit", () => {
    const { cursor } = filterMockItems({ limit: 1 });
    expect(cursor).toBeDefined();
  });

  it("returns no cursor when all items fit within the limit", () => {
    const { cursor } = filterMockItems({ limit: 100 });
    expect(cursor).toBeUndefined();
  });

  it("returns empty array for a filter with no matches", () => {
    const { items } = filterMockItems({ regionCountry: "XX" });
    expect(items).toHaveLength(0);
  });

  it("applies only the first matching filter (category takes priority over eventTag)", () => {
    // filterMockItems uses else-if, so category should win
    const { items } = filterMockItems({ category: "hope", eventTag: "work_affected" });
    for (const item of items) {
      expect(item.categories).toContain("hope");
    }
  });
});

describe("getMockConversation", () => {
  it("returns a full conversation for a known ID with scripted messages", () => {
    const convo = getMockConversation("mock-001");
    expect(convo).not.toBeNull();
    expect(convo!.id).toBe("mock-001");
    expect(convo!.messages.length).toBeGreaterThan(2);
    expect(convo!.messages[0].role).toBe("assistant");
    expect(convo!.extractedData.categories.length).toBeGreaterThan(0);
  });

  it("generates a generic conversation for an item without a scripted one", () => {
    // Find an item that exists in MOCK_ITEMS but not in MOCK_CONVERSATIONS
    const itemWithoutConvo = MOCK_ITEMS.find((i) => i.id === "mock-004");
    expect(itemWithoutConvo).toBeDefined();

    const convo = getMockConversation("mock-004");
    expect(convo).not.toBeNull();
    expect(convo!.id).toBe("mock-004");
    // Generic fallback has exactly 2 messages
    expect(convo!.messages).toHaveLength(2);
    expect(convo!.messages[0].content).toBe("How do you feel about AI?");
    expect(convo!.messages[1].content).toBe(itemWithoutConvo!.quote);
  });

  it("returns null for a completely unknown ID", () => {
    expect(getMockConversation("nonexistent")).toBeNull();
  });

  it("includes extractedData matching the mock item", () => {
    const convo = getMockConversation("mock-001");
    const item = MOCK_ITEMS.find((i) => i.id === "mock-001")!;
    expect(convo!.extractedData.quote).toBe(item.quote);
    expect(convo!.extractedData.categories).toEqual(item.categories);
    expect(convo!.extractedData.beat).toBe(item.beat);
  });
});

describe("getMockStats", () => {
  it("returns an object with expected top-level keys", () => {
    const stats = getMockStats();
    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("category");
    expect(stats).toHaveProperty("eventTag");
    expect(stats).toHaveProperty("continent");
    expect(stats).toHaveProperty("country");
  });

  it("total submissions matches MOCK_ITEMS length", () => {
    const stats = getMockStats();
    expect(stats.total.submissions).toBe(MOCK_ITEMS.length);
  });

  it("category counts are consistent with MOCK_ITEMS", () => {
    const stats = getMockStats();
    // Manually count fear items
    const fearCount = MOCK_ITEMS.reduce(
      (sum, item) => sum + (item.categories.includes("fear") ? 1 : 0),
      0
    );
    expect(stats.category.fear).toBe(fearCount);
  });

  it("eventTag counts are consistent with MOCK_ITEMS", () => {
    const stats = getMockStats();
    const workCount = MOCK_ITEMS.reduce(
      (sum, item) => sum + (item.eventTags.includes("work_affected") ? 1 : 0),
      0
    );
    expect(stats.eventTag.work_affected).toBe(workCount);
  });

  it("continent counts are consistent with MOCK_ITEMS", () => {
    const stats = getMockStats();
    const naCount = MOCK_ITEMS.filter((i) => i.regionContinent === "North America").length;
    expect(stats.continent["North America"]).toBe(naCount);
  });

  it("includes cross-dimensional demographic keys", () => {
    const stats = getMockStats();
    expect(stats).toHaveProperty("demo_category#gender");
    expect(stats).toHaveProperty("demo_category#ageRange");
    expect(stats).toHaveProperty("demo_category#gender#ageRange");
    expect(stats).toHaveProperty("demo_category#gender#ageRange#employmentStatus#continent");
  });

  it("category#continent counts are consistent with MOCK_ITEMS", () => {
    const stats = getMockStats();
    const fearNA = MOCK_ITEMS.reduce(
      (sum, item) =>
        sum + (item.categories.includes("fear") && item.regionContinent === "North America" ? 1 : 0),
      0
    );
    expect(stats["category#continent"]["fear#North America"]).toBe(fearNA);
  });
});
