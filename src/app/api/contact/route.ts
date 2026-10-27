import {isNotionClientError} from "@notionhq/client";
import ContactFeedbackRepository from "@/domain/contact_feedback_repository";
import TurnstileRepository from "@/domain/turnstile_repository";
import {
  ContactServiceUnconfiguredError,
  parseContactMessage,
  TurnstileUnreachableError,
} from "@/domain/contact_message";

export const runtime = "nodejs";

// The largest valid payload (5,000-character message, 2,048-character Turnstile
// token, the short fields) stays far below this even fully escaped as JSON.
const BODY_MAX_LENGTH = 32_000;
// Cloudflare documents Turnstile tokens as at most 2,048 characters.
const TURNSTILE_TOKEN_MAX_LENGTH = 2048;

// Responses carry only a status: the browser maps each to its own message, and
// nothing about the failure (or the sender) is echoed back. Abuse is bounded by
// the single-use Turnstile token every accepted request must carry.
function reply(status: number): Response {
  return new Response(null, {status});
}

export async function POST(request: Request): Promise<Response> {
  const raw = await request.text();
  if (raw.length > BODY_MAX_LENGTH) {
    return reply(413);
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return reply(400);
    }
    throw error;
  }

  const message = parseContactMessage(body);
  const token = (body as {turnstileToken?: unknown} | null)?.turnstileToken;
  if (message === null || typeof token !== "string" || token === ""
    || token.length > TURNSTILE_TOKEN_MAX_LENGTH) {
    return reply(400);
  }

  try {
    const human = await TurnstileRepository.verifyToken(
      token,
      request.headers.get("x-real-ip"),
    );
    if (!human) {
      return reply(403);
    }
    await ContactFeedbackRepository.createFeedback(message, new Date());
  } catch (error) {
    // Logs carry only the failure's kind: the sender's email and message must
    // never reach a log.
    if (error instanceof ContactServiceUnconfiguredError) {
      console.error("[contact] a contact-form secret is not configured");
      return reply(503);
    }
    if (error instanceof TurnstileUnreachableError) {
      console.error("[contact] Turnstile siteverify unreachable");
      return reply(503);
    }
    if (isNotionClientError(error)) {
      console.error(`[contact] Notion write failed: ${error.code}`);
      return reply(502);
    }
    throw error;
  }

  return reply(204);
}
