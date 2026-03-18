import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.hoisted runs before vi.mock hoisting, so these are available in mock factories
const { mockS3Send, mockDynamoSend } = vi.hoisted(() => ({
  mockS3Send: vi.fn(),
  mockDynamoSend: vi.fn(),
}));

vi.hoisted(() => {
  process.env.MOCK_STORAGE = "false";
  process.env.APP_REGION = "us-east-1";
  process.env.S3_BUCKET_NAME = "test-bucket";
  process.env.DYNAMODB_TABLE_NAME = "test-table";
  process.env.DYNAMODB_STATS_TABLE_NAME = "test-stats-table";
});

// Track constructor args for assertions
const { putCalls, getCalls, transactCalls, queryCalls, updateCalls: updateCallArgs, scanCalls } = vi.hoisted(() => ({
  putCalls: [] as Record<string, unknown>[],
  getCalls: [] as Record<string, unknown>[],
  transactCalls: [] as Record<string, unknown>[],
  queryCalls: [] as Record<string, unknown>[],
  updateCalls: [] as Record<string, unknown>[],
  scanCalls: [] as Record<string, unknown>[],
}));

vi.mock("@aws-sdk/client-s3", () => {
  class MockS3Client { send = mockS3Send; }
  class PutObjectCommand { input: unknown; constructor(input: Record<string, unknown>) { this.input = input; putCalls.push(input); } }
  class GetObjectCommand { input: unknown; constructor(input: Record<string, unknown>) { this.input = input; getCalls.push(input); } }
  return { S3Client: MockS3Client, PutObjectCommand, GetObjectCommand };
});

vi.mock("@aws-sdk/client-dynamodb", () => {
  class MockDynamoDBClient {}
  return { DynamoDBClient: MockDynamoDBClient };
});

vi.mock("@aws-sdk/lib-dynamodb", () => {
  class TransactWriteCommand { input: unknown; constructor(input: Record<string, unknown>) { this.input = input; transactCalls.push(input); } }
  class QueryCommand { input: unknown; constructor(input: Record<string, unknown>) { this.input = input; queryCalls.push(input); } }
  class UpdateCommand { input: unknown; constructor(input: Record<string, unknown>) { this.input = input; updateCallArgs.push(input); } }
  class ScanCommand { input: unknown; constructor(input: Record<string, unknown>) { this.input = input; scanCalls.push(input); } }
  return {
    DynamoDBDocumentClient: { from: vi.fn().mockReturnValue({ send: mockDynamoSend }) },
    TransactWriteCommand, QueryCommand, UpdateCommand, ScanCommand,
  };
});

vi.mock("uuid", () => ({
  v4: vi.fn().mockReturnValue("test-uuid-123"),
}));

import {
  saveSubmission,
  getConversation,
  getConversations,
  getStats,
  incrementVote,
  saveDemographics,
  incrementDropoff,
} from "../storage";
import type { ExtractedData, SubmissionInput } from "../types";

// ------- helpers -------

function makeExtracted(overrides: Partial<ExtractedData> = {}): ExtractedData {
  return {
    summary: "A person shares their feelings",
    quote: "I feel things deeply",
    beat: "opening",
    poignancyScore: 7,
    contentWarning: false,
    contentHateful: false,
    categories: ["hope"],
    eventTags: ["work_affected"],
    language: "en",
    quoteEn: null,
    summaryEn: null,
    ...overrides,
  };
}

function makeInput(overrides: Partial<SubmissionInput> = {}): SubmissionInput {
  return {
    messages: [
      { role: "assistant", content: "How do you feel?" },
      { role: "user", content: "Hopeful" },
    ],
    ...overrides,
  };
}

// ------- tests -------

beforeEach(() => {
  vi.clearAllMocks();
  mockS3Send.mockResolvedValue({});
  mockDynamoSend.mockResolvedValue({});
  putCalls.length = 0;
  getCalls.length = 0;
  transactCalls.length = 0;
  queryCalls.length = 0;
  updateCallArgs.length = 0;
  scanCalls.length = 0;
});

