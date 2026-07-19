import {Client, isFullPage} from "@notionhq/client";
import type {PageObjectResponse} from "@notionhq/client";
import {NotionToMarkdown} from "notion-to-md";
import type {BlogPostMeta} from "@/domain/blog_post";

// Notion property value narrowed to a single page's properties map.
type PageProperty = PageObjectResponse["properties"][string];

// The `filter` shape accepted by dataSources.query — derived from the SDK type
// so it stays correct instead of using a loose Record.
type QueryFilter = NonNullable<
  Parameters<Client["dataSources"]["query"]>[0]["filter"]
>;

// Property names on the "Blog Posts" Notion database.
const PROP = {
  title: "Title",
  slug: "Slug",
  locale: "Locale",
  status: "Status",
  date: "Date",
  description: "Description",
  cover: "Cover",
  tags: "Tags",
} as const;

export default class BlogRepositoryData {
  private readonly token = process.env.NOTION_BLOG_TOKEN ?? "";
  private readonly databaseId = process.env.NOTION_BLOG_DB_ID ?? "";

  // Lazily-constructed, module-cached singletons. Absent when config is missing.
  private client: Client | null = null;
  private n2m: NotionToMarkdown | null = null;
  private dataSourceIdPromise: Promise<string | null> | null = null;
  private warnedMissingConfig = false;

  // Returns the client, or null (logging once) when the token/DB id is missing.
  // Missing config is expected locally (the token is a Vercel-only secret) — every
  // caller degrades to empty rather than throwing so `next build` still succeeds.
  private getClient(): Client | null {
    if (!this.token || !this.databaseId) {
      if (!this.warnedMissingConfig) {
        console.warn(
          "[blog] NOTION_BLOG_TOKEN / NOTION_BLOG_DB_ID missing — blog data disabled.",
        );
        this.warnedMissingConfig = true;
      }
      return null;
    }
    if (!this.client) {
      this.client = new Client({auth: this.token});
    }
    return this.client;
  }

  private getNotionToMarkdown(client: Client): NotionToMarkdown {
    if (!this.n2m) {
      this.n2m = new NotionToMarkdown({notionClient: client});
    }
    return this.n2m;
  }

  // Resolve the DB's first data source id once (v5 data-source query model).
  private getDataSourceId(client: Client): Promise<string | null> {
    if (!this.dataSourceIdPromise) {
      this.dataSourceIdPromise = (async () => {
        try {
          const db = await client.databases.retrieve({database_id: this.databaseId});
          if ("data_sources" in db && db.data_sources.length > 0) {
            return db.data_sources[0].id;
          }
          console.warn("[blog] database has no data sources.");
          return null;
        } catch (error) {
          console.warn("[blog] failed to resolve data source id:", error);
          return null;
        }
      })();
    }
    return this.dataSourceIdPromise;
  }

  // Query every published row, paginating until exhausted. `localeEquals` narrows
  // to one Locale; omit it for all locales.
  private async queryPublished(localeEquals?: string): Promise<BlogPostMeta[]> {
    const client = this.getClient();
    if (!client) {
      return [];
    }

    try {
      const dataSourceId = await this.getDataSourceId(client);
      if (!dataSourceId) {
        return [];
      }

      const publishedFilter: QueryFilter = localeEquals
        ? {
            and: [
              {property: PROP.status, select: {equals: "Published"}},
              {property: PROP.locale, select: {equals: localeEquals}},
            ],
          }
        : {property: PROP.status, select: {equals: "Published"}};

      const posts: BlogPostMeta[] = [];
      let cursor: string | undefined = undefined;

      do {
        const response = await client.dataSources.query({
          data_source_id: dataSourceId,
          filter: publishedFilter,
          sorts: [{property: PROP.date, direction: "descending"}],
          page_size: 100,
          start_cursor: cursor,
        });

        for (const row of response.results) {
          if (isFullPage(row)) {
            posts.push(this.toMeta(row));
          }
        }

        cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
      } while (cursor);

      return posts;
    } catch (error) {
      console.warn("[blog] query failed:", error);
      return [];
    }
  }

  async getPublishedPosts(): Promise<BlogPostMeta[]> {
    return this.queryPublished();
  }

  async getPostsForLocale(locale: string): Promise<BlogPostMeta[]> {
    return this.queryPublished(locale);
  }

  async getPost(slug: string, locale: string): Promise<BlogPostMeta | null> {
    const posts = await this.queryPublished(locale);
    return posts.find((post) => post.slug === slug) ?? null;
  }

  async getTranslationLocales(slug: string): Promise<string[]> {
    const posts = await this.getPublishedPosts();
    return posts.filter((post) => post.slug === slug).map((post) => post.locale);
  }

  async getPostMarkdown(pageId: string): Promise<string> {
    const client = this.getClient();
    if (!client) {
      return "";
    }
    try {
      const n2m = this.getNotionToMarkdown(client);
      const mdBlocks = await n2m.pageToMarkdown(pageId);
      // TODO(phase-2b): rehost Notion images to avoid ~1h signed-URL expiry.
      return n2m.toMarkdownString(mdBlocks).parent ?? "";
    } catch (error) {
      console.warn("[blog] markdown conversion failed:", error);
      return "";
    }
  }

  // --- Property extraction (defensive: any property may be missing/typed wrong) ---

  private toMeta(page: PageObjectResponse): BlogPostMeta {
    return {
      pageId: page.id,
      slug: this.plainText(page.properties[PROP.slug]),
      locale: this.selectName(page.properties[PROP.locale]),
      title: this.plainText(page.properties[PROP.title]),
      description: this.plainText(page.properties[PROP.description]),
      date: this.dateStart(page.properties[PROP.date]),
      tags: this.multiSelectNames(page.properties[PROP.tags]),
      coverUrl: this.coverUrl(page),
    };
  }

  private plainText(prop: PageProperty | undefined): string {
    if (prop?.type === "title") {
      return prop.title.map((item) => item.plain_text).join("");
    }
    if (prop?.type === "rich_text") {
      return prop.rich_text.map((item) => item.plain_text).join("");
    }
    return "";
  }

  private selectName(prop: PageProperty | undefined): string {
    return prop?.type === "select" ? (prop.select?.name ?? "") : "";
  }

  private dateStart(prop: PageProperty | undefined): string {
    return prop?.type === "date" ? (prop.date?.start ?? "") : "";
  }

  private multiSelectNames(prop: PageProperty | undefined): string[] {
    return prop?.type === "multi_select" ? prop.multi_select.map((item) => item.name) : [];
  }

  private coverUrl(page: PageObjectResponse): string | null {
    const prop = page.properties[PROP.cover];
    if (prop?.type === "files" && prop.files.length > 0) {
      const first = prop.files[0];
      if (first.type === "file") {
        return first.file.url;
      }
      if (first.type === "external") {
        return first.external.url;
      }
    }
    // Fall back to the page cover image.
    const cover = page.cover;
    if (cover?.type === "file") {
      return cover.file.url;
    }
    if (cover?.type === "external") {
      return cover.external.url;
    }
    return null;
  }
}
