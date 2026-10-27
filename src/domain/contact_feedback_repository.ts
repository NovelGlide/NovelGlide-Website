import ContactFeedbackRepositoryData from "@/data/contact_feedback_repository_data";
import type {ContactMessage} from "@/domain/contact_message";

// Static facade over the Notion "User Feedback Log" the contact form writes to.
export default class ContactFeedbackRepository {
  private static data = new ContactFeedbackRepositoryData();

  static createFeedback(message: ContactMessage, submittedAt: Date): Promise<void> {
    return this.data.createFeedback(message, submittedAt);
  }

  static clearSenderDetailsSubmittedBefore(cutoff: Date): Promise<void> {
    return this.data.clearSenderDetailsSubmittedBefore(cutoff);
  }
}
