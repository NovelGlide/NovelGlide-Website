import {getTranslations} from "next-intl/server";
import {Link} from "@/i18n/navigation";

// A "Browse by topic" strip on the blog index: one pill per tag that has a post
// in this locale, linking to its tag hub, with a post count. A clean tag list —
// deliberately NOT a weighted tag cloud (dated, and meaningless at this scale).
// Tags without a label are skipped here (TagList already fails the build loudly
// on a missing label, so this doesn't need to re-enforce it).
export default async function BrowseByTopic({
  tags,
  locale,
}: Readonly<{tags: {slug: string; count: number}[]; locale: string}>) {
  if (tags.length === 0) {
    return null;
  }

  const tBlog = await getTranslations({locale, namespace: "Blog"});
  const tTags = await getTranslations({locale, namespace: "Tags"});
  const labelled = tags.filter((tag) => tTags.has(tag.slug));
  if (labelled.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <h3 className="mb-3 text-sm font-semibold text-stone-500">
        {tBlog("browseByTopic")}
      </h3>
      <ul className="flex flex-wrap gap-2">
        {labelled.map((tag) => (
          <li key={tag.slug}>
            <Link
              href={`/blog/tag/${tag.slug}`}
              className="inline-block rounded-full bg-stone-200 px-3 py-1 text-sm text-stone-700 transition-colors hover:bg-stone-300"
            >
              {tTags(tag.slug)}{" "}
              <span className="text-stone-500">({tag.count})</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
