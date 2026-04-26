import { AsyncLocalStorage } from "node:async_hooks";
import type { NextRequest } from "next/server";

// =========================================================================
// PRIVACY GUARDRAILS — read before adding new log calls
// =========================================================================
// Logs are not anonymous storage. Treat every log line as potentially
// readable by anyone with AWS access. transmissions promises anonymity to
// users, so logs must NOT enable re-identification of who said what.
//
// NEVER log:
//   - IP addresses (rate limiting uses them in-memory; do not persist)
//   - Message content / conversation text (the whole point is anonymity)
//   - Submission ID alongside any user-identifying signal (IP, fingerprint)
//   - Request bodies, response bodies, or any user-supplied free text
//
// DO log:
//   - Route, status, duration, error type/message
//   - Event names ("submission_saved", "rate_limited", "moderation_failed")
//   - Internal IDs and counters (without joining to user identity)
//
// Principle: logs should answer "what happened", not "who did what".
// =========================================================================

type LogLevel = "info" | "warn" | "error";
type LogContext = Record<string, unknown>;

type RequestContext = {
  requestId: string;
  route: string;
};

const requestContextStorage = new AsyncLocalStorage<RequestContext>();

function emit(level: LogLevel, message: string, context: LogContext): void {
  const ctx = requestContextStorage.getStore();
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(ctx && { requestId: ctx.requestId, route: ctx.route }),
    ...context,
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (message: string, context: LogContext = {}) => emit("info", message, context),
  warn: (message: string, context: LogContext = {}) => emit("warn", message, context),
  error: (message: string, context: LogContext = {}) => emit("error", message, context),
};

export function serializeError(err: unknown): { name?: string; message: string; stack?: string } {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  return { message: String(err) };
}

export function withLogging<TArgs extends [NextRequest, ...unknown[]]>(
  routeName: string,
  handler: (...args: TArgs) => Promise<Response> | Response
): (...args: TArgs) => Promise<Response> {
  return async (...args: TArgs) => {
    const req = args[0];
    const requestId = crypto.randomUUID();
    const start = Date.now();
    return requestContextStorage.run({ requestId, route: routeName }, async () => {
      logger.info("request_start", { method: req.method });
      try {
        const response = await handler(...args);
        logger.info("request_end", {
          status: response.status,
          durationMs: Date.now() - start,
        });
        return response;
      } catch (error) {
        logger.error("request_error", {
          durationMs: Date.now() - start,
          error: serializeError(error),
        });
        throw error;
      }
    });
  };
}
