import {getTranslations} from "next-intl/server";

// Renders tag pills. Tags are stored as language-neutral slugs on the Notion
// row; the display label comes from the `Tags` message namespace per locale.
// A slug with no mapping is a HARD ERROR — it throws during SSG so the build
// fails loudly instead of silently shipping a raw slug (add the label to the
// `Tags` namespace in every messages/<locale>.json to fix).
export default async function TagList({
  tags,
  locale,
}: Readonly<{
  tags: string[];
  locale: string;
}>) {
  if (tags.length === 0) {
    return null;
  }

  const t = await getTranslations({locale, namespace: "Tags"});

  for (const slug of tags) {
    if (!t.has(slug)) {
      throw new Error(
        `[blog] Missing tag label for slug "${slug}" (locale "${locale}"). ` +
          `Add "Tags.${slug}" to every messages/<locale>.json.`,
      );
    }
  }

  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {tags.map((slug) => (
        <li
          key={slug}
          className="rounded-full bg-stone-200 px-3 py-1 text-xs text-stone-700"
        >
          {t(slug)}
        </li>
      ))}
    </ul>
  );
}
