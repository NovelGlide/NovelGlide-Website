import "server-only";
import {readTurnstileSecretKey} from "@/config/contact_server_env";
import {
  ContactServiceUnconfiguredError,
  TurnstileUnreachableError,
} from "@/domain/contact_message";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const SITEVERIFY_TIMEOUT_MS = 10_000;

export default class TurnstileRepositoryData {
  // True only when Cloudflare answers that this token is valid. A token is
  // single-use and expires after 300 s, so a replayed or stale one answers false.
  async verifyToken(token: string, remoteIp: string | null): Promise<boolean> {
    const secret = readTurnstileSecretKey();
    if (secret === null) {
      throw new ContactServiceUnconfiguredError();
    }

    const body = new URLSearchParams({secret, response: token});
    if (remoteIp !== null) {
      body.set("remoteip", remoteIp);
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

    const result: unknown = await response.json();
    return typeof result === "object" && result !== null
      && (result as {success?: unknown}).success === true;
  }
}
