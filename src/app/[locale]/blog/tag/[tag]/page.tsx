import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {getTranslations, setRequestLocale} from "next-intl/server";
import AppFooter from "@/presentation/app_components/app_footer";
import AppNav from "@/presentation/app_components/app_nav";
import TagList from "@/presentation/app_components/tag_list";
import {Link} from "@/i18n/navigation";
import {buildAlternates} from "@/i18n/alternates";
import BlogRepository from "@/domain/blog_repository";

// Regenerate hourly (ISR) — refreshes the tag's post list.
export const revalidate = 3600;

// A tag page with fewer posts than this is noindex: it nearly duplicates the
// single post it lists, so we don't want it competing in search. It still
// renders and is reachable (tag pills link to it) — just not indexed.
// Keep in sync with TAG_MIN_POSTS in src/app/sitemap.ts.
const MIN_TAG_POSTS = 2;

type Props = {
  params: Promise<{locale: string; tag: string}>;
};

// One page per (locale, tag) that actually has a published post.
export async function generateStaticParams() {
  return BlogRepository.getTagLocalePairs();
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

// The tag's display label for this locale, or null when the slug has no label
// (an unknown tag → the page 404s rather than showing a raw slug).
async function tagLabel(locale: string, tag: string): Promise<string | null> {
  const t = await getTranslations({locale, namespace: "Tags"});
  return t.has(tag) ? t(tag) : null;
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale, tag} = await params;
  const label = await tagLabel(locale, tag);
  if (!label) {
    return {robots: {index: false, follow: false}};
  }

  const [tBlog, posts, localesForTag] = await Promise.all([
    getTranslations({locale, namespace: "Blog"}),
    BlogRepository.getPostsByTag(tag, locale),
    BlogRepository.getLocalesForTag(tag),
  ]);

  return {
    title: tBlog("taggedTitle", {tag: label}),
    alternates: buildAlternates(locale, `/blog/tag/${tag}`, localesForTag),
    // Thin tag pages stay out of the index but still pass link equity through.
    robots: posts.length < MIN_TAG_POSTS ? {index: false, follow: true} : undefined,
  };
}

export default async function BlogTagPage({params}: Props) {
  const {locale, tag} = await params;
  setRequestLocale(locale);

  const label = await tagLabel(locale, tag);
  const posts = label ? await BlogRepository.getPostsByTag(tag, locale) : [];
  if (!label || posts.length === 0) {
    notFound();
  }

  const tBlog = await getTranslations({locale, namespace: "Blog"});

  return (
    <main className="relative mx-auto min-h-screen max-w-3xl">
      <AppNav/>
      <div className="my-8">
        <Link
          href="/blog"
          className="text-sm text-stone-500 transition-colors hover:text-stone-800"
        >
          ← {tBlog("back")}
        </Link>
        <h2 className="mt-4 mb-6 text-2xl font-bold">
          {tBlog("taggedTitle", {tag: label})}
        </h2>

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
      </div>
      <AppFooter/>
    </main>
  );
}
