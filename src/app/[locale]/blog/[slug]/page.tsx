import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {getTranslations, setRequestLocale} from "next-intl/server";
import {ArrowLeft} from "lucide-react";
import AppFooter from "@/presentation/app_components/app_footer";
import AppNav from "@/presentation/app_components/app_nav";
import TagList from "@/presentation/app_components/tag_list";
import MarkdownViewer from "@/presentation/markdown_viewer/markdown_viewer";
import {Link} from "@/i18n/navigation";
import {buildAlternates, localizedPath} from "@/i18n/alternates";
import {SITE_URL} from "@/config/site";
import {JsonLd, blogPostingLd, breadcrumbLd} from "@/presentation/app_components/json_ld";
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

  // og:image / twitter:image come from the co-located opengraph-image route
  // (cover-if-present, else a generated title card).
  return {
    title: post.title,
    description: post.description,
    alternates,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.date || undefined,
      url: alternates.canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
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
  const tBlog = await getTranslations({locale, namespace: "Blog"});

  const canonicalPath = localizedPath(locale, `/blog/${slug}`);
  const breadcrumb = breadcrumbLd([
    {name: "NovelGlide", url: `${SITE_URL}${localizedPath(locale, "")}`},
    {name: tBlog("title"), url: `${SITE_URL}${localizedPath(locale, "/blog")}`},
    {name: post.title, url: `${SITE_URL}${canonicalPath}`},
  ]);

  return (
    <main className="relative mx-auto min-h-screen max-w-3xl">
      <JsonLd data={blogPostingLd(post, canonicalPath)}/>
      <JsonLd data={breadcrumb}/>
      <AppNav/>
      <article className="my-8">
        <Link
          href="/blog"
          className="mb-6 inline-flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-stone-700"
        >
          <ArrowLeft className="h-4 w-4"/>
          {tBlog("back")}
        </Link>
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
          <TagList tags={post.tags} locale={locale}/>
        </header>
        <MarkdownViewer content={markdown}/>
      </article>
      <AppFooter/>
    </main>
  );
}