describe("saveSubmission", () => {
  it("writes conversation to S3 with correct key", async () => {
    await saveSubmission(makeInput(), makeExtracted());

    expect(putCalls).toHaveLength(1);
    expect(putCalls[0]).toEqual(
      expect.objectContaining({
        Bucket: "test-bucket",
        Key: "conversations/test-uuid-123.json",
        ContentType: "application/json",
      })
    );
    expect(mockS3Send).toHaveBeenCalledTimes(1);
  });

  it("creates correct number of transact items (1 ALL + categories + eventTags + beat)", async () => {
    const extracted = makeExtracted({
      categories: ["fear", "hope"],
      eventTags: ["work_affected", "health_affected"],
      beat: "future",
    });

    await saveSubmission(makeInput(), extracted);

    // 1 ALL + 2 categories + 2 eventTags + 1 beat = 6
    expect(transactCalls).toHaveLength(1);
    const transactItems = (transactCalls[0] as { TransactItems: unknown[] }).TransactItems;
    expect(transactItems).toHaveLength(6);
  });

  it("adds region items when region fields are provided", async () => {
    const input = makeInput({
      regionCountry: "US",
      regionContinent: "North America",
      regionSubdivision: "California",
    });

    await saveSubmission(input, makeExtracted());

    // 1 ALL + 1 cat + 1 eventTag + 1 beat + 3 regions = 7
    const transactItems = (transactCalls[0] as { TransactItems: { Put: { Item: { PK: string } } }[] }).TransactItems;
    expect(transactItems).toHaveLength(7);

    const pks = transactItems.map((item) => item.Put.Item.PK);
    expect(pks).toContain("REGION#US");
    expect(pks).toContain("REGION#North America");
    expect(pks).toContain("REGION#California");
  });

  it("sets correct PKs on transact items", async () => {
    const extracted = makeExtracted({
      categories: ["fear"],
      eventTags: ["work_affected"],
      beat: "closing",
    });

    await saveSubmission(makeInput(), extracted);

    const transactItems = (transactCalls[0] as { TransactItems: { Put: { Item: { PK: string } } }[] }).TransactItems;
    const pks = transactItems.map((item) => item.Put.Item.PK);
    expect(pks).toContain("ALL");
    expect(pks).toContain("CAT#fear");
    expect(pks).toContain("EVENT#work_affected");
    expect(pks).toContain("BEAT#closing");
  });

  it("increments stats counters for categories, eventTags, and total", async () => {
    const extracted = makeExtracted({
      categories: ["fear", "hope"],
      eventTags: ["work_affected"],
    });

    await saveSubmission(makeInput({ regionContinent: "Europe", regionCountry: "DE" }), extracted);

    const keys = updateCallArgs.map((call) => {
      const c = call as { Key: { PK: string; SK: string } };
      return { PK: c.Key.PK, SK: c.Key.SK };
    });

    expect(keys).toContainEqual({ PK: "STAT#total", SK: "submissions" });
    expect(keys).toContainEqual({ PK: "STAT#category", SK: "fear" });
    expect(keys).toContainEqual({ PK: "STAT#category", SK: "hope" });
    expect(keys).toContainEqual({ PK: "STAT#eventTag", SK: "work_affected" });
    expect(keys).toContainEqual({ PK: "STAT#continent", SK: "Europe" });
    expect(keys).toContainEqual({ PK: "STAT#country", SK: "DE" });
    expect(keys).toContainEqual({ PK: "STAT#category#continent", SK: "fear#Europe" });
    expect(keys).toContainEqual({ PK: "STAT#category#continent", SK: "hope#Europe" });
  });

  it("returns correct shape", async () => {
    const result = await saveSubmission(
      makeInput({ regionContinent: "Asia" }),
      makeExtracted({ quote: "test quote", poignancyScore: 9, categories: ["wonder"], eventTags: [] })
    );

    expect(result).toEqual({
      id: "test-uuid-123",
      quote: "test quote",
      poignancyScore: 9,
      categories: ["wonder"],
      eventTags: [],
      regionContinent: "Asia",
    });
  });
});

