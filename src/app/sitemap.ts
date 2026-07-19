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
  const staticPaths = ["", "/blog", "/locale", "/privacy-policy"];
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

  return entries;
}
