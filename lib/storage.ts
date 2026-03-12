import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { Submission, QuoteRecord } from "./types";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const dynamo = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION })
);

const BUCKET = process.env.S3_BUCKET_NAME!;
const TABLE = process.env.DYNAMODB_TABLE_NAME!;

export async function saveSubmission(submission: Submission): Promise<void> {
  // Store full conversation in S3
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: `conversations/${submission.id}.json`,
      Body: JSON.stringify(submission),
      ContentType: "application/json",
    })
  );

  // Store quote + metadata in DynamoDB for display/search
  const record: QuoteRecord = {
    id: submission.id,
    createdAt: submission.createdAt,
    quote: submission.quote,
    categories: submission.categories,
  };

  await dynamo.send(
    new PutCommand({
      TableName: TABLE,
      Item: record,
    })
  );
}

export async function getQuotes(category?: string): Promise<QuoteRecord[]> {
  const result = await dynamo.send(
    new ScanCommand({
      TableName: TABLE,
      ...(category && {
        FilterExpression: "contains(categories, :cat)",
        ExpressionAttributeValues: { ":cat": category },
      }),
    })
  );

  const items = (result.Items ?? []) as QuoteRecord[];
  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
