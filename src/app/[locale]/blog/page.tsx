import type {Metadata} from "next";
import {getTranslations, setRequestLocale} from "next-intl/server";
import AppFooter from "@/presentation/app_components/app_footer";
import AppNav from "@/presentation/app_components/app_nav";
import TagList from "@/presentation/app_components/tag_list";
import BrowseByTopic from "@/presentation/app_components/browse_by_topic";
import {Link} from "@/i18n/navigation";
import {routing} from "@/i18n/routing";
import {buildAlternates, localizedPath} from "@/i18n/alternates";
import BlogRepository from "@/domain/blog_repository";

// Regenerate hourly (ISR) — refreshes published posts + Notion signed image URLs.
export const revalidate = 3600;

type Props = {
  params: Promise<{locale: string}>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Blog"});

  return {
    title: t("title"),
    // The index exists in every locale → default availableLocales (all).
    alternates: {
      ...buildAlternates(locale, "/blog"),
      // Advertise the per-locale RSS feed for autodiscovery.
      types: {"application/rss+xml": localizedPath(locale, "/blog/rss.xml")},
    },
  };
}

// Locale-agnostic date formatting keeps prerender deterministic.
function formatDate(date: string): string {
  if (!date) {
    return "";
  }
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toISOString().slice(0, 10);
}

export default async function BlogIndexPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);

  const t = await getTranslations({locale, namespace: "Blog"});
  const posts = await BlogRepository.getPostsForLocale(locale);

  // Tag counts for the "Browse by topic" strip, most-used first.
  const tagCounts = (() => {
    const counts = new Map<string, number>();
    for (const post of posts) {
      for (const tag of post.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([slug, count]) => ({slug, count}))
      .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));
  })();

  return (
    <main className="relative mx-auto min-h-screen max-w-3xl">
      <AppNav/>
      <div className="my-8">
        <h2 className="text-2xl font-bold mb-6">{t("title")}</h2>

        <BrowseByTopic tags={tagCounts} locale={locale}/>

        {posts.length === 0 ? (
          <p className="text-stone-500">{t("empty")}</p>
        ) : (
          <ul className="flex flex-col gap-6">
            {posts.map((post) => (
              <li
                key={post.pageId}
                className="rounded-[2rem] border border-stone-200 p-5 transition-colors hover:border-stone-300 hover:bg-white"
              >
                <Link href={`/blog/${post.slug}`} className="group block">
                  <h3 className="text-xl font-semibold group-hover:underline">
                    {post.title}
                  </h3>
                  {post.date && (
                    <time
                      dateTime={post.date}
                      className="mt-1 block text-sm text-stone-500"
                    >
                      {formatDate(post.date)}
                    </time>
                  )}
                  {post.description && (
                    <p className="mt-2 leading-7 text-stone-700">
                      {post.description}
                    </p>
                  )}
                </Link>
                <TagList tags={post.tags} locale={locale}/>
              </li>
            ))}
          </ul>
        )}
      </div>
      <AppFooter/>
    </main>
  );
}
