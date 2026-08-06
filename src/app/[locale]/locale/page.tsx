import type { Metadata } from "next";
import AppFooter from "@/presentation/app_components/app_footer";
import AppNav from "@/presentation/app_components/app_nav";
import SupportedLocales from "@/i18n/support_locales";
import LocaleButton from "@/app/[locale]/locale/components/locale_button";
import {useTranslations} from "next-intl";
import {getTranslations} from "next-intl/server";
import {buildAlternates} from "@/i18n/alternates";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'Locales'}); // Load translations for metadata

  return {
    title: t('title'),
    alternates: buildAlternates(locale, '/locale'),
    // Pure UI chrome (a language-switcher) with no unique content of its own —
    // stays reachable and crawlable (follow: true) but shouldn't compete for
    // a search result. Same reasoning as thin blog-tag pages
    // (src/app/[locale]/blog/tag/[tag]/page.tsx); kept out of the sitemap too
    // (see src/app/sitemap.ts).
    robots: {index: false, follow: true},
  };
}

export default function Home() {
  const t = useTranslations('Locales');
  return (
    <main className="relative mx-auto min-h-screen max-w-3xl">
      <AppNav/>
      <div className="text-center">
        <h2
          className="text-2xl font-bold"
        >
          {t("title")}
        </h2>
        <div
          className="
            flex
            flex-wrap
            items-stretch
            justify-center
            my-8
            gap-8
          "
        >
          {Object.keys(SupportedLocales).map((key: string) => {
            const locale: SupportedLocales = SupportedLocales[key as keyof typeof SupportedLocales];
            return (<LocaleButton key={locale} locale={locale}/>);
          })}
        </div>
      </div>
      <AppFooter/>
    </main>
  );
}
