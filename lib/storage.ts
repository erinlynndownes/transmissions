import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
  QueryCommand,
  UpdateCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  ConversationItem,
  ConversationRecord,
  ExtractedData,
  ModerationStatus,
  SubmissionInput,
  DemographicsInput,
  FilterParams,
  PagedResult,
} from "./types";
import { v4 as uuidv4 } from "uuid";
import { filterMockItems, getMockStats, getMockConversation } from "./mock-data";
import { combinations } from "./utils";
import { notifyPendingReview } from "./notify";

const MOCK = process.env.MOCK_STORAGE === "true";

const s3 = MOCK ? (null as unknown as S3Client) : new S3Client({ region: process.env.APP_REGION });
const dynamo = MOCK
  ? (null as unknown as DynamoDBDocumentClient)
  : DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.APP_REGION }));

const BUCKET = process.env.S3_BUCKET_NAME ?? "";
const TABLE = process.env.DYNAMODB_TABLE_NAME ?? "";
const STATS_TABLE = process.env.DYNAMODB_STATS_TABLE_NAME ?? "";
const DEFAULT_PAGE_SIZE = 20;

export async function saveSubmission(
  input: SubmissionInput,
  extracted: ExtractedData
): Promise<{ id: string; quote: string; poignancyScore: number; categories: string[]; eventTags: string[]; regionContinent?: string }> {
  const id = uuidv4();

  if (MOCK) {
    console.log("[MOCK] saveSubmission:", { id, quote: extracted.quote });
    return { id, quote: extracted.quote, poignancyScore: extracted.poignancyScore, categories: extracted.categories, eventTags: extracted.eventTags, regionContinent: input.regionContinent };
  }

  const createdAt = new Date().toISOString();
  const SK = `${createdAt}#${id}`;

  const needsReview = extracted.contentHateful;
  const moderationStatus: ModerationStatus = needsReview ? "pending_review" : "approved";

  const baseItem: ConversationItem = {
    PK: "ALL",
    SK,
    id,
    createdAt,
    summary: extracted.summary,
    quote: extracted.quote,
    beat: extracted.beat,
    poignancyScore: extracted.poignancyScore,
    contentWarning: extracted.contentWarning,
    contentHateful: extracted.contentHateful,
    moderationStatus,
    voteCount: 0,
    categories: extracted.categories,
    eventTags: extracted.eventTags,
    ...(input.regionSubdivision && {
      regionSubdivision: input.regionSubdivision,
    }),
    ...(input.regionCountry && { regionCountry: input.regionCountry }),
    ...(input.regionContinent && { regionContinent: input.regionContinent }),
  };

  // Save full conversation to S3
  const record: ConversationRecord = {
    id,
    createdAt,
    messages: input.messages,
    extractedData: extracted,
  };

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: `conversations/${id}.json`,
      Body: JSON.stringify(record),
      ContentType: "application/json",
    })
  );

  // Build all DynamoDB items for the transaction
  const transactItems: Array<{
    Put: { TableName: string; Item: ConversationItem };
  }> = [];

  // PK="ALL"
  transactItems.push({ Put: { TableName: TABLE, Item: { ...baseItem } } });

  // PK="CAT#<category>" — one per category
  for (const cat of extracted.categories) {
    transactItems.push({
      Put: { TableName: TABLE, Item: { ...baseItem, PK: `CAT#${cat}` } },
    });
  }

  // PK="EVENT#<tag>" — one per event tag
  for (const tag of extracted.eventTags) {
    transactItems.push({
      Put: { TableName: TABLE, Item: { ...baseItem, PK: `EVENT#${tag}` } },
    });
  }

  // PK="BEAT#<beat>"
  transactItems.push({
    Put: {
      TableName: TABLE,
      Item: { ...baseItem, PK: `BEAT#${extracted.beat}` },
    },
  });

  // Region items (if provided)
  if (input.regionSubdivision) {
    transactItems.push({
      Put: {
        TableName: TABLE,
        Item: { ...baseItem, PK: `REGION#${input.regionSubdivision}` },
      },
    });
  }
  if (input.regionCountry) {
    transactItems.push({
      Put: {
        TableName: TABLE,
        Item: { ...baseItem, PK: `REGION#${input.regionCountry}` },
      },
    });
  }
  if (input.regionContinent) {
    transactItems.push({
      Put: {
        TableName: TABLE,
        Item: { ...baseItem, PK: `REGION#${input.regionContinent}` },
      },
    });
  }

  // Write all items transactionally
  await dynamo.send(
    new TransactWriteCommand({ TransactItems: transactItems })
  );

  // Increment stats counters (best effort, not transactional).
  // Skip for pending_review items — stats are incremented on approval instead.
  if (moderationStatus === "approved") {
    const statsUpdates: Array<{ PK: string; SK: string }> = [
      { PK: "STAT#total", SK: "submissions" },
    ];

    for (const cat of extracted.categories) {
      statsUpdates.push({ PK: "STAT#category", SK: cat });
    }
    for (const tag of extracted.eventTags) {
      statsUpdates.push({ PK: "STAT#eventTag", SK: tag });
    }
    if (input.regionContinent) {
      statsUpdates.push({ PK: "STAT#continent", SK: input.regionContinent });
      for (const cat of extracted.categories) {
        statsUpdates.push({
          PK: "STAT#category#continent",
          SK: `${cat}#${input.regionContinent}`,
        });
      }
    }
    if (input.regionCountry) {
      statsUpdates.push({ PK: "STAT#country", SK: input.regionCountry });
    }

    const statsResults = await Promise.allSettled(
      statsUpdates.map((key) =>
        dynamo.send(
          new UpdateCommand({
            TableName: STATS_TABLE,
            Key: key,
            UpdateExpression: "ADD #count :one",
            ExpressionAttributeNames: { "#count": "count" },
            ExpressionAttributeValues: { ":one": 1 },
          })
        )
      )
    );
    for (const r of statsResults) {
      if (r.status === "rejected") console.error("[stats] counter update failed:", r.reason);
    }
  }

  if (needsReview) {
    notifyPendingReview({
      id,
      quote: extracted.quote,
      summary: extracted.summary,
      contentWarning: extracted.contentWarning,
      poignancyScore: extracted.poignancyScore,
    });
  }

  return { id, quote: extracted.quote, poignancyScore: extracted.poignancyScore, categories: extracted.categories, eventTags: extracted.eventTags, regionContinent: input.regionContinent };
}

