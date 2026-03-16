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
  SubmissionInput,
  DemographicsInput,
  FilterParams,
  PagedResult,
} from "./types";
import { v4 as uuidv4 } from "uuid";
import { filterMockItems, getMockStats, getMockConversation } from "./mock-data";

const MOCK = process.env.MOCK_STORAGE === "true";

const s3 = MOCK ? (null as unknown as S3Client) : new S3Client({ region: process.env.AWS_REGION });
const dynamo = MOCK
  ? (null as unknown as DynamoDBDocumentClient)
  : DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));

const BUCKET = process.env.S3_BUCKET_NAME ?? "";
const TABLE = process.env.DYNAMODB_TABLE_NAME ?? "";
const STATS_TABLE = process.env.DYNAMODB_STATS_TABLE_NAME ?? "";

function combinations<T>(arr: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (arr.length < size) return [];
  const [first, ...rest] = arr;
  const withFirst = combinations(rest, size - 1).map((c) => [first, ...c]);
  const withoutFirst = combinations(rest, size);
  return [...withFirst, ...withoutFirst];
}

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

  // Increment stats counters (best effort, not transactional)
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

  await Promise.allSettled(
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

  return { id, quote: extracted.quote, poignancyScore: extracted.poignancyScore, categories: extracted.categories, eventTags: extracted.eventTags, regionContinent: input.regionContinent };
}

export async function getConversation(
  id: string
): Promise<ConversationRecord | null> {
  if (MOCK) return getMockConversation(id);
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
      Limit: params.limit ?? 20,
      ...(params.cursor && {
        ExclusiveStartKey: JSON.parse(
          Buffer.from(params.cursor, "base64").toString("utf-8")
        ),
      }),
    })
  );

  const items = (result.Items ?? []) as ConversationItem[];
  const cursor = result.LastEvaluatedKey
    ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString("base64")
    : undefined;

  return { items, cursor };
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

  // Cross-dimensional stats: category × demographic (pairwise)
  const dims: { key: string; value: string }[] = [];
  if (input.gender) dims.push({ key: "gender", value: input.gender });
  if (input.ageRange) dims.push({ key: "ageRange", value: input.ageRange });
  if (input.employmentStatus) dims.push({ key: "employmentStatus", value: input.employmentStatus });
  if (input.regionContinent) dims.push({ key: "continent", value: input.regionContinent });

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

  await Promise.allSettled(
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
