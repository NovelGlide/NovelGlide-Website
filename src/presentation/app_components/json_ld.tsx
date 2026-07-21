import {SITE_URL} from "@/config/site";
import {toBcp47} from "@/i18n/alternates";
import {APP_STORE_URL, PLAY_BASE} from "@/presentation/app_components/store_buttons";
import type {BlogPostMeta} from "@/domain/blog_post";

// Schema.org JSON-LD helpers. Renders a <script type="application/ld+json">
// (Next.js's recommended structured-data approach). Multiple blocks per page are
// fine — Google reads them all. Ratings are deliberately NOT emitted (no verified
// data; fabricated aggregateRating is a manual-action risk).

const LOGO_URL = `${SITE_URL}/images/app_icon.png`;

const ORG = {
  "@type": "Organization",
  name: "NovelGlide",
  url: SITE_URL,
  logo: LOGO_URL,
} as const;

export function JsonLd({data}: Readonly<{data: object}>) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{__html: JSON.stringify(data)}}
    />
  );
}

export function organizationLd() {
  return {"@context": "https://schema.org", ...ORG};
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "NovelGlide",
    url: SITE_URL,
    publisher: ORG,
  };
}

export function mobileAppLd() {
  return {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: "NovelGlide",
    applicationCategory: "BooksApplication",
    operatingSystem: "iOS, Android",
    url: SITE_URL,
    downloadUrl: [APP_STORE_URL, PLAY_BASE],
    offers: {"@type": "Offer", price: "0", priceCurrency: "USD"},
    publisher: ORG,
  };
}

export function blogPostingLd(post: BlogPostMeta, canonicalPath: string) {
  const url = `${SITE_URL}${canonicalPath}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date || undefined,
    dateModified: post.date || undefined,
    inLanguage: toBcp47(post.locale),
    image: post.coverUrl ?? LOGO_URL,
    author: ORG,
    publisher: {
      ...ORG,
      logo: {"@type": "ImageObject", url: LOGO_URL},
    },
    mainEntityOfPage: {"@type": "WebPage", "@id": url},
  };
}

export function breadcrumbLd(items: Readonly<{name: string; url: string}>[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
