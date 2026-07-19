import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {setRequestLocale} from "next-intl/server";
import AppFooter from "@/presentation/app_components/app_footer";
import AppNav from "@/presentation/app_components/app_nav";
import MarkdownViewer from "@/presentation/markdown_viewer/markdown_viewer";
import {buildAlternates} from "@/i18n/alternates";
import BlogRepository from "@/domain/blog_repository";

// Regenerate hourly (ISR) — refreshes body + Notion signed image URLs (~1h TTL).
export const revalidate = 3600;

type Props = {
  params: Promise<{locale: string; slug: string}>;
};

// One entry per published row → only real translations get a page (the
// no-duplicate-content mechanism). Empty (no token locally) yields zero pages.
export async function generateStaticParams() {
  const posts = await BlogRepository.getPublishedPosts();
  return posts.map((post) => ({locale: post.locale, slug: post.slug}));
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale, slug} = await params;
  const locales = await BlogRepository.getTranslationLocales(slug);
  const post = await BlogRepository.getPost(slug, locale);

  if (!post) {
    return {};
  }

  // hreflang lists ONLY the locales that actually have this post (+ x-default).
  const alternates = buildAlternates(locale, `/blog/${slug}`, locales);
  const images = post.coverUrl ? [post.coverUrl] : undefined;

  return {
    title: post.title,
    description: post.description,
    alternates,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.date || undefined,
      images,
      url: alternates.canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images,
    },
  };
}

function formatDate(date: string): string {
  if (!date) {
    return "";
  }
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toISOString().slice(0, 10);
}

export default async function BlogPostPage({params}: Props) {
  const {locale, slug} = await params;
  setRequestLocale(locale);

  const post = await BlogRepository.getPost(slug, locale);
  if (!post) {
    notFound();
  }

  const markdown = await BlogRepository.getPostMarkdown(post.pageId);

  return (
    <main className="relative mx-auto min-h-screen max-w-3xl">
      <AppNav/>
      <article className="my-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">{post.title}</h1>
          {post.date && (
            <time
              dateTime={post.date}
              className="mt-2 block text-sm text-stone-500"
            >
              {formatDate(post.date)}
            </time>
          )}
          {post.tags.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-stone-200 px-3 py-1 text-xs text-stone-700"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </header>
        <MarkdownViewer content={markdown}/>
      </article>
      <AppFooter/>
    </main>
  );
}