export async function getConversation(
  id: string
): Promise<ConversationRecord | null> {
  if (MOCK) return getMockConversation(id);

  // Check moderation status via GSI before returning the conversation.
  const meta = await dynamo.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: "id-index",
      KeyConditionExpression: "id = :id",
      ExpressionAttributeValues: { ":id": id },
    })
  );
  const item = meta.Items?.find((i) => i.PK === "ALL");
  if (!item || item.moderationStatus !== "approved") return null;

  try {
    const result = await s3.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: `conversations/${id}.json`,
      })
    );

    const body = await result.Body?.transformToString();
    if (!body) return null;

    return JSON.parse(body) as ConversationRecord;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "NoSuchKey") {
      return null;
    }
    throw error;
  }
}

export async function getConversations(
  params: FilterParams
): Promise<PagedResult<ConversationItem>> {
  if (MOCK) return filterMockItems(params);

  let PK = "ALL";

  if (params.category) PK = `CAT#${params.category}`;
  else if (params.eventTag) PK = `EVENT#${params.eventTag}`;
  else if (params.beat) PK = `BEAT#${params.beat}`;
  else if (params.regionSubdivision)
    PK = `REGION#${params.regionSubdivision}`;
  else if (params.regionCountry) PK = `REGION#${params.regionCountry}`;
  else if (params.regionContinent) PK = `REGION#${params.regionContinent}`;

  const result = await dynamo.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": PK },
      ScanIndexForward: false,
      Limit: params.limit ?? DEFAULT_PAGE_SIZE,
      ...(params.cursor && {
        ExclusiveStartKey: (() => {
          try {
            return JSON.parse(Buffer.from(params.cursor, "base64").toString("utf-8"));
          } catch {
            throw new Error("Invalid cursor");
          }
        })(),
      }),
    })
  );

  const items = (result.Items ?? []) as ConversationItem[];
  const approved = items.filter((item) => item.moderationStatus !== "pending_review" && item.moderationStatus !== "rejected");
  const cursor = result.LastEvaluatedKey
    ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString("base64")
    : undefined;

  return { items: approved, cursor };
}

