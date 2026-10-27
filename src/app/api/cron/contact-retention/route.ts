import {timingSafeEqual} from "node:crypto";
import {isNotionClientError} from "@notionhq/client";
import {readCronSecret} from "@/config/contact_server_env";
import ContactFeedbackRepository from "@/domain/contact_feedback_repository";
import {ContactServiceUnconfiguredError} from "@/domain/contact_message";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The job pages through every expired row and writes one update each.
export const maxDuration = 60;

// A sender's email and name are kept for one year so we can reply; after that
// they are cleared and the rest of the feedback stays.
const SENDER_DETAILS_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;

// Vercel Cron calls with `Authorization: Bearer <CRON_SECRET>` when that env
// var is set on the project.
function isAuthorized(request: Request, secret: string): boolean {
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: Request): Promise<Response> {
  const secret = readCronSecret();
  if (secret === null) {
    console.error("[contact-retention] CRON_SECRET is not configured");
    return new Response(null, {status: 503});
  }
  if (!isAuthorized(request, secret)) {
    return new Response(null, {status: 401});
  }

  try {
    await ContactFeedbackRepository.clearSenderDetailsSubmittedBefore(
      new Date(Date.now() - SENDER_DETAILS_RETENTION_MS),
    );
  } catch (error) {
    if (error instanceof ContactServiceUnconfiguredError) {
      console.error("[contact-retention] NOTION_RETENTION_TOKEN is not configured");
      return new Response(null, {status: 503});
    }
    if (isNotionClientError(error)) {
      console.error(`[contact-retention] Notion request failed: ${error.code}`);
      return new Response(null, {status: 502});
    }
    throw error;
  }

  return new Response(null, {status: 204});
}
