import type {MetadataRoute} from "next";
import {routing} from "@/i18n/routing";
import {buildAlternates} from "@/i18n/alternates";
import {SITE_URL} from "@/config/site";
import BlogRepository from "@/domain/blog_repository";

// Dynamic sitemap (replaces next-sitemap): reuses BlogRepository so blog posts
// are listed, and emits native hreflang alternates per URL. Regenerate hourly.
export const revalidate = 3600;

// One <url> entry per (locale, path). `availableLocales` scopes the hreflang set
// (all locales for static pages; only real translations for a blog post).
function entry(
  locale: string,
  path: string,
  availableLocales: string[],
  lastModified?: string,
): MetadataRoute.Sitemap[number] {
  const alt = buildAlternates(locale, path, availableLocales);
  const languages: Record<string, string> = {};
  for (const [hreflang, relative] of Object.entries(alt.languages)) {
    languages[hreflang] = `${SITE_URL}${relative}`;
  }
  return {
    url: `${SITE_URL}${alt.canonical}`,
    lastModified: lastModified || undefined,
    alternates: {languages},
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const allLocales = [...routing.locales];
  const staticPaths = ["", "/blog", "/locale", "/privacy-policy", "/download"];
  const entries: MetadataRoute.Sitemap = [];

  // Static pages exist in every locale.
  for (const path of staticPaths) {
    for (const locale of allLocales) {
      entries.push(entry(locale, path, allLocales));
    }
  }

  // Blog posts — only the locales that actually have each slug get a URL, and
  // each post's hreflang set lists exactly those translations (no phantom pages).
  const posts = await BlogRepository.getPublishedPosts();
  const localesBySlug = new Map<string, string[]>();
  for (const post of posts) {
    const locales = localesBySlug.get(post.slug) ?? [];
    locales.push(post.locale);
    localesBySlug.set(post.slug, locales);
  }
  for (const post of posts) {
    const locales = localesBySlug.get(post.slug) ?? [post.locale];
    entries.push(entry(post.locale, `/blog/${post.slug}`, locales, post.date || undefined));
  }

  // Tag hub pages — only (locale, tag) with >= 2 posts are indexable (thinner tag
  // pages are noindex, see the tag route), so only those enter the sitemap. Keep
  // this threshold in sync with MIN_TAG_POSTS in the tag route.
  const TAG_MIN_POSTS = 2;
  const countByLocaleTag = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) {
      const key = `${post.locale}\t${tag}`;
      countByLocaleTag.set(key, (countByLocaleTag.get(key) ?? 0) + 1);
    }
  }
  const indexableLocalesByTag = new Map<string, string[]>();
  for (const [key, count] of countByLocaleTag) {
    if (count >= TAG_MIN_POSTS) {
      const [locale, tag] = key.split("\t");
      indexableLocalesByTag.set(tag, [...(indexableLocalesByTag.get(tag) ?? []), locale]);
    }
  }
  for (const [key, count] of countByLocaleTag) {
    if (count >= TAG_MIN_POSTS) {
      const [locale, tag] = key.split("\t");
      const locales = indexableLocalesByTag.get(tag) ?? [locale];
      entries.push(entry(locale, `/blog/tag/${tag}`, locales));
    }
  }

  return entries;
}