describe("getConversation", () => {
  it("returns parsed conversation from S3", async () => {
    const record = {
      id: "abc",
      createdAt: "2026-01-01",
      messages: [{ role: "user", content: "hi" }],
      extractedData: makeExtracted(),
    };
    mockS3Send.mockResolvedValueOnce({
      Body: { transformToString: () => Promise.resolve(JSON.stringify(record)) },
    });

    const result = await getConversation("abc");
    expect(result).toEqual(record);
    expect(getCalls[0]).toEqual({
      Bucket: "test-bucket",
      Key: "conversations/abc.json",
    });
  });

  it("returns null when S3 returns NoSuchKey", async () => {
    const err = new Error("NoSuchKey");
    err.name = "NoSuchKey";
    mockS3Send.mockRejectedValueOnce(err);

    const result = await getConversation("nonexistent");
    expect(result).toBeNull();
  });

  it("returns null when Body is empty", async () => {
    mockS3Send.mockResolvedValueOnce({ Body: { transformToString: () => Promise.resolve("") } });
    const result = await getConversation("empty");
    expect(result).toBeNull();
  });

  it("rethrows non-NoSuchKey errors", async () => {
    const err = new Error("AccessDenied");
    err.name = "AccessDenied";
    mockS3Send.mockRejectedValueOnce(err);

    await expect(getConversation("forbidden")).rejects.toThrow("AccessDenied");
  });
});

describe("getConversations", () => {
  beforeEach(() => {
    mockDynamoSend.mockResolvedValue({ Items: [], LastEvaluatedKey: undefined });
  });

  it("queries PK=ALL with no filters", async () => {
    await getConversations({});
    expect(queryCalls[0]).toEqual(
      expect.objectContaining({ ExpressionAttributeValues: { ":pk": "ALL" } })
    );
  });

  it("queries PK=CAT#fear for category filter", async () => {
    await getConversations({ category: "fear" });
    expect(queryCalls[0]).toEqual(
      expect.objectContaining({ ExpressionAttributeValues: { ":pk": "CAT#fear" } })
    );
  });

  it("queries PK=EVENT#work_affected for eventTag filter", async () => {
    await getConversations({ eventTag: "work_affected" });
    expect(queryCalls[0]).toEqual(
      expect.objectContaining({ ExpressionAttributeValues: { ":pk": "EVENT#work_affected" } })
    );
  });

  it("queries PK=BEAT#closing for beat filter", async () => {
    await getConversations({ beat: "closing" });
    expect(queryCalls[0]).toEqual(
      expect.objectContaining({ ExpressionAttributeValues: { ":pk": "BEAT#closing" } })
    );
  });

  it("queries PK=REGION#US for regionCountry filter", async () => {
    await getConversations({ regionCountry: "US" });
    expect(queryCalls[0]).toEqual(
      expect.objectContaining({ ExpressionAttributeValues: { ":pk": "REGION#US" } })
    );
  });

  it("uses category over eventTag when both provided (priority order)", async () => {
    await getConversations({ category: "hope", eventTag: "work_affected" });
    expect(queryCalls[0]).toEqual(
      expect.objectContaining({ ExpressionAttributeValues: { ":pk": "CAT#hope" } })
    );
  });

  it("defaults limit to 20", async () => {
    await getConversations({});
    expect((queryCalls[0] as { Limit: number }).Limit).toBe(20);
  });

  it("passes custom limit", async () => {
    await getConversations({ limit: 50 });
    expect((queryCalls[0] as { Limit: number }).Limit).toBe(50);
  });

  it("sorts newest first (ScanIndexForward: false)", async () => {
    await getConversations({});
    expect((queryCalls[0] as { ScanIndexForward: boolean }).ScanIndexForward).toBe(false);
  });

  it("decodes cursor from base64 to ExclusiveStartKey", async () => {
    const lastKey = { PK: "ALL", SK: "2026-01-01#abc" };
    const cursor = Buffer.from(JSON.stringify(lastKey)).toString("base64");

    await getConversations({ cursor });
    expect((queryCalls[0] as { ExclusiveStartKey: unknown }).ExclusiveStartKey).toEqual(lastKey);
  });

  it("encodes LastEvaluatedKey to base64 cursor in response", async () => {
    const lastKey = { PK: "ALL", SK: "2026-01-01#xyz" };
    mockDynamoSend.mockResolvedValueOnce({ Items: [], LastEvaluatedKey: lastKey });

    const result = await getConversations({});
    const decoded = JSON.parse(Buffer.from(result.cursor!, "base64").toString("utf-8"));
    expect(decoded).toEqual(lastKey);
  });

  it("returns no cursor when no LastEvaluatedKey", async () => {
    mockDynamoSend.mockResolvedValueOnce({ Items: [], LastEvaluatedKey: undefined });
    const result = await getConversations({});
    expect(result.cursor).toBeUndefined();
  });
});

