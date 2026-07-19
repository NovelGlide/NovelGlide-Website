import {getTranslations} from "next-intl/server";
import {routing} from "@/i18n/routing";
import {localizedPath, toBcp47} from "@/i18n/alternates";
import {SITE_URL} from "@/config/site";
import BlogRepository from "@/domain/blog_repository";

// Per-locale RSS feed at /[locale]/blog/rss.xml (en is prefix-free: /blog/rss.xml).
// Regenerate hourly, alongside the blog pages.
export const revalidate = 3600;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

// Escape the five XML predefined entities for text nodes.
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function absolute(locale: string, pathname: string): string {
  return `${SITE_URL}${localizedPath(locale, pathname)}`;
}

type RouteContext = {params: Promise<{locale: string}>};

export async function GET(_request: Request, {params}: RouteContext): Promise<Response> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Blog"});
  const posts = await BlogRepository.getPostsForLocale(locale);

  const channelTitle = `${t("title")} · NovelGlide`;
  const channelLink = absolute(locale, "/blog");
  const feedUrl = absolute(locale, "/blog/rss.xml");

  const items = posts
    .map((post) => {
      const url = absolute(locale, `/blog/${post.slug}`);
      const pubDate = post.date ? new Date(post.date).toUTCString() : "";
      return [
        "    <item>",
        `      <title>${esc(post.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        pubDate ? `      <pubDate>${pubDate}</pubDate>` : "",
        post.description ? `      <description>${esc(post.description)}</description>` : "",
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(channelTitle)}</title>
    <link>${channelLink}</link>
    <description>${esc(channelTitle)}</description>
    <language>${toBcp47(locale)}</language>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
