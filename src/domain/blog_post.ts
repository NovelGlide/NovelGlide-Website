// Locale-scoped metadata for one blog post row (one article × one locale).
// Rows sharing the same `slug` are translations of a single post.
export type BlogPostMeta = {
  pageId: string;
  slug: string;
  locale: string;
  title: string;
  description: string;
  date: string; // ISO date (Notion `Date.start`); '' when unset.
  tags: string[];
  coverUrl: string | null;
};