describe("getStats", () => {
  it("strips STAT# prefix and groups by key", async () => {
    mockDynamoSend.mockResolvedValueOnce({
      Items: [
        { PK: "STAT#total", SK: "submissions", count: 42 },
        { PK: "STAT#category", SK: "fear", count: 10 },
        { PK: "STAT#category", SK: "hope", count: 8 },
      ],
    });

    const stats = await getStats();
    expect(stats.total).toEqual({ submissions: 42 });
    expect(stats.category).toEqual({ fear: 10, hope: 8 });
  });

  it("converts DEMO# prefix to demo_ key", async () => {
    mockDynamoSend.mockResolvedValueOnce({
      Items: [
        { PK: "DEMO#gender", SK: "woman", count: 5 },
        { PK: "DEMO#category#gender", SK: "fear#woman", count: 3 },
      ],
    });

    const stats = await getStats();
    expect(stats.demo_gender).toEqual({ woman: 5 });
    expect(stats["demo_category#gender"]).toEqual({ "fear#woman": 3 });
  });

  it("defaults count to 0 when missing", async () => {
    mockDynamoSend.mockResolvedValueOnce({
      Items: [{ PK: "STAT#total", SK: "submissions" }],
    });

    const stats = await getStats();
    expect(stats.total.submissions).toBe(0);
  });
});

describe("incrementVote", () => {
  it("constructs SK from createdAt and id", async () => {
    mockDynamoSend.mockResolvedValueOnce({ Attributes: { voteCount: 3 } });

    await incrementVote("abc-123", "2026-03-15T12:00:00Z");

    const input = updateCallArgs[0] as { Key: { PK: string; SK: string } };
    expect(input.Key).toEqual({ PK: "ALL", SK: "2026-03-15T12:00:00Z#abc-123" });
  });

  it("uses ConditionExpression to require existing item", async () => {
    mockDynamoSend.mockResolvedValueOnce({ Attributes: { voteCount: 1 } });

    await incrementVote("x", "2026-01-01");

    const input = updateCallArgs[0] as { ConditionExpression: string };
    expect(input.ConditionExpression).toBe("attribute_exists(PK)");
  });

  it("returns voteCount from response", async () => {
    mockDynamoSend.mockResolvedValueOnce({ Attributes: { voteCount: 7 } });
    const count = await incrementVote("x", "2026-01-01");
    expect(count).toBe(7);
  });

  it("returns 0 when Attributes is missing", async () => {
    mockDynamoSend.mockResolvedValueOnce({ Attributes: undefined });
    const count = await incrementVote("x", "2026-01-01");
    expect(count).toBe(0);
  });
});

