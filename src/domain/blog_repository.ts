import BlogRepositoryData from "@/data/blog_repository_data";
import type {BlogPostMeta} from "@/domain/blog_post";

// Static facade over the Notion-backed blog data source (mirrors HttpRepository).
// The single shared instance keeps the resolved data source id module-cached.
export default class BlogRepository {
  private static data = new BlogRepositoryData();

  // Every published row, all locales, Date-descending.
  static getPublishedPosts(): Promise<BlogPostMeta[]> {
    return this.data.getPublishedPosts();
  }

  // Published rows for one locale only — the listing does NOT fall back to other
  // locales, keeping each locale's index coherent (no duplicate content).
  static getPostsForLocale(locale: string): Promise<BlogPostMeta[]> {
    return this.data.getPostsForLocale(locale);
  }

  // The single published row matching both slug and locale, or null.
  static getPost(slug: string, locale: string): Promise<BlogPostMeta | null> {
    return this.data.getPost(slug, locale);
  }

  // Locales that have a published row for this slug (hreflang + static params).
  static getTranslationLocales(slug: string): Promise<string[]> {
    return this.data.getTranslationLocales(slug);
  }

  // The page body converted to a Markdown string.
  static getPostMarkdown(pageId: string): Promise<string> {
    return this.data.getPostMarkdown(pageId);
  }
}