export async function getStats(): Promise<
  Record<string, Record<string, number>>
> {
  if (MOCK) return getMockStats();
  const result = await dynamo.send(
    new ScanCommand({ TableName: STATS_TABLE })
  );

  const stats: Record<string, Record<string, number>> = {};
  for (const item of result.Items ?? []) {
    const pk = item.PK as string;
    const sk = item.SK as string;
    const count = (item.count as number) ?? 0;

    // Strip prefix to group: "STAT#category" → "category", "DEMO#gender" → "demo_gender"
    const key = pk.startsWith("DEMO#")
      ? `demo_${pk.slice(5)}`
      : pk.slice(5); // strip "STAT#"

    if (!stats[key]) stats[key] = {};
    stats[key][sk] = count;
  }

  return stats;
}

export async function incrementVote(
  id: string,
  createdAt: string
): Promise<number> {
  if (MOCK) return 1;
  const SK = `${createdAt}#${id}`;

  const result = await dynamo.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { PK: "ALL", SK },
      UpdateExpression: "ADD voteCount :one",
      ConditionExpression: "attribute_exists(PK)",
      ExpressionAttributeValues: { ":one": 1 },
      ReturnValues: "ALL_NEW",
    })
  );

  return (result.Attributes?.voteCount as number) ?? 0;
}

export async function saveDemographics(
  input: DemographicsInput
): Promise<void> {
  const updates: Array<{ PK: string; SK: string }> = [];

  if (input.gender) {
    updates.push({ PK: "DEMO#gender", SK: input.gender });
  }
  if (input.ageRange) {
    updates.push({ PK: "DEMO#ageRange", SK: input.ageRange });
  }
  if (input.employmentStatus) {
    updates.push({ PK: "DEMO#employmentStatus", SK: input.employmentStatus });
  }
  if (input.regionContinent) {
    updates.push({ PK: "DEMO#continent", SK: input.regionContinent });
  }
  if (MOCK) {
    console.log("[MOCK] saveDemographics:", input);
    return;
  }

  // Cross-dimensional stats: category × demographic combinations.
  // At scale, replace with a DynamoDB Streams → Lambda pipeline to
  // decouple stat aggregation from the write path.
  const dims: { key: string; value: string }[] = [];
  if (input.gender) dims.push({ key: "gender", value: input.gender });
  if (input.ageRange) dims.push({ key: "ageRange", value: input.ageRange });
  if (input.employmentStatus) dims.push({ key: "employmentStatus", value: input.employmentStatus });
  if (input.regionContinent) dims.push({ key: "continent", value: input.regionContinent });

  // Total submission count per demographic combination (for accurate filtered percentages)
  for (const d of dims) {
    updates.push({ PK: `DEMO#total#${d.key}`, SK: d.value });
  }
  for (let size = 2; size <= dims.length; size++) {
    for (const combo of combinations(dims, size)) {
      updates.push({
        PK: `DEMO#total#${combo.map((d) => d.key).join("#")}`,
        SK: combo.map((d) => d.value).join("#"),
      });
    }
  }

  // Cross-dimensional: category × demographics
  for (const cat of input.categories) {
    for (const d of dims) {
      updates.push({
        PK: `DEMO#category#${d.key}`,
        SK: `${cat}#${d.value}`,
      });
    }
    for (let size = 2; size <= dims.length; size++) {
      for (const combo of combinations(dims, size)) {
        updates.push({
          PK: `DEMO#category#${combo.map((d) => d.key).join("#")}`,
          SK: `${cat}#${combo.map((d) => d.value).join("#")}`,
        });
      }
    }
  }

  // Cross-dimensional: eventTag × demographics
  for (const tag of input.eventTags) {
    for (const d of dims) {
      updates.push({
        PK: `DEMO#eventTag#${d.key}`,
        SK: `${tag}#${d.value}`,
      });
    }
    for (let size = 2; size <= dims.length; size++) {
      for (const combo of combinations(dims, size)) {
        updates.push({
          PK: `DEMO#eventTag#${combo.map((d) => d.key).join("#")}`,
          SK: `${tag}#${combo.map((d) => d.value).join("#")}`,
        });
      }
    }
  }

  const results = await Promise.allSettled(
    updates.map((key) =>
      dynamo.send(
        new UpdateCommand({
          TableName: STATS_TABLE,
          Key: key,
          UpdateExpression: "ADD #count :one",
          ExpressionAttributeNames: { "#count": "count" },
          ExpressionAttributeValues: { ":one": 1 },
        })
      )
    )
  );
  for (const r of results) {
    if (r.status === "rejected") console.error("[demographics] counter update failed:", r.reason);
  }
}

