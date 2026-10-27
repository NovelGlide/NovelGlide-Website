import "server-only";
import type {TurnstileDeployment} from "@/data/turnstile_siteverify";

// Secrets behind the contact form and its retention job. Each reader returns
// null when the variable is unset or empty, and every caller fails closed on
// null: a missing secret rejects the request rather than skipping the check.

function readSecret(name: string): string | null {
  const value = process.env[name];
  return value ? value : null;
}

export function readTurnstileSecretKey(): string | null {
  return readSecret("TURNSTILE_SECRET_KEY");
}

// Insert-only integration: the public submit route can add rows but never read
// or change existing ones.
export function readNotionFeedbackToken(): string | null {
  return readSecret("NOTION_FEEDBACK_TOKEN");
}

// Read + update integration, used only by the cron-secret-gated retention job.
export function readNotionRetentionToken(): string | null {
  return readSecret("NOTION_RETENTION_TOKEN");
}

export function readCronSecret(): string | null {
  return readSecret("CRON_SECRET");
}

// Vercel sets VERCEL_ENV on every deployment. Anything that is neither a
// Vercel preview nor `next dev` gets the production rules, so an unknown
// environment is checked as strictly as production.
export function readTurnstileDeployment(): TurnstileDeployment {
  if (process.env.VERCEL_ENV === "production") {
    return "production";
  }
  if (process.env.VERCEL_ENV === "preview") {
    return "preview";
  }
  return process.env.NODE_ENV === "development" ? "development" : "production";
}
