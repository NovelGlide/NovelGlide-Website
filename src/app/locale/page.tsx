import AppFooter from "@/presentation/app_components/app_footer";
import AppNav from "@/presentation/app_components/app_nav";
import SupportedLocales from "@/i18n/support_locales";
import LocaleButton from "@/app/locale/components/locale_button";
import {useTranslations} from "next-intl";
import {getTranslations} from "next-intl/server";

type Props = {
  params: {
    locale: string,
  }
}

export async function generateMetadata(params: Props): Promise<object> {
  const {locale} = params.params;
  const t = await getTranslations({locale, namespace: 'Locales'}); // Load translations for metadata

  return {
    title: t('title'),
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
            items-center
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