export async function getPendingReviews(): Promise<ConversationItem[]> {
  if (MOCK) return [];

  const result = await dynamo.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "PK = :pk",
      FilterExpression: "moderationStatus = :status",
      ExpressionAttributeValues: { ":pk": "ALL", ":status": "pending_review" },
      ScanIndexForward: false,
    })
  );

  return (result.Items ?? []) as ConversationItem[];
}

export async function updateModerationStatus(
  id: string,
  status: ModerationStatus
): Promise<void> {
  if (MOCK) {
    console.log("[MOCK] updateModerationStatus:", { id, status });
    return;
  }

  // Find all PK variants for this item via GSI
  const allItems = await dynamo.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: "id-index",
      KeyConditionExpression: "id = :id",
      ExpressionAttributeValues: { ":id": id },
    })
  );

  if (!allItems.Items?.length) {
    throw new Error(`No items found for id: ${id}`);
  }

  const updates = allItems.Items.map((item) =>
    dynamo.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { PK: item.PK as string, SK: item.SK as string },
        UpdateExpression: "SET moderationStatus = :status",
        ExpressionAttributeValues: { ":status": status },
      })
    )
  );

  const results = await Promise.allSettled(updates);
  for (const r of results) {
    if (r.status === "rejected") console.error("[moderation] status update failed:", r.reason);
  }

  // When approving a previously pending item, increment stats that were skipped at submission time.
  const primaryItem = allItems.Items.find((item) => item.PK === "ALL");
  if (status === "approved" && primaryItem?.moderationStatus === "pending_review") {
    const categories = (primaryItem.categories as string[]) ?? [];
    const eventTags = (primaryItem.eventTags as string[]) ?? [];
    const regionContinent = primaryItem.regionContinent as string | undefined;
    const regionCountry = primaryItem.regionCountry as string | undefined;

    const statsUpdates: Array<{ PK: string; SK: string }> = [
      { PK: "STAT#total", SK: "submissions" },
    ];
    for (const cat of categories) {
      statsUpdates.push({ PK: "STAT#category", SK: cat });
    }
    for (const tag of eventTags) {
      statsUpdates.push({ PK: "STAT#eventTag", SK: tag });
    }
    if (regionContinent) {
      statsUpdates.push({ PK: "STAT#continent", SK: regionContinent });
      for (const cat of categories) {
        statsUpdates.push({ PK: "STAT#category#continent", SK: `${cat}#${regionContinent}` });
      }
    }
    if (regionCountry) {
      statsUpdates.push({ PK: "STAT#country", SK: regionCountry });
    }

    const statsResults = await Promise.allSettled(
      statsUpdates.map((key) =>
        dynamo.send(
          new UpdateCommand({
            TableName: STATS_TABLE,
            Key: key,
            UpdateExpression: "ADD #count :one",
            ExpressionAttributeNames: { "#count": "count" },
            ExpressionAttributeValues: { ":one": 1 },
          })
        )
      )
    );
    for (const r of statsResults) {
      if (r.status === "rejected") console.error("[stats] approval counter update failed:", r.reason);
    }
  }
}

export async function incrementDropoff(userMessageCount: number): Promise<void> {
  if (MOCK) {
    console.log("[MOCK] incrementDropoff:", userMessageCount);
    return;
  }

  await dynamo.send(
    new UpdateCommand({
      TableName: STATS_TABLE,
      Key: { PK: "STAT#dropoff", SK: String(userMessageCount) },
      UpdateExpression: "ADD #count :one",
      ExpressionAttributeNames: { "#count": "count" },
      ExpressionAttributeValues: { ":one": 1 },
    })
  );
}