describe("saveDemographics", () => {
  it("creates base demographic counters", async () => {
    await saveDemographics({
      categories: ["fear"],
      eventTags: [],
      gender: "woman",
      ageRange: "25-34",
      employmentStatus: "employed",
      regionContinent: "Europe",
    });

    const keys = updateCallArgs.map((call) => {
      const c = call as { Key: { PK: string; SK: string } };
      return { PK: c.Key.PK, SK: c.Key.SK };
    });

    expect(keys).toContainEqual({ PK: "DEMO#gender", SK: "woman" });
    expect(keys).toContainEqual({ PK: "DEMO#ageRange", SK: "25-34" });
    expect(keys).toContainEqual({ PK: "DEMO#employmentStatus", SK: "employed" });
    expect(keys).toContainEqual({ PK: "DEMO#continent", SK: "Europe" });
  });

  it("creates pairwise category × demographic counters", async () => {
    await saveDemographics({
      categories: ["fear"],
      eventTags: [],
      gender: "man",
      ageRange: "35-44",
    });

    const keys = updateCallArgs.map((call) => {
      const c = call as { Key: { PK: string; SK: string } };
      return { PK: c.Key.PK, SK: c.Key.SK };
    });

    expect(keys).toContainEqual({ PK: "DEMO#category#gender", SK: "fear#man" });
    expect(keys).toContainEqual({ PK: "DEMO#category#ageRange", SK: "fear#35-44" });
  });

  it("creates multi-way category × demographic combos", async () => {
    await saveDemographics({
      categories: ["hope"],
      eventTags: [],
      gender: "woman",
      ageRange: "25-34",
      employmentStatus: "student",
    });

    const keys = updateCallArgs.map((call) => {
      const c = call as { Key: { PK: string; SK: string } };
      return { PK: c.Key.PK, SK: c.Key.SK };
    });

    // 2-way combos
    expect(keys).toContainEqual({ PK: "DEMO#category#gender#ageRange", SK: "hope#woman#25-34" });
    expect(keys).toContainEqual({ PK: "DEMO#category#gender#employmentStatus", SK: "hope#woman#student" });
    expect(keys).toContainEqual({ PK: "DEMO#category#ageRange#employmentStatus", SK: "hope#25-34#student" });

    // 3-way combo
    expect(keys).toContainEqual({
      PK: "DEMO#category#gender#ageRange#employmentStatus",
      SK: "hope#woman#25-34#student",
    });
  });

  it("creates eventTag × demographic cross-dimensional counters", async () => {
    await saveDemographics({
      categories: [],
      eventTags: ["work_affected"],
      gender: "non-binary",
      ageRange: "18-24",
    });

    const keys = updateCallArgs.map((call) => {
      const c = call as { Key: { PK: string; SK: string } };
      return { PK: c.Key.PK, SK: c.Key.SK };
    });

    expect(keys).toContainEqual({ PK: "DEMO#eventTag#gender", SK: "work_affected#non-binary" });
    expect(keys).toContainEqual({ PK: "DEMO#eventTag#ageRange", SK: "work_affected#18-24" });
    expect(keys).toContainEqual({ PK: "DEMO#eventTag#gender#ageRange", SK: "work_affected#non-binary#18-24" });
  });

  it("generates correct total update count", async () => {
    // 2 categories, 1 eventTag, 3 dims (gender, ageRange, employment)
    // Base: 3 (gender + ageRange + employment)
    // Per category: 3 pairwise + 3 two-way combos + 1 three-way = 7 per cat × 2 = 14
    // Per eventTag: same 7 × 1 = 7
    // Total: 3 + 14 + 7 = 24
    await saveDemographics({
      categories: ["fear", "hope"],
      eventTags: ["work_affected"],
      gender: "woman",
      ageRange: "25-34",
      employmentStatus: "employed",
    });

    expect(updateCallArgs).toHaveLength(24);
  });

  it("skips cross-dimensional when no demographics provided", async () => {
    await saveDemographics({
      categories: ["fear"],
      eventTags: ["work_affected"],
    });

    // No base dims, no cross-dimensional — 0 updates
    expect(updateCallArgs).toHaveLength(0);
  });
});

describe("incrementDropoff", () => {
  it("writes to correct PK and SK", async () => {
    await incrementDropoff(3);

    const input = updateCallArgs[0] as { TableName: string; Key: { PK: string; SK: string } };
    expect(input.TableName).toBe("test-stats-table");
    expect(input.Key).toEqual({ PK: "STAT#dropoff", SK: "3" });
  });

  it("uses ADD expression to increment counter", async () => {
    await incrementDropoff(0);

    const input = updateCallArgs[0] as {
      UpdateExpression: string;
      ExpressionAttributeValues: Record<string, number>;
    };
    expect(input.UpdateExpression).toBe("ADD #count :one");
    expect(input.ExpressionAttributeValues).toEqual({ ":one": 1 });
  });
});
