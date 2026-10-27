// Cloudflare Turnstile's server-side check. Kept free of `server-only` and path
// aliases so `node --test` can load it; callers pass in the secret.
import {SITE_URL} from "../config/site.ts";
import {TURNSTILE_CONTACT_ACTION} from "../config/turnstile.ts";
import {TurnstileUnreachableError} from "../domain/contact_message.ts";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const SITEVERIFY_TIMEOUT_MS = 10_000;

// Where the site is running, which decides the hostnames a token may come from.
export type TurnstileDeployment = "production" | "preview" | "development";

const PRODUCTION_HOSTNAME = new URL(SITE_URL).hostname;

// Siteverify reports the hostname the widget was solved on; a token solved on
// any other site (a scraper embedding our site key) is rejected.
export function isAllowedTurnstileHostname(
  hostname: string,
  deployment: TurnstileDeployment,
): boolean {
  switch (deployment) {
    case "production":
      return hostname === PRODUCTION_HOSTNAME;
    case "preview":
      return hostname === PRODUCTION_HOSTNAME || hostname.endsWith(".vercel.app");
    case "development":
      return hostname === "localhost";
  }
}

// Every field the check relies on must be present and match; anything missing
// or of the wrong type rejects.
function isAcceptedResult(result: unknown, deployment: TurnstileDeployment): boolean {
  if (typeof result !== "object" || result === null) {
    return false;
  }
  const {success, hostname, action} = result as Record<string, unknown>;
  return success === true
    && typeof hostname === "string"
    && isAllowedTurnstileHostname(hostname, deployment)
    && action === TURNSTILE_CONTACT_ACTION;
}

// True only when Cloudflare accepts the token for this site and this form. A
// token is single-use and expires after 300 s, so a replayed or stale one is
// rejected too. Throws TurnstileUnreachableError when no verdict was obtained.
export async function verifyTurnstileToken(params: {
  secret: string;
  token: string;
  remoteIp: string | null;
  deployment: TurnstileDeployment;
}): Promise<boolean> {
  const body = new URLSearchParams({
    secret: params.secret,
    response: params.token,
    // Lets Cloudflare answer a retried request with the first verdict instead
    // of treating the token as already spent.
    idempotency_key: crypto.randomUUID(),
  });
  if (params.remoteIp !== null) {
    body.set("remoteip", params.remoteIp);
  }

  let response: Response;
  try {
    response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(SITEVERIFY_TIMEOUT_MS),
    });
  } catch (error) {
    // fetch rejects with TypeError on a network failure and with a
    // DOMException (TimeoutError) when the signal fires; nothing else.
    if (error instanceof TypeError || error instanceof DOMException) {
      throw new TurnstileUnreachableError();
    }
    throw error;
  }
  if (!response.ok) {
    throw new TurnstileUnreachableError();
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new TurnstileUnreachableError();
    }
    throw error;
  }
  return isAcceptedResult(result, params.deployment);
}
