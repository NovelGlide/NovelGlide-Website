import ContactApiRepositoryData from "@/data/contact_api_repository_data";
import type {ContactMessage} from "@/domain/contact_message";

// Static facade the browser form sends through; failures throw ContactSendError.
export default class ContactApiRepository {
  private static data = new ContactApiRepositoryData();

  static send(message: ContactMessage, turnstileToken: string): Promise<void> {
    return this.data.send(message, turnstileToken);
  }
}
