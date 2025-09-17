import AppFooter from "@/app/app_sections/app_footer";
import AppNav from "@/app/app_sections/app_nav";
import SupportedLocales from "@/i18n/support_locales";
import LocaleButton from "@/app/locale/components/locale_button";
import {useTranslations} from "next-intl";

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
