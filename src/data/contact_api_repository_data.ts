import {ContactSendError, type ContactMessage} from "@/domain/contact_message";

// The API route stores to Notion, which can take a few seconds, so this is set
// well above a normal round trip.
const SEND_TIMEOUT_MS = 30_000;

export default class ContactApiRepositoryData {
  async send(message: ContactMessage, turnstileToken: string): Promise<void> {
    let response: Response;
    try {
      response = await fetch("/api/contact", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({...message, turnstileToken}),
        signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "TimeoutError") {
        throw new ContactSendError("unavailable");
      }
      if (error instanceof TypeError) {
        throw new ContactSendError("network");
      }
      throw error;
    }

    if (response.ok) {
      return;
    }
    switch (response.status) {
      case 400:
      case 413:
        throw new ContactSendError("invalid");
      case 403:
        throw new ContactSendError("verification");
      default:
        throw new ContactSendError("unavailable");
    }
  }
}
