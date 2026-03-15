import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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

const s3 = new S3Client({ region: process.env.AWS_REGION });
const dynamo = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION })
);

const BUCKET = process.env.S3_BUCKET_NAME!;
const TABLE = process.env.DYNAMODB_TABLE_NAME!;
const STATS_TABLE = process.env.DYNAMODB_STATS_TABLE_NAME!;

export async function saveSubmission(
  input: SubmissionInput,
  extracted: ExtractedData
): Promise<{ id: string; quote: string; poignancyScore: number }> {
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  const SK = `${createdAt}#${id}`;

  const baseItem: ConversationItem = {
    PK: "ALL",
    SK,
    id,
    createdAt,
    quote: extracted.quote,
    beat: extracted.beat,
    poignancyScore: extracted.poignancyScore,
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

  return { id, quote: extracted.quote, poignancyScore: extracted.poignancyScore };
}

export async function getConversations(
  params: FilterParams
): Promise<PagedResult<ConversationItem>> {
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

  // Cross-dimensional stats: category × demographic
  for (const cat of input.categories) {
    if (input.gender) {
      updates.push({
        PK: "DEMO#category#gender",
        SK: `${cat}#${input.gender}`,
      });
    }
    if (input.ageRange) {
      updates.push({
        PK: "DEMO#category#ageRange",
        SK: `${cat}#${input.ageRange}`,
      });
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
