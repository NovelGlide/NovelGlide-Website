import "server-only";
import {Client, collectPaginatedAPI} from "@notionhq/client";
import {readNotionFeedbackToken, readNotionRetentionToken} from "@/config/contact_server_env";
import {
  ContactServiceUnconfiguredError,
  type ContactCategory,
  type ContactDevice,
  type ContactMessage,
} from "@/domain/contact_message";

// The "User Feedback Log" data source (database 10163222c77d472cb1ac630c066a92ba).
// Both integrations (NOTION_FEEDBACK_TOKEN, insert only; NOTION_RETENTION_TOKEN,
// read + update) must be connected to that database.
const FEEDBACK_DATA_SOURCE_ID = "0798f905-7399-4b84-a41a-f82ad97e4381";

// Property names and option values on that data source. Select options must
// already exist there or the write fails with a validation error.
const PROP = {
  name: "Name",
  source: "Source",
  status: "Status",
  submitted: "Submitted",
  platform: "Platform",
  feedbackClass: "Feedback Class",
  replyEmail: "Reply Email",
  contactName: "Contact Name",
} as const;
const SOURCE_CONTACT_FORM = "Contact form";

// Notion is read by the team in English, whatever the sender's locale. A
// Record over the union fails to compile when a category is added without one.
const CATEGORY_LABEL: Record<ContactCategory, string> = {
  bug: "Bug report",
  feature: "Feature request",
  account: "Account & purchases",
  other: "Other",
};

// Notion rejects a rich-text item whose content exceeds 2,000 characters.
const NOTION_TEXT_MAX_LENGTH = 2000;
const TITLE_EXCERPT_LENGTH = 60;

// Notion's Platform options; "Other" and a blank choice both land on Unknown.
const PLATFORM_BY_DEVICE: Record<ContactDevice, string> = {
  apple: "iOS",
  android: "Android",
  other: "Unknown",
};

// Splits on code points so a surrogate pair is never cut in half, keeping each
// chunk's UTF-16 length (what Notion measures) within the limit.
function chunkText(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let current = "";
  for (const char of text) {
    if (current.length + char.length > maxLength) {
      chunks.push(current);
      current = "";
    }
    current += char;
  }
  if (current !== "") {
    chunks.push(current);
  }
  return chunks;
}

function titleFor(message: ContactMessage): string {
  const excerpt = Array.from(message.message.replace(/\s+/g, " "))
    .slice(0, TITLE_EXCERPT_LENGTH)
    .join("");
  return `${CATEGORY_LABEL[message.category]}: ${excerpt}`;
}

export default class ContactFeedbackRepositoryData {
  // Two integrations with least privilege each: submissions insert only, the
  // retention job reads and updates.
  private submitClient: Client | null = null;
  private retentionClient: Client | null = null;

  private getSubmitClient(): Client {
    const token = readNotionFeedbackToken();
    if (token === null) {
      throw new ContactServiceUnconfiguredError();
    }
    this.submitClient ??= new Client({auth: token});
    return this.submitClient;
  }

  private getRetentionClient(): Client {
    const token = readNotionRetentionToken();
    if (token === null) {
      throw new ContactServiceUnconfiguredError();
    }
    this.retentionClient ??= new Client({auth: token});
    return this.retentionClient;
  }

  async createFeedback(message: ContactMessage, submittedAt: Date): Promise<void> {
    const client = this.getSubmitClient();
    await client.pages.create({
      parent: {type: "data_source_id", data_source_id: FEEDBACK_DATA_SOURCE_ID},
      properties: {
        [PROP.name]: {title: [{text: {content: titleFor(message)}}]},
        [PROP.source]: {select: {name: SOURCE_CONTACT_FORM}},
        [PROP.status]: {select: {name: "Open"}},
        [PROP.submitted]: {date: {start: submittedAt.toISOString()}},
        [PROP.platform]: {
          select: {name: message.device === null ? "Unknown" : PLATFORM_BY_DEVICE[message.device]},
        },
        [PROP.feedbackClass]: {rich_text: [{text: {content: message.category}}]},
        [PROP.replyEmail]: {email: message.email},
        [PROP.contactName]: {
          rich_text: message.name === null ? [] : [{text: {content: message.name}}],
        },
      },
      children: chunkText(message.message, NOTION_TEXT_MAX_LENGTH).map((chunk) => ({
        type: "paragraph" as const,
        paragraph: {rich_text: [{type: "text" as const, text: {content: chunk}}]},
      })),
    });
  }

  // Clears Reply Email and Contact Name on contact-form rows submitted before
  // `cutoff`; every other property stays. All matching ids are collected before the first write
  // because clearing a row drops it from the filter, which would shift a live
  // cursor past rows not yet seen.
  async clearSenderDetailsSubmittedBefore(cutoff: Date): Promise<void> {
    const client = this.getRetentionClient();
    const rows = await collectPaginatedAPI(client.dataSources.query, {
      data_source_id: FEEDBACK_DATA_SOURCE_ID,
      filter: {
        and: [
          {property: PROP.source, select: {equals: SOURCE_CONTACT_FORM}},
          {property: PROP.submitted, date: {before: cutoff.toISOString()}},
          {
            or: [
              {property: PROP.replyEmail, email: {is_not_empty: true}},
              {property: PROP.contactName, rich_text: {is_not_empty: true}},
            ],
          },
        ],
      },
      page_size: 100,
    });

    // Sequential: Notion allows about three requests a second per integration,
    // and the SDK's own retry handles the occasional 429.
    for (const row of rows) {
      await client.pages.update({
        page_id: row.id,
        properties: {
          [PROP.replyEmail]: {email: null},
          [PROP.contactName]: {rich_text: []},
        },
      });
    }
  }
}
