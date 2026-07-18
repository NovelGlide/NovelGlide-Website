import {defaultLocale, supportedLocales} from '@/i18n/support_locales';

// Map a next-intl locale slug to its BCP-47 hreflang value.
// en -> en, ja -> ja, zh-tw -> zh-TW, zh-cn -> zh-CN.
const bcp47ByLocale: Record<string, string> = {
  'en': 'en',
  'ja': 'ja',
  'zh-tw': 'zh-TW',
  'zh-cn': 'zh-CN',
};

export function toBcp47(locale: string): string {
  return bcp47ByLocale[locale] ?? locale;
}

// Build the locale-prefixed path honouring `localePrefix: 'as-needed'`:
// the default locale has no prefix, every other locale is prefixed with /<locale>.
// `pathname` is the locale-agnostic path ('' for home, '/privacy-policy', ...).
function localizedPath(locale: string, pathname: string): string {
  const prefix = locale === defaultLocale ? '' : `/${locale}`;
  const path = `${prefix}${pathname}`;
  return path === '' ? '/' : path;
}

export type Alternates = {
  canonical: string;
  languages: Record<string, string>;
};

// Reusable hreflang + canonical builder for a page's `generateMetadata`.
// - `canonical` is ALWAYS self-referential to the given locale's own URL.
// - `languages` lists every available locale (self included) plus `x-default`
//   pointing at the default-locale (en) URL.
// Returned paths are relative; they resolve to absolute URLs via `metadataBase`.
// `availableLocales` defaults to all supported locales (static site pages);
// Phase 2 blog pages can pass a subset.
export function buildAlternates(
  locale: string,
  pathname: string,
  availableLocales: string[] = supportedLocales,
): Alternates {
  const languages: Record<string, string> = {};

  for (const loc of availableLocales) {
    languages[toBcp47(loc)] = localizedPath(loc, pathname);
  }

  languages['x-default'] = localizedPath(defaultLocale, pathname);

  return {
    canonical: localizedPath(locale, pathname),
    languages,
  };
}
