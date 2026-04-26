import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { logger, serializeError } from "./logger";

const MOCK = process.env.MOCK_STORAGE === "true";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

const ses = MOCK ? (null as unknown as SESClient) : new SESClient({ region: process.env.APP_REGION });

export async function notifyPendingReview(submission: {
  id: string;
  quote: string;
  summary: string;
  contentWarning: boolean;
  poignancyScore: number;
}): Promise<void> {
  if (MOCK) {
    logger.info("mock_notify_pending_review", { submissionId: submission.id });
    return;
  }

  if (!ADMIN_EMAIL) {
    logger.warn("notify_skipped_no_admin_email");
    return;
  }

  const reasons: string[] = [];
  if (submission.contentWarning) reasons.push("content warning flagged");
  if (submission.poignancyScore < 5) reasons.push(`low poignancy score (${submission.poignancyScore})`);

  try {
    await ses.send(
      new SendEmailCommand({
        Source: ADMIN_EMAIL,
        Destination: { ToAddresses: [ADMIN_EMAIL] },
        Message: {
          Subject: { Data: `[transmissions] Submission pending review: ${submission.id.slice(0, 8)}` },
          Body: {
            Text: {
              Data: [
                `A submission needs review.`,
                ``,
                `ID: ${submission.id}`,
                `Reason: ${reasons.join(", ")}`,
                `Poignancy: ${submission.poignancyScore}/10`,
                `Content warning: ${submission.contentWarning ? "yes" : "no"}`,
                ``,
                `Summary: ${submission.summary}`,
                ``,
                `Quote: "${submission.quote}"`,
                ``,
                `View conversation: https://transmissions.earth/explore?id=${submission.id}`,
                ``,
                `To approve or reject, use the admin API:`,
                `POST /api/admin/review`,
                `{ "id": "${submission.id}", "status": "approved" }`,
              ].join("\n"),
            },
          },
        },
      })
    );
  } catch (error) {
    logger.error("notify_failed", { error: serializeError(error) });
  }
}
